const { Router } = require('express');
const router = Router();

const aplicacaoController = require('./aplicacao.controller');
const authMiddleware = require('../auth/auth.middleware');
const { upload } = require('../config/upload');

router.get('/', authMiddleware.verifyToken, aplicacaoController.findAll);
router.get('/:id', authMiddleware.verifyToken, aplicacaoController.findById);
router.post('/', authMiddleware.verifyToken, upload.single('foto'), aplicacaoController.create);

module.exports = router;
