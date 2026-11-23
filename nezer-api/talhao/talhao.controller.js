const talhaoService = require('./talhao.service');

const talhaoController = {
    create: async (req, res) => {
        try {
            const newTalhao = await talhaoService.create(req.body);
            res.status(201).json(newTalhao);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    findAll: async (req, res) => {
        try {
            const talhoes = await talhaoService.findAll();
            res.json(talhoes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    findById: async (req, res) => {
        try {
            const talhao = await talhaoService.findById(req.params.id);
            if (!talhao) {
                return res.status(404).json({ error: 'Talhão não encontrado' });
            }
            res.json(talhao);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const updatedTalhao = await talhaoService.update(req.params.id, req.body);
            res.json(updatedTalhao);
        } catch (error) {
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }
            res.status(400).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await talhaoService.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            if (error.message.includes('possui registros vinculados')) {
                return res.status(409).json({ error: error.message });
            }
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = talhaoController;


module.exports = talhaoController;