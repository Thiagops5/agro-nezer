const insumoService = require('./insumo.service');

const insumoController = {

  async create(req, res) {
    try {
      const criar = await insumoService.create(req.body);
      res.status(201).json(criar);
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  async findAll(req, res) {
    try {
      const incluirInativos = req.query.incluirInativos === 'true';
      const result = await insumoService.findAll(incluirInativos);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findById(req, res) {
    try {
      const result = await insumoService.findById(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Insumo não encontrado' });
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const atualiza = await insumoService.update(req.params.id, req.body);
      res.status(200).json(atualiza);
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  },

  async findPendentes(req, res) {
    try {
      const pendentes = await insumoService.findPendentes();
      res.status(200).json(pendentes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findEsgotados(req, res) {
    try {
      const esgotados = await insumoService.findEsgotados();
      res.status(200).json(esgotados);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async toggleAtivo(req, res) {
    try {
      const { ativo, quantidadeEstoque, custoUnitario, valorTotalCompra, urlNotaFiscal } = req.body;
      if (ativo === undefined) {
        return res.status(400).json({ error: 'O campo ativo é obrigatório' });
      }
      const updatedInsumo = await insumoService.toggleAtivo(req.params.id, ativo, {
        quantidadeEstoque,
        custoUnitario,
        valorTotalCompra,
        urlNotaFiscal
      });
      res.status(200).json(updatedInsumo);
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  },


  async delete(req, res) {
    try {
      await insumoService.delete(req.params.id);
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

}

module.exports = insumoController;