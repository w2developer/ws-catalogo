require('dotenv').config();
const { Pool } = require('pg');

// Comentário: Configuração para o Postgres do Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;