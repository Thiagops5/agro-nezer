const dotenv = require('dotenv');
dotenv.config();
const { db } = require('./models');
const express = require('express');
const cors = require('cors');

const authRouter = require('./auth/auth.router');
const usuarioRouter = require('./usuario/usuario.router');
const talhaoRouter = require('./talhao/talhao.router');
const seedAdmin = require('./config/seed');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/v1/auth', authRouter);
app.use('/v1/usuarios', usuarioRouter);
app.use('/v1/talhoes', talhaoRouter);

// sincroniza todas as tabelas, cria o primeiro admin (seed) e so entao sobe o servidor
db.sync()
    .then(() => seedAdmin())
    .catch((error) => console.error('Erro ao iniciar o banco/seed:', error))
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`SERVIDOR RODANDO http://localhost:${PORT}`);
        });
    });