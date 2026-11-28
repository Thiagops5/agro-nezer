const aplicacaoService = require('./aplicacao.service');
const { salvarArquivo } = require('../config/upload');

const aplicacaoController = {
    create: async (req, res) => {
        try {
            const urlFoto = req.file ? await salvarArquivo(req.file, 'aplicacoes') : null;
            const novaAplicacao = await aplicacaoService.create(req.body, req.usuario, urlFoto);
            res.status(201).json(novaAplicacao);
        } catch (error) {
            if (error.message.includes('Acesso negado')) {
                return res.status(403).json({ error: error.message });
            }
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }
            res.status(400).json({ error: error.message });
        }
    },

    findAll: async (req, res) => {
        try {
            const aplicacoes = await aplicacaoService.findAll(req.usuario);
            res.json(aplicacoes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    findById: async (req, res) => {
        try {
            const aplicacao = await aplicacaoService.findById(req.params.id, req.usuario);
            if (!aplicacao) {
                return res.status(404).json({ error: 'Aplicação não encontrada' });
            }
            res.json(aplicacao);
        } catch (error) {
            if (error.message.includes('Acesso negado')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = aplicacaoController;
