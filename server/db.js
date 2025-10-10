const { Pool } = require('pg');

// Esta configuração verifica se estamos em produção (no Render) ou não.
const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // Esta configuração de SSL é ESSENCIAL para o Render.
  // Em desenvolvimento (no seu PC), não usamos SSL.
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};