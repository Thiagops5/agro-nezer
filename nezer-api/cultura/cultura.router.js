const { Router } = require('express');
const router = Router();

const culturaController = require('./cultura.controller');
const authMiddleware = require('../auth/auth.middleware');

router.get('/', authMiddleware.verifyToken, culturaController.findAll);
router.get('/:id', authMiddleware.verifyToken, culturaController.findById);

router.post('/', authMiddleware.verifyToken, authMiddleware.verifyAdmin, culturaController.create);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, culturaController.update);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, culturaController.delete);

module.exports = router;