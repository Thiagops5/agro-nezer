const notificacaoService = require('./notificacao.service');

const notificacaoController = {
    findMinhas: async (req, res) => {
        try {
            // usa sempre o id do usuario logado no token (req.usuario.id)
            const notificacoes = await notificacaoService.findMinhas(req.usuario.id);
            res.json(notificacoes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    marcarComoLida: async (req, res) => {
        try {
            const notificacao = await notificacaoService.marcarComoLida(req.params.id, req.usuario.id);
            res.json(notificacao);
        } catch (error) {
            if (error.message.includes('não encontrada')) {
                return res.status(404).json({ error: error.message });
            }
            res.status(400).json({ error: error.message });
        }
    },

    marcarTodasComoLidas: async (req, res) => {
        try {
            const result = await notificacaoService.marcarTodasComoLidas(req.usuario.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = notificacaoController;
