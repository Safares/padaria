// src/routes/produtos.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /produtos — lista todos (ativos por padrão)
router.get('/', async (req, res) => {
  try {
    const { ativo, busca } = req.query;
    let query  = 'SELECT * FROM produto WHERE 1=1';
    const params = [];

    if (ativo !== undefined) {
      params.push(ativo === 'true');
      query += ` AND ativo = $${params.length}`;
    }

    if (busca) {
      params.push(`%${busca}%`);
      query += ` AND LOWER(nome) LIKE LOWER($${params.length})`;
    }

    query += ' ORDER BY nome';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /produtos/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM produto WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /produtos — cadastrar
router.post('/', async (req, res) => {
  try {
    const { nome, preco_venda, estoque_atual = 0, ativo = true } = req.body;
    if (!nome || preco_venda == null)
      return res.status(400).json({ erro: 'nome e preco_venda são obrigatórios' });

    const { rows } = await db.query(
      `INSERT INTO produto (nome, preco_venda, estoque_atual, ativo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, preco_venda, estoque_atual, ativo]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PUT /produtos/:id — atualizar
router.put('/:id', async (req, res) => {
  try {
    const { nome, preco_venda, estoque_atual, ativo } = req.body;
    const { rows } = await db.query(
      `UPDATE produto SET
         nome           = COALESCE($1, nome),
         preco_venda    = COALESCE($2, preco_venda),
         estoque_atual  = COALESCE($3, estoque_atual),
         ativo          = COALESCE($4, ativo)
       WHERE id = $5 RETURNING *`,
      [nome, preco_venda, estoque_atual, ativo, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PATCH /produtos/:id/estoque — ajustar estoque
router.patch('/:id/estoque', async (req, res) => {
  try {
    const { quantidade } = req.body; // positivo = entrada, negativo = saída
    if (quantidade == null)
      return res.status(400).json({ erro: 'quantidade é obrigatória' });

    const { rows } = await db.query(
      `UPDATE produto
       SET estoque_atual = estoque_atual + $1
       WHERE id = $2 AND (estoque_atual + $1) >= 0
       RETURNING *`,
      [quantidade, req.params.id]
    );
    if (!rows.length)
      return res.status(400).json({ erro: 'Estoque insuficiente ou produto não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /produtos/:id — desativar (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE produto SET ativo = FALSE WHERE id = $1 RETURNING id, nome',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json({ mensagem: 'Produto desativado', produto: rows[0] });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
