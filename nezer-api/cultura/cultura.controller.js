const culturaService = require('./cultura.service');

const culturaController = {
  create: async (req, res) => {
    try {
      const novaCultura = await culturaService.create(req.body);
      res.status(201).json(novaCultura);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  findAll: async (req, res) => {
    try {
      const culturas = await culturaService.findAll();
      res.json(culturas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  findById: async (req, res) => {
    try {
      const cultura = await culturaService.findById(req.params.id);
      if (!cultura) {
        return res.status(404).json({ error: 'Cultura não encontrada' });
      }
      res.json(cultura);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  update: async (req, res) => {
    try {
      const cultura = await culturaService.update(req.params.id, req.body);
      res.json(cultura);
    } catch (error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  },
  delete: async (req, res) => {
    try {
      await culturaService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (error.message.includes('existem talhões associados')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = culturaController;