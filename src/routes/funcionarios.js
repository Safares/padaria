// src/routes/funcionarios.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /funcionarios
router.get('/', async (req, res) => {
  try {
    const { ativo } = req.query;
    let query  = 'SELECT * FROM funcionario WHERE 1=1';
    const params = [];

    if (ativo !== undefined) {
      params.push(ativo === 'true');
      query += ` AND ativo = $${params.length}`;
    }

    query += ' ORDER BY nome';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /funcionarios/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM funcionario WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Funcionário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /funcionarios
router.post('/', async (req, res) => {
  try {
    const { nome, cpf, telefone, endereco, cargo, data_admissao, salario } = req.body;
    if (!nome || !cpf)
      return res.status(400).json({ erro: 'nome e cpf são obrigatórios' });

    const { rows } = await db.query(
      `INSERT INTO funcionario (nome, cpf, telefone, endereco, cargo, data_admissao, salario)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nome, cpf, telefone, endereco, cargo, data_admissao, salario]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ erro: 'CPF já cadastrado' });
    res.status(500).json({ erro: err.message });
  }
});

// PUT /funcionarios/:id
router.put('/:id', async (req, res) => {
  try {
    const { nome, telefone, endereco, cargo, salario, ativo } = req.body;
    const { rows } = await db.query(
      `UPDATE funcionario SET
         nome     = COALESCE($1, nome),
         telefone = COALESCE($2, telefone),
         endereco = COALESCE($3, endereco),
         cargo    = COALESCE($4, cargo),
         salario  = COALESCE($5, salario),
         ativo    = COALESCE($6, ativo)
       WHERE id = $7 RETURNING *`,
      [nome, telefone, endereco, cargo, salario, ativo, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Funcionário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
