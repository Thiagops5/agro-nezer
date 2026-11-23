const dotenv = require('dotenv');
dotenv.config();
const db = require('./config/db');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

db.sync()
    .then(() => seedAdmin())
    .catch((error) => console.error('Erro ao iniciar o banco/seed:', error))
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`SERVIDOR RODANDO http://localhost:${PORT}`);
        });
    });