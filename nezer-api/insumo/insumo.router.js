const { Router } = require('express');
const router = Router();

const insumoController = require('./insumo.controller');
const authMiddleware = require('../auth/auth.middleware');

// Rotas especificas sempre antes de /:id para o Express nao confundir
router.get('/pendentes', authMiddleware.verifyToken, authMiddleware.verifyAdmin, insumoController.findPendentes);
router.get('/esgotados', authMiddleware.verifyToken, insumoController.findEsgotados);

router.get('/', authMiddleware.verifyToken, insumoController.findAll);
router.get('/:id', authMiddleware.verifyToken, insumoController.findById);

router.post('/', authMiddleware.verifyToken, authMiddleware.verifyAdmin, insumoController.create);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, insumoController.update);
router.patch('/:id/ativo', authMiddleware.verifyToken, authMiddleware.verifyAdmin, insumoController.toggleAtivo);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, insumoController.delete);

module.exports = router;
