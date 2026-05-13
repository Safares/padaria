const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /fiado — clientes com vendas PENDENTE agrupadas
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        c.id        AS cliente_id,
        c.nome      AS cliente,
        c.telefone,
        COUNT(v.id) AS qtd_vendas,
        SUM(v.total)AS total_fiado
      FROM venda v
      JOIN cliente c ON c.id = v.cliente_id
      WHERE v.status = 'PENDENTE'
      GROUP BY c.id, c.nome, c.telefone
      ORDER BY total_fiado DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /fiado/:cliente_id — vendas pendentes de um cliente (da mais antiga)
router.get('/:cliente_id', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT id, data_venda, total
      FROM venda
      WHERE cliente_id = $1 AND status = 'PENDENTE'
      ORDER BY data_venda ASC
    `, [req.params.cliente_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /fiado/pagar — quita vendas da mais antiga até cobrir o valor informado
router.post('/pagar', async (req, res) => {
  const client = await db.connect();
  try {
    const { cliente_id, valor } = req.body;
    if (!cliente_id || !valor || Number(valor) <= 0)
      return res.status(400).json({ erro: 'cliente_id e valor (> 0) são obrigatórios' });

    await client.query('BEGIN');

    const { rows: vendas } = await client.query(`
      SELECT id, total FROM venda
      WHERE cliente_id = $1 AND status = 'PENDENTE'
      ORDER BY data_venda ASC
      FOR UPDATE
    `, [cliente_id]);

    if (!vendas.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'Nenhuma venda pendente para este cliente' });
    }

    let restante = Number(valor);
    const quitadas = [];

    for (const v of vendas) {
      if (restante <= 0) break;
      if (restante >= Number(v.total)) {
        await client.query(
          "UPDATE venda SET status = 'CONCLUIDA' WHERE id = $1",
          [v.id]
        );
        quitadas.push(v.id);
        restante -= Number(v.total);
      } else {
        // Pagamento parcial — reduz o saldo da venda mais antiga
        await client.query(
          'UPDATE venda SET total = total - $1 WHERE id = $2',
          [restante, v.id]
        );
        restante = 0;
      }
    }

    await client.query('COMMIT');

    const totalFiado   = vendas.reduce((acc, v) => acc + Number(v.total), 0);
    const valorAplicado = Number(valor) - restante;

    res.json({
      mensagem:        `${quitadas.length} venda(s) quitada(s)`,
      vendas_quitadas: quitadas.length,
      valor_aplicado:  valorAplicado.toFixed(2),
      troco:           restante.toFixed(2),
      fiado_restante:  (totalFiado - valorAplicado).toFixed(2),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
