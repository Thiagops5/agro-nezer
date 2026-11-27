const express = require('express');
const router = express.Router();
const talhaoController = require('./talhao.controller');
const authMiddleware = require('../auth/auth.middleware');

// leitura: qualquer usuario logado (admin ou meeiro) | escrita: somente admin
router.post('/', authMiddleware.verifyToken, authMiddleware.verifyAdmin, talhaoController.create);
router.get('/', authMiddleware.verifyToken, talhaoController.findAll);
router.get('/:id', authMiddleware.verifyToken, talhaoController.findById);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, talhaoController.update);
router.patch('/:id/desvincular', authMiddleware.verifyToken, authMiddleware.verifyAdmin, talhaoController.desvincularMeeiro);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, talhaoController.delete);

module.exports = router;
