// src/routes/relatorios.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /relatorios/dashboard — resumo do dia atual
router.get('/dashboard', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];

    const [vendasHoje, vendasFiado, produtosBaixo, ultimasVendas] = await Promise.all([

      // Total vendido hoje (concluídas)
      db.query(`
        SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS qtd
        FROM venda
        WHERE status = 'CONCLUIDA'
          AND data_venda::date = $1
      `, [hoje]),

      // Total fiado em aberto
      db.query(`
        SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS qtd
        FROM venda
        WHERE tipo_venda = 'FIADO' AND status = 'PENDENTE'
      `),

      // Produtos com estoque baixo (≤ 10)
      db.query(`
        SELECT id, nome, estoque_atual
        FROM produto
        WHERE ativo = TRUE AND estoque_atual <= 10
        ORDER BY estoque_atual
      `),

      // Últimas 10 vendas
      db.query(`
        SELECT v.id, v.data_venda, v.total, v.status, v.forma_pagamento, c.nome AS cliente
        FROM venda v
        JOIN cliente c ON c.id = v.cliente_id
        ORDER BY v.data_venda DESC
        LIMIT 10
      `),
    ]);

    res.json({
      vendas_hoje: {
        total: Number(vendasHoje.rows[0].total),
        quantidade: Number(vendasHoje.rows[0].qtd),
      },
      fiado_aberto: {
        total: Number(vendasFiado.rows[0].total),
        quantidade: Number(vendasFiado.rows[0].qtd),
      },
      produtos_estoque_baixo: produtosBaixo.rows,
      ultimas_vendas: ultimasVendas.rows,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /relatorios/vendas-por-dia?dias=7
router.get('/vendas-por-dia', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;
    const { rows } = await db.query(`
      SELECT
        data_venda::date          AS data,
        COUNT(*)                  AS quantidade,
        COALESCE(SUM(total), 0)   AS total
      FROM venda
      WHERE status = 'CONCLUIDA'
        AND data_venda >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY data_venda::date
      ORDER BY data
    `, [dias]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /relatorios/produtos-mais-vendidos?limite=10
router.get('/produtos-mais-vendidos', async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;
    const { rows } = await db.query(`
      SELECT
        p.id,
        p.nome,
        SUM(iv.quantidade)                          AS total_vendido,
        SUM(iv.quantidade * iv.preco_unitario)      AS receita_total
      FROM item_venda iv
      JOIN produto p ON p.id = iv.produto_id
      JOIN venda   v ON v.id = iv.venda_id
      WHERE v.status = 'CONCLUIDA'
      GROUP BY p.id, p.nome
      ORDER BY total_vendido DESC
      LIMIT $1
    `, [limite]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /relatorios/formas-pagamento?dias=30
router.get('/formas-pagamento', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30;
    const { rows } = await db.query(`
      SELECT
        forma_pagamento,
        COUNT(*)                AS quantidade,
        COALESCE(SUM(total), 0) AS total
      FROM venda
      WHERE status = 'CONCLUIDA'
        AND data_venda >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY forma_pagamento
      ORDER BY total DESC
    `, [dias]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
