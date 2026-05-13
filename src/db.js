// src/db.js — Pool de conexão com o Supabase (PostgreSQL)
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // obrigatório no Supabase
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do banco:', err.message);
});

module.exports = pool;
