const { Router } = require('express');
const router = Router();

const authController = require('./auth.controller');
const authMiddleware = require('./auth.middleware');

router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware.verifyToken, authController.me);
router.put('/me', authMiddleware.verifyToken, authController.atualizarPerfil);
router.patch('/trocar-senha', authMiddleware.verifyToken, authController.trocarSenha);

module.exports = router;
