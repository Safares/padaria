# padaria-backend

API REST para gerenciamento de padaria. Node.js + Express com banco PostgreSQL via Supabase.

## Instalação

```bash
npm install
```

Copie o `.env.example` para `.env` e preencha com suas credenciais do Supabase:

```bash
cp .env.example .env
```

## Rodando

```bash
npm run dev    # desenvolvimento
npm start      # produção
```

API disponível em `http://localhost:3000`

## Rotas

**Produtos** — `/produtos`
- `GET /produtos` — lista todos, aceita `?busca=pão&ativo=true`
- `GET /produtos/:id`
- `POST /produtos` — cadastrar
- `PUT /produtos/:id` — atualizar
- `PATCH /produtos/:id/estoque` — ajustar estoque `{ "quantidade": -5 }`
- `DELETE /produtos/:id` — desativa (soft delete)

**Clientes** — `/clientes`
- `GET /clientes` — aceita `?busca=nome`
- `GET /clientes/:id`
- `GET /clientes/:id/vendas` — histórico de compras
- `POST /clientes`
- `PUT /clientes/:id`
- `DELETE /clientes/:id`

**Funcionários** — `/funcionarios`
- `GET /funcionarios`
- `GET /funcionarios/:id`
- `POST /funcionarios`
- `PUT /funcionarios/:id`

**Vendas** — `/vendas`
- `GET /vendas` — aceita `?status=CONCLUIDA&cliente_id=1`
- `GET /vendas/:id` — retorna venda com itens
- `POST /vendas` — registra venda, baixa estoque e calcula total em transação
- `PATCH /vendas/:id/status` — altera status, cancela e estorna estoque se necessário

**Relatórios** — `/relatorios`
- `GET /relatorios/dashboard` — resumo do dia
- `GET /relatorios/vendas-por-dia?dias=7`
- `GET /relatorios/produtos-mais-vendidos?limite=10`
- `GET /relatorios/formas-pagamento?dias=30`

## Estrutura

```
src/
├── server.js
├── db.js
└── routes/
    ├── produtos.js
    ├── clientes.js
    ├── funcionarios.js
    ├── vendas.js
    ├── fiado.js
    └── relatorios.js
```
