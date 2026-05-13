# Estrutura do Banco de Dados — Padaria Pão Fresquinho
Gerado em: 11/05/2026

---

## Tabelas

- [cliente](#cliente)
- [funcionario](#funcionario)
- [item_venda](#item_venda)
- [produto](#produto)
- [venda](#venda)

---

## cliente

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | nextval('cliente_id_seq') | PK |
| 2 | `nome` | `character varying(150)` | Não | — | — |
| 3 | `cpf` | `character varying(14)` | Não | — | UNIQUE |
| 4 | `telefone` | `character varying(20)` | Sim | — | — |
| 5 | `endereco` | `character varying(255)` | Sim | — | — |
| 6 | `email` | `character varying(150)` | Sim | — | — |
| 7 | `status_serasa` | `boolean` | Não | true | — |
| 8 | `ativo` | `boolean` | Não | true | — |
| 9 | `data_cadastro` | `timestamp without time zone` | Não | now() | — |

## funcionario

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | nextval('funcionario_id_seq') | PK |
| 2 | `nome` | `character varying(150)` | Não | — | — |
| 3 | `cpf` | `character varying(14)` | Não | — | UNIQUE |
| 4 | `telefone` | `character varying(20)` | Sim | — | — |
| 5 | `endereco` | `character varying(255)` | Sim | — | — |
| 6 | `cargo` | `character varying(100)` | Sim | — | — |
| 7 | `data_admissao` | `date` | Sim | — | — |
| 8 | `salario` | `numeric(10,2)` | Sim | — | — |
| 9 | `ativo` | `boolean` | Não | true | — |

## item_venda

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | nextval('item_venda_id_seq') | PK |
| 2 | `venda_id` | `bigint` | Não | — | FK → venda(id) |
| 3 | `produto_id` | `bigint` | Não | — | FK → produto(id) |
| 4 | `quantidade` | `numeric(10,3)` | Não | — | — |
| 5 | `preco_unitario` | `numeric(10,2)` | Não | — | — |

## produto

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | nextval('produto_id_seq') | PK |
| 2 | `nome` | `character varying(150)` | Não | — | — |
| 3 | `preco_venda` | `numeric(10,2)` | Não | — | — |
| 4 | `estoque_atual` | `integer` | Não | 0 | — |
| 5 | `ativo` | `boolean` | Não | true | — |

## venda

| # | Coluna | Tipo | Nulo | Padrão | Chave |
|---|--------|------|------|--------|-------|
| 1 | `id` | `bigint` | Não | nextval('venda_id_seq') | PK |
| 2 | `data_venda` | `timestamp without time zone` | Não | now() | — |
| 3 | `total` | `numeric(10,2)` | Não | 0 | — |
| 4 | `forma_pagamento` | `character varying(50)` | Não | — | — |
| 5 | `tipo_venda` | `character varying(50)` | Não | — | — |
| 6 | `status` | `character varying(50)` | Não | PENDENTE | — |
| 7 | `cliente_id` | `bigint` | Não | — | FK → cliente(id) |
| 8 | `funcionario_id` | `bigint` | Não | — | FK → funcionario(id) |

