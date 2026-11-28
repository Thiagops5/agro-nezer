const { Router } = require('express');
const router = Router();

const notificacaoController = require('./notificacao.controller');
const authMiddleware = require('../auth/auth.middleware');

// Nao existe rota POST aqui: quem cria notificacoes sao os outros services por dentro do servidor!
router.get('/', authMiddleware.verifyToken, notificacaoController.findMinhas);
router.patch('/ler-todas', authMiddleware.verifyToken, notificacaoController.marcarTodasComoLidas);
router.patch('/:id/lida', authMiddleware.verifyToken, notificacaoController.marcarComoLida);

module.exports = router;
