# Documentação — Padaria Pão Fresquinho

**Versão:** 1.0  
**Data:** 12/05/2026  
**Stack:** Node.js · Express · PostgreSQL (Supabase) · HTML/CSS/JS puro

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Como Rodar o Projeto](#2-como-rodar-o-projeto)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Backend — API REST](#4-backend--api-rest)
   - [Clientes](#41-clientes)
   - [Funcionários](#42-funcionários)
   - [Produtos](#43-produtos)
   - [Vendas](#44-vendas)
   - [Fiado](#45-fiado)
   - [Relatórios](#46-relatórios)
5. [Frontend — Interface](#5-frontend--interface)
6. [Banco de Dados](#6-banco-de-dados)
7. [Fluxos Principais](#7-fluxos-principais)

---

## 1. Visão Geral

Sistema de gestão para padaria. Permite registrar vendas no balcão (PDV), controlar estoque, gerenciar clientes e funcionários, cobrar fiado e visualizar relatórios de desempenho.

**Funcionalidades principais:**
- PDV (ponto de venda) com múltiplas formas de pagamento
- Controle de estoque automático a cada venda
- Sistema de fiado com pagamento parcial
- Alerta de cliente negativado no Serasa
- Dashboard com resumo do dia
- Relatórios com gráficos (vendas por dia, formas de pagamento, produtos mais vendidos)
- Zoom e tema claro/escuro

---

## 2. Como Rodar o Projeto

### Pré-requisitos
- Node.js 18+
- Conta no Supabase (banco PostgreSQL já criado)

### Instalação

```bash
cd Documents/padaria-backend
npm install
```

### Variáveis de ambiente

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
DB_HOST=aws-1-us-west-2.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.<seu-projeto-id>
DB_PASSWORD=<sua-senha>
PORT=3000
```

### Rodando

```bash
# Desenvolvimento (auto-reload)
npm run dev

# Produção
npm start
```

O servidor sobe em `http://localhost:3000` e já serve o frontend automaticamente.

---

## 3. Estrutura de Pastas

```
padaria-backend/
├── src/
│   ├── server.js          # Entrada da aplicação, monta todas as rotas
│   ├── db.js              # Pool de conexão PostgreSQL
│   └── routes/
│       ├── clientes.js    # CRUD de clientes
│       ├── funcionarios.js# CRUD de funcionários
│       ├── produtos.js    # CRUD de produtos + ajuste de estoque
│       ├── vendas.js      # Registro e cancelamento de vendas
│       ├── fiado.js       # Listagem e pagamento de fiado
│       └── relatorios.js  # Dashboard e relatórios
├── public/
│   └── index.html         # Frontend SPA (tela única com todo CSS e JS embutidos)
├── .env                   # Credenciais do banco (não versionar)
├── package.json
├── schema.md              # Estrutura do banco gerada automaticamente
├── gerar_schema.js        # Script para regenerar o schema.md
└── DOCUMENTACAO.md        # Este arquivo
```

---

## 4. Backend — API REST

Base URL: `http://localhost:3000`

Todas as respostas são JSON. Em caso de erro, o corpo retorna `{ "erro": "mensagem" }`.

---

### 4.1 Clientes

#### `GET /clientes`
Lista todos os clientes.

**Query params:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `busca` | string | Filtra por nome ou CPF (busca parcial) |
| `ativo` | boolean | `true` retorna apenas ativos |

**Resposta 200:**
```json
[
  {
    "id": 1,
    "nome": "Maria Silva",
    "cpf": "123.456.789-00",
    "telefone": "(34) 99999-1234",
    "endereco": "Rua das Flores, 10",
    "email": "maria@email.com",
    "status_serasa": true,
    "ativo": true,
    "data_cadastro": "2026-01-15T10:00:00.000Z"
  }
]
```

---

#### `GET /clientes/:id`
Retorna um cliente pelo ID.

**Resposta 200:** objeto do cliente  
**Resposta 404:** `{ "erro": "Cliente não encontrado" }`

---

#### `GET /clientes/:id/vendas`
Retorna o histórico de compras de um cliente.

**Resposta 200:** array de vendas

---

#### `POST /clientes`
Cadastra um novo cliente.

**Body:**
```json
{
  "nome": "João Souza",
  "cpf": "987.654.321-00",
  "telefone": "(34) 98888-5678",
  "email": "joao@email.com",
  "endereco": "Av. Central, 50"
}
```

> `nome` e `cpf` são obrigatórios. CPF deve ser único.

**Resposta 201:** objeto do cliente criado  
**Resposta 409:** `{ "erro": "CPF já cadastrado" }`

---

#### `PUT /clientes/:id`
Atualiza dados de um cliente. Todos os campos são opcionais (usa COALESCE).

**Body (qualquer subconjunto):**
```json
{
  "nome": "João Atualizado",
  "telefone": "(34) 97777-0000",
  "status_serasa": false
}
```

**Resposta 200:** objeto do cliente atualizado

---

#### `DELETE /clientes/:id`
Desativa o cliente (soft delete — define `ativo = false`).

**Resposta 200:** `{ "mensagem": "Cliente desativado", "cliente": { "id": 1, "nome": "..." } }`

---

### 4.2 Funcionários

#### `GET /funcionarios`
Lista funcionários.

**Query params:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `ativo` | boolean | Filtra por ativo/inativo |

**Resposta 200:**
```json
[
  {
    "id": 1,
    "nome": "Ana Paula",
    "cpf": "111.222.333-44",
    "telefone": "(34) 91111-2222",
    "cargo": "Atendente",
    "salario": "1800.00",
    "data_admissao": "2025-03-01",
    "ativo": true
  }
]
```

---

#### `GET /funcionarios/:id`
Retorna um funcionário pelo ID.

---

#### `POST /funcionarios`
Cadastra um funcionário.

**Body:**
```json
{
  "nome": "Carlos Mendes",
  "cpf": "555.666.777-88",
  "cargo": "Caixa",
  "salario": 1900.00,
  "telefone": "(34) 92222-3333",
  "data_admissao": "2026-05-01"
}
```

> `nome` e `cpf` são obrigatórios.

**Resposta 201:** objeto do funcionário criado

---

#### `PUT /funcionarios/:id`
Atualiza um funcionário. Campos opcionais (COALESCE).

---

### 4.3 Produtos

#### `GET /produtos`
Lista produtos.

**Query params:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `ativo` | boolean | Filtra por ativo/inativo |
| `busca` | string | Filtra por nome (busca parcial) |

**Resposta 200:**
```json
[
  {
    "id": 1,
    "nome": "Pão Francês",
    "preco_venda": "0.75",
    "estoque_atual": 200,
    "ativo": true
  }
]
```

---

#### `GET /produtos/:id`
Retorna um produto pelo ID.

---

#### `POST /produtos`
Cadastra um produto.

**Body:**
```json
{
  "nome": "Croissant",
  "preco_venda": 4.50,
  "estoque_atual": 30
}
```

> `nome` e `preco_venda` são obrigatórios. `estoque_atual` padrão = 0.

**Resposta 201:** objeto do produto criado

---

#### `PUT /produtos/:id`
Atualiza nome, preço ou estoque de um produto.

**Body (qualquer subconjunto):**
```json
{
  "nome": "Pão de Queijo Grande",
  "preco_venda": 6.00,
  "estoque_atual": 50
}
```

**Resposta 200:** objeto do produto atualizado

---

#### `PATCH /produtos/:id/estoque`
Ajusta o estoque (entrada ou saída).

**Body:**
```json
{ "quantidade": 100 }
```

> Use valor positivo para entrada e negativo para saída. Retorna erro se o resultado for negativo.

**Resposta 200:** objeto do produto atualizado  
**Resposta 400:** `{ "erro": "Estoque insuficiente ou produto não encontrado" }`

---

#### `DELETE /produtos/:id`
Desativa o produto (soft delete).

---

### 4.4 Vendas

#### `GET /vendas`
Lista vendas com filtros opcionais.

**Query params:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `status` | string | `PENDENTE`, `CONCLUIDA` ou `CANCELADA` |
| `cliente_id` | number | Filtra por cliente |
| `funcionario_id` | number | Filtra por funcionário |
| `data_inicio` | date | A partir de (ISO 8601) |
| `data_fim` | date | Até (ISO 8601) |

---

#### `GET /vendas/:id`
Retorna uma venda completa com seus itens.

**Resposta 200:**
```json
{
  "id": 42,
  "data_venda": "2026-05-12T09:30:00.000Z",
  "total": "18.50",
  "forma_pagamento": "PIX",
  "tipo_venda": "BALCAO",
  "status": "CONCLUIDA",
  "cliente": "Maria Silva",
  "funcionario": "Ana Paula",
  "itens": [
    {
      "produto_id": 1,
      "produto": "Pão Francês",
      "quantidade": "10",
      "preco_unitario": "0.75",
      "subtotal": "7.50"
    }
  ]
}
```

---

#### `POST /vendas`
Registra uma venda completa. Executa em transação: insere a venda, insere os itens e decrementa o estoque de cada produto. Em caso de qualquer erro, faz rollback automático.

**Body:**
```json
{
  "cliente_id": 1,
  "funcionario_id": 2,
  "forma_pagamento": "DINHEIRO",
  "tipo_venda": "BALCAO",
  "status": "CONCLUIDA",
  "itens": [
    { "produto_id": 1, "quantidade": 5, "preco_unitario": 0.75 },
    { "produto_id": 3, "quantidade": 2, "preco_unitario": 4.50 }
  ]
}
```

> **Formas de pagamento aceitas:** `DINHEIRO`, `CARTAO_CREDITO`, `PIX`, `FIADO`  
> **Status:** `CONCLUIDA` para pagamentos imediatos, `PENDENTE` para fiado  
> **Tipo:** `BALCAO` ou `FIADO`

**Resposta 201:**
```json
{ "mensagem": "Venda registrada com sucesso", "venda_id": 42, "total": 12.75 }
```

**Resposta 400:** erro de estoque insuficiente ou dados inválidos

---

#### `PATCH /vendas/:id/status`
Altera o status de uma venda.

**Body:**
```json
{ "status": "CANCELADA" }
```

> Ao cancelar uma venda com status `CONCLUIDA` ou `PENDENTE`, o estoque de todos os produtos da venda é restaurado automaticamente (dentro de transação).

**Resposta 200:** objeto da venda atualizada

---

#### `PATCH /vendas/:id`
Atualiza a forma de pagamento de uma venda.

**Body:**
```json
{ "forma_pagamento": "CARTAO_CREDITO" }
```

> **Valores aceitos:** `DINHEIRO`, `CARTAO_CREDITO`, `PIX`, `FIADO`

**Resposta 200:** objeto da venda atualizada

---

### 4.5 Fiado

#### `GET /fiado`
Lista todos os clientes com vendas em aberto (`status = PENDENTE`), agrupados por cliente.

**Resposta 200:**
```json
[
  {
    "cliente_id": 1,
    "cliente": "Maria Silva",
    "telefone": "(34) 99999-1234",
    "qtd_vendas": 3,
    "total_fiado": "47.00"
  }
]
```

---

#### `GET /fiado/:cliente_id`
Lista as vendas pendentes de um cliente específico, da mais antiga para a mais recente.

**Resposta 200:**
```json
[
  { "id": 10, "data_venda": "2026-04-20T14:00:00.000Z", "total": "12.50" },
  { "id": 15, "data_venda": "2026-05-01T10:30:00.000Z", "total": "34.50" }
]
```

---

#### `POST /fiado/pagar`
Registra um pagamento de fiado. Quita as vendas da mais antiga para a mais recente até cobrir o valor. Se o valor não for suficiente para quitar uma venda inteira, reduz o saldo da venda mais antiga proporcionalmente. Executa em transação.

**Body:**
```json
{ "cliente_id": 1, "valor": 30.00 }
```

**Resposta 200:**
```json
{
  "mensagem": "2 venda(s) quitada(s)",
  "vendas_quitadas": 2,
  "valor_aplicado": "25.00",
  "troco": "5.00",
  "fiado_restante": "22.00"
}
```

> - `troco`: valor que sobrou após quitar todas as vendas (quando pagou mais do que devia)
> - `fiado_restante`: saldo que ainda ficou em aberto
> - Se o valor pago for menor que o total da venda mais antiga, o saldo daquela venda é reduzido

---

### 4.6 Relatórios

#### `GET /relatorios/dashboard`
Resumo do dia para o painel principal.

**Resposta 200:**
```json
{
  "vendas_hoje": { "quantidade": 12, "total": "385.50" },
  "fiado_aberto": { "quantidade": 4, "total": "210.00" },
  "produtos_estoque_baixo": [
    { "id": 2, "nome": "Bolo de Cenoura", "estoque_atual": 3 }
  ],
  "ultimas_vendas": [...]
}
```

---

#### `GET /relatorios/vendas-por-dia`
Vendas agrupadas por dia dos últimos N dias.

**Query params:** `?dias=7` (padrão)

**Resposta 200:**
```json
[
  { "data": "2026-05-12T00:00:00.000Z", "quantidade": 8, "total": "194.00" }
]
```

---

#### `GET /relatorios/produtos-mais-vendidos`
Ranking de produtos por quantidade vendida.

**Query params:** `?limite=10` (padrão)

**Resposta 200:**
```json
[
  { "produto_id": 1, "nome": "Pão Francês", "total_vendido": "450", "receita_total": "337.50" }
]
```

---

#### `GET /relatorios/formas-pagamento`
Breakdown das formas de pagamento dos últimos N dias.

**Query params:** `?dias=30` (padrão)

**Resposta 200:**
```json
[
  { "forma_pagamento": "PIX",      "quantidade": 30, "total": "620.00" },
  { "forma_pagamento": "DINHEIRO", "quantidade": 18, "total": "310.00" }
]
```

---

## 5. Frontend — Interface

Arquivo único: `public/index.html` — SPA sem framework, CSS e JS embutidos.

### Telas

#### Dashboard
Tela inicial. Exibe três indicadores no topo (vendas do dia, total em fiado, produtos com estoque baixo ≤ 10 unidades) e uma tabela com as últimas vendas registradas. Cada venda tem botões de editar forma de pagamento e cancelar.

#### PDV (Ponto de Venda)
Seleção de cliente, funcionário e produtos. Produtos já adicionados têm quantidade incrementada automaticamente. O total é atualizado em tempo real. Finalização por Dinheiro, Cartão, Pix ou Fiado. Vendas fiadas são salvas com `status = PENDENTE`. O botão "Cancelar Venda" abre um modal de confirmação.

#### Clientes
Formulário de cadastro e tabela com todos os clientes. Cada linha tem botão de editar (abre modal com todos os campos) e botão de alternar negativação no Serasa. Clientes negativados são marcados com badge vermelho e geram um alerta no PDV quando selecionados.

#### Produtos
Tabela com busca em tempo real. Cada produto tem botão de editar (nome, preço e estoque). Estoque ≤ 10 unidades é destacado em vermelho.

#### Cobrar Fiado
Seleção do cliente devedor. Exibe o total em aberto e lista das vendas pendentes. Campo para informar o valor recebido. O sistema quita as vendas da mais antiga para a mais nova; se o valor for insuficiente para quitar uma venda inteira, reduz o saldo dessa venda.

#### Relatórios
Gráfico de barras com vendas dos últimos 7 dias, tabela com ranking dos 5 produtos mais vendidos e gráfico de rosca com a divisão por forma de pagamento nos últimos 30 dias (usando Chart.js).

### Recursos Globais

| Recurso | Descrição |
|---------|-----------|
| Busca global | Barra na navbar pesquisa clientes e produtos simultaneamente com debounce de 280ms |
| Zoom | Botões A− / A+ na navbar escalam o site inteiro (70% a 150%, persistido no localStorage) |
| Tema | Botão 🎨 alterna entre tema escuro (padrão) e claro, persistido no localStorage |
| Funcionário ativo | Nome exibido no canto direito da navbar; clique abre modal para trocar o funcionário |
| Toast | Notificações de sucesso (verde) e erro (vermelho) aparecem no canto inferior direito |

### Paleta de Cores

| Variável CSS | Valor | Uso |
|---|---|---|
| `--primary` | `#f59e0b` | Botões principais, destaques |
| `--focus-blue` | `#7dd3fc` | Cor de foco dos inputs |
| `--success` | `#16a34a` | Botões e status de sucesso |
| `--danger` | `#dc2626` | Botões de cancelar, alertas |
| `--blue` | `#2563eb` | Botões de editar |
| `--muted` | `#6b7280` | Textos secundários |

---

## 6. Banco de Dados

Banco PostgreSQL hospedado no Supabase. Todas as tabelas usam `bigint` com auto-incremento como chave primária.

### Diagrama de Relacionamentos

```
cliente ──────────────────────────┐
  id (PK)                         │
  nome                            │  (1:N)
  cpf (UNIQUE)                    │
  telefone                        ▼
  endereco              venda ────────────── item_venda
  email                   id (PK)               id (PK)
  status_serasa           data_venda             venda_id (FK → venda)
  ativo                   total                  produto_id (FK → produto)
  data_cadastro           forma_pagamento        quantidade
                          tipo_venda             preco_unitario
funcionario               status
  id (PK)                 cliente_id (FK → cliente)
  nome                    funcionario_id (FK → funcionario)
  cpf (UNIQUE)                              ▲
  telefone                                  │ (1:N)
  cargo                                     │
  salario               produto ────────────┘
  data_admissao           id (PK)
  ativo                   nome
                          preco_venda
                          estoque_atual
                          ativo
```

### Tabela: `cliente`

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | auto-incremento | PK |
| 2 | `nome` | `varchar(150)` | Não | — | — |
| 3 | `cpf` | `varchar(14)` | Não | — | UNIQUE |
| 4 | `telefone` | `varchar(20)` | Sim | — | — |
| 5 | `endereco` | `varchar(255)` | Sim | — | — |
| 6 | `email` | `varchar(150)` | Sim | — | — |
| 7 | `status_serasa` | `boolean` | Não | `true` | — |
| 8 | `ativo` | `boolean` | Não | `true` | — |
| 9 | `data_cadastro` | `timestamp` | Não | `now()` | — |

> `status_serasa = true` significa cliente regular (sem restrição). `false` significa negativado.

---

### Tabela: `funcionario`

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | auto-incremento | PK |
| 2 | `nome` | `varchar(150)` | Não | — | — |
| 3 | `cpf` | `varchar(14)` | Não | — | UNIQUE |
| 4 | `telefone` | `varchar(20)` | Sim | — | — |
| 5 | `endereco` | `varchar(255)` | Sim | — | — |
| 6 | `cargo` | `varchar(100)` | Sim | — | — |
| 7 | `data_admissao` | `date` | Sim | — | — |
| 8 | `salario` | `numeric(10,2)` | Sim | — | — |
| 9 | `ativo` | `boolean` | Não | `true` | — |

---

### Tabela: `produto`

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | auto-incremento | PK |
| 2 | `nome` | `varchar(150)` | Não | — | — |
| 3 | `preco_venda` | `numeric(10,2)` | Não | — | — |
| 4 | `estoque_atual` | `integer` | Não | `0` | — |
| 5 | `ativo` | `boolean` | Não | `true` | — |

---

### Tabela: `venda`

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | auto-incremento | PK |
| 2 | `data_venda` | `timestamp` | Não | `now()` | — |
| 3 | `total` | `numeric(10,2)` | Não | `0` | — |
| 4 | `forma_pagamento` | `varchar(50)` | Não | — | — |
| 5 | `tipo_venda` | `varchar(50)` | Não | — | — |
| 6 | `status` | `varchar(50)` | Não | `PENDENTE` | — |
| 7 | `cliente_id` | `bigint` | Não | — | FK → cliente(id) |
| 8 | `funcionario_id` | `bigint` | Não | — | FK → funcionario(id) |

**Valores válidos:**

| Campo | Valores |
|-------|---------|
| `forma_pagamento` | `DINHEIRO`, `CARTAO_CREDITO`, `PIX`, `FIADO` |
| `tipo_venda` | `BALCAO`, `FIADO` |
| `status` | `PENDENTE`, `CONCLUIDA`, `CANCELADA` |

---

### Tabela: `item_venda`

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | auto-incremento | PK |
| 2 | `venda_id` | `bigint` | Não | — | FK → venda(id) |
| 3 | `produto_id` | `bigint` | Não | — | FK → produto(id) |
| 4 | `quantidade` | `numeric(10,3)` | Não | — | — |
| 5 | `preco_unitario` | `numeric(10,2)` | Não | — | — |

> `quantidade` usa 3 casas decimais para suportar vendas por peso (ex: 0,500 kg).

---

## 7. Fluxos Principais

### Fluxo de Venda no Balcão

```
1. Funcionário seleciona cliente e produto(s) no PDV
2. Se cliente negativado → alerta modal (pode prosseguir ou cancelar)
3. Clica em Dinheiro / Cartão / Pix
4. POST /vendas → transação no banco:
   a. Valida estoque de cada produto
   b. Insere registro em `venda` (status = CONCLUIDA)
   c. Insere itens em `item_venda`
   d. Decrementa `estoque_atual` em `produto`
5. Toast de confirmação com número da venda e total
```

### Fluxo de Venda Fiado

```
1. Igual ao fluxo acima, mas clica em "Fiado"
2. Venda inserida com status = PENDENTE e forma_pagamento = FIADO
3. Aparece na tela "Cobrar Fiado" agrupada pelo cliente
```

### Fluxo de Cobrança de Fiado

```
1. Funcionário abre tela "Cobrar Fiado"
2. Seleciona o cliente → sistema exibe total em aberto e vendas pendentes
3. Informa o valor recebido e clica em "Registrar Pagamento"
4. POST /fiado/pagar → transação no banco:
   a. Busca vendas PENDENTE do cliente (ordem: mais antigas primeiro)
   b. Para cada venda: se valor cobre o total → marca CONCLUIDA
   c. Se valor é menor que o total da venda → reduz o total da venda
5. Toast exibe: vendas quitadas, valor aplicado, troco (se houver) e saldo restante
```

### Fluxo de Cancelamento de Venda

```
1. No dashboard, clicar em "Cancelar" em qualquer venda CONCLUIDA ou PENDENTE
2. Modal de confirmação
3. PATCH /vendas/:id/status { status: "CANCELADA" } → transação:
   a. Busca todos os itens da venda
   b. Devolve quantidade ao estoque de cada produto
   c. Atualiza status para CANCELADA
```

---

*Documentação gerada em 12/05/2026.*
