const {Router} = require('express');
const router = Router();

const usuarioController = require('./usuario.controller');
const authMiddleware = require('../auth/auth.middleware');

// ADMIN e MEEIRO podem cadastrar (MEEIRO so pode criar AJUDANTE — travado no controller)
router.post('/', authMiddleware.verifyToken, authMiddleware.verifyUser, usuarioController.create);
router.get('/', authMiddleware.verifyToken, authMiddleware.verifyAdmin, usuarioController.findAll);
router.get('/arquivados', authMiddleware.verifyToken, authMiddleware.verifyAdmin, usuarioController.findArquivados);
router.get('/email/:email', authMiddleware.verifyToken, authMiddleware.verifyAdmin, usuarioController.findByEmail);
router.get('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, usuarioController.findById);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, usuarioController.update);
router.patch('/:id/ativo', authMiddleware.verifyToken, authMiddleware.verifyAdmin, usuarioController.toggleAtivo);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, usuarioController.delete);

module.exports = router;