require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    // Colunas com tipo, nullable e default
    const { rows: colunas } = await client.query(`
      SELECT
        c.table_name,
        c.ordinal_position,
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_nullable,
        c.column_default
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY c.table_name, c.ordinal_position
    `);

    // Constraints (PK, UNIQUE, FK)
    const { rows: constraints } = await client.query(`
      SELECT
        kcu.table_name,
        kcu.column_name,
        tc.constraint_type,
        ccu.table_name  AS ref_table,
        ccu.column_name AS ref_column
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.table_constraints tc
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = kcu.constraint_name AND rc.constraint_schema = kcu.table_schema
      LEFT JOIN information_schema.key_column_usage ccu
        ON ccu.constraint_name = rc.unique_constraint_name AND ccu.table_schema = rc.unique_constraint_schema
      WHERE kcu.table_schema = 'public'
      ORDER BY kcu.table_name, kcu.column_name
    `);

    // Indexar constraints por tabela+coluna
    const cMap = {};
    constraints.forEach(r => {
      const key = `${r.table_name}.${r.column_name}`;
      if (!cMap[key]) cMap[key] = [];
      cMap[key].push(r);
    });

    // Agrupar colunas por tabela
    const tabelas = {};
    colunas.forEach(col => {
      if (!tabelas[col.table_name]) tabelas[col.table_name] = [];
      tabelas[col.table_name].push(col);
    });

    const hoje = new Date().toLocaleDateString('pt-BR');
    let md = `# Estrutura do Banco de Dados — Padaria Pão Fresquinho\n`;
    md += `Gerado em: ${hoje}\n\n`;
    md += `---\n\n`;

    // Índice
    md += `## Tabelas\n\n`;
    Object.keys(tabelas).sort().forEach(t => {
      md += `- [${t}](#${t})\n`;
    });
    md += `\n---\n\n`;

    // Detalhes de cada tabela
    for (const [tabela, cols] of Object.entries(tabelas).sort()) {
      md += `## ${tabela}\n\n`;
      md += `| # | Coluna | Tipo | Nulo | Padrão | Chave |\n`;
      md += `|---|--------|------|------|--------|-------|\n`;

      cols.forEach(col => {
        let tipo = col.data_type;
        if (col.character_maximum_length) tipo += `(${col.character_maximum_length})`;
        else if (col.numeric_precision && col.data_type !== 'integer' && col.data_type !== 'bigint')
          tipo += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;

        const key = `${tabela}.${col.column_name}`;
        const cons = cMap[key] || [];
        const tags = [];
        if (cons.some(c => c.constraint_type === 'PRIMARY KEY')) tags.push('PK');
        if (cons.some(c => c.constraint_type === 'UNIQUE'))      tags.push('UNIQUE');
        const fk = cons.find(c => c.constraint_type === 'FOREIGN KEY');
        if (fk) tags.push(`FK → ${fk.ref_table}(${fk.ref_column})`);

        const def = col.column_default
          ? col.column_default.replace(/::[\w\s]+/g, '').replace(/^'(.*)'$/, '$1')
          : '—';

        md += `| ${col.ordinal_position} | \`${col.column_name}\` | \`${tipo}\` | ${col.is_nullable === 'YES' ? 'Sim' : 'Não'} | ${def} | ${tags.join(', ') || '—'} |\n`;
      });

      md += `\n`;
    }

    fs.writeFileSync('schema.md', md, 'utf8');
    console.log('✅ Arquivo schema.md gerado com sucesso!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Erro ao conectar no banco:', err.message);
  process.exit(1);
});
