# 🥐 Padaria Pão Fresquinho — Backend API

API REST em **Node.js + Express** conectada ao **Supabase (PostgreSQL)**.

---

## ⚙️ Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o banco no `.env`
Abra o arquivo `.env` e troque `YOUR_PASSWORD_AQUI` pela sua senha do Supabase:
```env
DB_HOST=db.ueiwzqtwwhxjszzulkas.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_REAL_AQUI
PORT=3000
```

### 3. Rodar a API
```bash
npm start
```

A API estará disponível em: `http://localhost:3000`

---

## 📡 Endpoints

### Produtos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/produtos` | Lista todos (filtros: `?ativo=true&busca=pão`) |
| GET | `/produtos/:id` | Busca por ID |
| POST | `/produtos` | Cadastrar produto |
| PUT | `/produtos/:id` | Atualizar produto |
| PATCH | `/produtos/:id/estoque` | Ajustar estoque (`{ "quantidade": -5 }`) |
| DELETE | `/produtos/:id` | Desativar (soft delete) |

### Clientes
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/clientes` | Lista todos (filtros: `?busca=gabriel`) |
| GET | `/clientes/:id` | Busca por ID |
| GET | `/clientes/:id/vendas` | Histórico de compras |
| POST | `/clientes` | Cadastrar cliente |
| PUT | `/clientes/:id` | Atualizar cliente |
| DELETE | `/clientes/:id` | Desativar |

### Funcionários
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/funcionarios` | Lista todos |
| GET | `/funcionarios/:id` | Busca por ID |
| POST | `/funcionarios` | Cadastrar |
| PUT | `/funcionarios/:id` | Atualizar |

### Vendas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/vendas` | Lista com filtros (`?status=CONCLUIDA&cliente_id=1`) |
| GET | `/vendas/:id` | Venda completa com itens |
| POST | `/vendas` | Registrar nova venda |
| PATCH | `/vendas/:id/status` | Alterar status (cancela e estorna estoque) |

### Relatórios
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/relatorios/dashboard` | Resumo do dia (vendas, fiado, estoque baixo) |
| GET | `/relatorios/vendas-por-dia?dias=7` | Vendas agrupadas por dia |
| GET | `/relatorios/produtos-mais-vendidos?limite=10` | Ranking de produtos |
| GET | `/relatorios/formas-pagamento?dias=30` | Totais por forma de pagamento |

---

## 📦 Exemplo — Registrar uma Venda

**POST** `/vendas`
```json
{
  "cliente_id": 1,
  "funcionario_id": 1,
  "forma_pagamento": "PIX",
  "tipo_venda": "BALCAO",
  "itens": [
    { "produto_id": 1, "quantidade": 10, "preco_unitario": 0.75 },
    { "produto_id": 16, "quantidade": 2,  "preco_unitario": 5.00 }
  ]
}
```

A API automaticamente:
- Calcula o total
- Valida o estoque de cada produto
- Baixa o estoque
- Tudo dentro de uma **transação** (rollback automático em caso de erro)

---

## 🗂️ Estrutura de Arquivos

```
padaria-backend/
├── .env                      ← suas credenciais (não commitar!)
├── package.json
└── src/
    ├── server.js             ← ponto de entrada
    ├── db.js                 ← pool de conexão com o Supabase
    └── routes/
        ├── produtos.js
        ├── clientes.js
        ├── funcionarios.js
        ├── vendas.js         ← lógica de transação + estoque
        └── relatorios.js     ← dashboard e relatórios
```
