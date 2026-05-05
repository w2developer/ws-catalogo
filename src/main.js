require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database');

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota para testar se o banco responde
app.get('/teste-banco', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ mensagem: "Conectado!", hora: result.rows[0] });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));