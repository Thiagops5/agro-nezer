const authService = require('./auth.service');

const authController = {
    async login(req, res) {
        try {
            const { identificador, senha } = req.body;
            const result = await authService.login(identificador, senha);
            res.json(result);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    },

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const tokens = await authService.refreshToken(refreshToken);
            res.json(tokens);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    },

    async me(req, res) {
        try {
            // o id vem do token decodificado pelo middleware verifyToken (req.usuario)
            const usuario = await authService.me(req.usuario.id);
            res.json(usuario);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    },

    async trocarSenha(req, res) {
        try {
            const { senhaAtual, novaSenha } = req.body;
            const result = await authService.trocarSenha(req.usuario.id, senhaAtual, novaSenha);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async logout(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const { refreshToken } = req.body;
            await authService.logout(refreshToken, token);
            res.json({ message: 'Logout realizado com sucesso' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = authController;
