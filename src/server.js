// src/server.js — Servidor principal da Padaria Pão Fresquinho
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const db         = require('./db');

const rotaProdutos     = require('./routes/produtos');
const rotaClientes     = require('./routes/clientes');
const rotaFuncionarios = require('./routes/funcionarios');
const rotaVendas       = require('./routes/vendas');
const rotaRelatorios   = require('./routes/relatorios');
const rotaFiado        = require('./routes/fiado');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Servir o front-end estático da pasta /public
app.use(express.static(path.join(__dirname, '../public')));

// Logger simples
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${req.method} ${req.url}`);
  next();
});

// ─── Rotas API ────────────────────────────────────────────
app.use('/produtos',     rotaProdutos);
app.use('/clientes',     rotaClientes);
app.use('/funcionarios', rotaFuncionarios);
app.use('/vendas',       rotaVendas);
app.use('/relatorios',   rotaRelatorios);
app.use('/fiado',        rotaFiado);

// Health check da API
app.get('/api', (_req, res) => {
  res.json({ api: 'Padaria Pão Fresquinho', status: 'online', versao: '1.0.0' });
});

// SPA fallback — compatível com Express 4 e 5
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Handler de erros globais
app.use((err, _req, res, _next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// ─── Inicialização ────────────────────────────────────────
async function iniciar() {
  try {
    await db.query('SELECT 1');
    console.log('✅ Conectado ao Supabase (PostgreSQL)');
    app.listen(PORT, () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Falha ao conectar ao banco:', err.message);
    console.error('   Verifique as variáveis DB_* no arquivo .env');
    process.exit(1);
  }
}

iniciar();
