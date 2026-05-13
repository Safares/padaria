// src/routes/vendas.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /vendas — lista com filtros
router.get('/', async (req, res) => {
  try {
    const { status, cliente_id, funcionario_id, data_inicio, data_fim } = req.query;

    let query = `
      SELECT
        v.id, v.data_venda, v.total, v.forma_pagamento,
        v.tipo_venda, v.status,
        c.id   AS cliente_id,   c.nome AS cliente,
        f.id   AS funcionario_id, f.nome AS funcionario
      FROM venda v
      JOIN cliente     c ON c.id = v.cliente_id
      JOIN funcionario f ON f.id = v.funcionario_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      query += ` AND v.status = $${params.length}`;
    }
    if (cliente_id) {
      params.push(cliente_id);
      query += ` AND v.cliente_id = $${params.length}`;
    }
    if (funcionario_id) {
      params.push(funcionario_id);
      query += ` AND v.funcionario_id = $${params.length}`;
    }
    if (data_inicio) {
      params.push(data_inicio);
      query += ` AND v.data_venda >= $${params.length}`;
    }
    if (data_fim) {
      params.push(data_fim);
      query += ` AND v.data_venda <= $${params.length}`;
    }

    query += ' ORDER BY v.data_venda DESC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /vendas/:id — venda completa com itens
router.get('/:id', async (req, res) => {
  try {
    const { rows: vendaRows } = await db.query(
      `SELECT v.*, c.nome AS cliente, f.nome AS funcionario
       FROM venda v
       JOIN cliente     c ON c.id = v.cliente_id
       JOIN funcionario f ON f.id = v.funcionario_id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!vendaRows.length) return res.status(404).json({ erro: 'Venda não encontrada' });

    const { rows: itens } = await db.query(
      `SELECT iv.id, iv.quantidade, iv.preco_unitario,
              (iv.quantidade * iv.preco_unitario) AS subtotal,
              p.id AS produto_id, p.nome AS produto
       FROM item_venda iv
       JOIN produto p ON p.id = iv.produto_id
       WHERE iv.venda_id = $1`,
      [req.params.id]
    );

    res.json({ ...vendaRows[0], itens });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /vendas — registrar venda completa (com transação + baixa de estoque)
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    const {
      cliente_id,
      funcionario_id,
      forma_pagamento,
      tipo_venda = 'BALCAO',
      status = 'CONCLUIDA',
      itens, // [{ produto_id, quantidade, preco_unitario }]
    } = req.body;

    if (!cliente_id || !funcionario_id || !forma_pagamento || !itens?.length)
      return res.status(400).json({ erro: 'cliente_id, funcionario_id, forma_pagamento e itens são obrigatórios' });

    await client.query('BEGIN');

    // Calcular total
    const total = itens.reduce(
      (acc, item) => acc + Number(item.quantidade) * Number(item.preco_unitario),
      0
    );

    // Inserir venda
    const { rows: vendaRows } = await client.query(
      `INSERT INTO venda (total, forma_pagamento, tipo_venda, status, cliente_id, funcionario_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [total.toFixed(2), forma_pagamento, tipo_venda, status, cliente_id, funcionario_id]
    );
    const venda = vendaRows[0];

    // Inserir itens e baixar estoque
    for (const item of itens) {
      // Verificar estoque
      const { rows: prodRows } = await client.query(
        'SELECT estoque_atual, nome FROM produto WHERE id = $1 AND ativo = TRUE FOR UPDATE',
        [item.produto_id]
      );
      if (!prodRows.length)
        throw new Error(`Produto ${item.produto_id} não encontrado ou inativo`);

      if (prodRows[0].estoque_atual < item.quantidade)
        throw new Error(`Estoque insuficiente para "${prodRows[0].nome}" (disponível: ${prodRows[0].estoque_atual})`);

      // Inserir item_venda
      await client.query(
        `INSERT INTO item_venda (venda_id, produto_id, quantidade, preco_unitario)
         VALUES ($1,$2,$3,$4)`,
        [venda.id, item.produto_id, item.quantidade, item.preco_unitario]
      );

      // Baixar estoque
      await client.query(
        'UPDATE produto SET estoque_atual = estoque_atual - $1 WHERE id = $2',
        [item.quantidade, item.produto_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ mensagem: 'Venda registrada com sucesso', venda_id: venda.id, total });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ erro: err.message });
  } finally {
    client.release();
  }
});

// PATCH /vendas/:id/status — atualizar status (PENDENTE → CONCLUIDA / CANCELADA)
router.patch('/:id/status', async (req, res) => {
  const client = await db.connect();
  try {
    const { status } = req.body;
    const validos = ['PENDENTE', 'CONCLUIDA', 'CANCELADA'];
    if (!validos.includes(status?.toUpperCase()))
      return res.status(400).json({ erro: `Status deve ser um de: ${validos.join(', ')}` });

    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM venda WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ erro: 'Venda não encontrada' }); }

    const venda = rows[0];

    // Se cancelando venda concluída ou pendente (fiado) → estornar estoque
    if (status.toUpperCase() === 'CANCELADA' && (venda.status === 'CONCLUIDA' || venda.status === 'PENDENTE')) {
      const { rows: itens } = await client.query(
        'SELECT produto_id, quantidade FROM item_venda WHERE venda_id = $1',
        [venda.id]
      );
      for (const item of itens) {
        await client.query(
          'UPDATE produto SET estoque_atual = estoque_atual + $1 WHERE id = $2',
          [item.quantidade, item.produto_id]
        );
      }
    }

    const { rows: updated } = await client.query(
      'UPDATE venda SET status = $1 WHERE id = $2 RETURNING *',
      [status.toUpperCase(), req.params.id]
    );

    await client.query('COMMIT');
    res.json(updated[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: err.message });
  } finally {
    client.release();
  }
});

// PATCH /vendas/:id — atualizar forma de pagamento
router.patch('/:id', async (req, res) => {
  try {
    const { forma_pagamento } = req.body;
    const formas_validas = ['DINHEIRO', 'CARTAO_CREDITO', 'PIX', 'FIADO'];
    if (!forma_pagamento || !formas_validas.includes(forma_pagamento.toUpperCase()))
      return res.status(400).json({ erro: `forma_pagamento deve ser: ${formas_validas.join(', ')}` });

    const { rows } = await db.query(
      'UPDATE venda SET forma_pagamento = $1 WHERE id = $2 RETURNING *',
      [forma_pagamento.toUpperCase(), req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Venda não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
