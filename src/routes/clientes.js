// src/routes/clientes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /clientes
router.get('/', async (req, res) => {
  try {
    const { busca, ativo } = req.query;
    let query  = 'SELECT * FROM cliente WHERE 1=1';
    const params = [];

    if (ativo !== undefined) {
      params.push(ativo === 'true');
      query += ` AND ativo = $${params.length}`;
    }

    if (busca) {
      params.push(`%${busca}%`);
      query += ` AND (LOWER(nome) LIKE LOWER($${params.length}) OR cpf LIKE $${params.length})`;
    }

    query += ' ORDER BY nome';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM cliente WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /clientes/:id/vendas — histórico de compras
router.get('/:id/vendas', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT v.*, f.nome AS funcionario
       FROM venda v
       JOIN funcionario f ON f.id = v.funcionario_id
       WHERE v.cliente_id = $1
       ORDER BY v.data_venda DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /clientes — cadastrar
router.post('/', async (req, res) => {
  try {
    const { nome, cpf, telefone, endereco, email, status_serasa = true } = req.body;
    if (!nome || !cpf)
      return res.status(400).json({ erro: 'nome e cpf são obrigatórios' });

    const { rows } = await db.query(
      `INSERT INTO cliente (nome, cpf, telefone, endereco, email, status_serasa)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, cpf, telefone, endereco, email, status_serasa]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ erro: 'CPF já cadastrado' });
    res.status(500).json({ erro: err.message });
  }
});

// PUT /clientes/:id
router.put('/:id', async (req, res) => {
  try {
    const { nome, telefone, endereco, email, status_serasa, ativo } = req.body;
    const { rows } = await db.query(
      `UPDATE cliente SET
         nome          = COALESCE($1, nome),
         telefone      = COALESCE($2, telefone),
         endereco      = COALESCE($3, endereco),
         email         = COALESCE($4, email),
         status_serasa = COALESCE($5, status_serasa),
         ativo         = COALESCE($6, ativo)
       WHERE id = $7 RETURNING *`,
      [nome, telefone, endereco, email, status_serasa, ativo, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /clientes/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE cliente SET ativo = FALSE WHERE id = $1 RETURNING id, nome',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.json({ mensagem: 'Cliente desativado', cliente: rows[0] });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
