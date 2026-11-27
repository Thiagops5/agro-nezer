const authService = require('./auth.service');

const authMiddleware = {
    verifyToken: async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Token não fornecido' });
            }

            // Separa o "Bearer" do token JWT
            const parts = authHeader.split(' ');
            if (parts.length !== 2) {
                return res.status(401).json({ error: 'Erro no formato do token' });
            }

            const [scheme, token] = parts;
            if (!/^Bearer$/i.test(scheme)) {
                return res.status(401).json({ error: 'Token mal formatado' });
            }

            // Chama o service para verificar a validade e a blacklist
            const decoded = await authService.verifyToken(token);

            // Anexa os dados decodificados (id, identificador, nome, perfil) na requisicao
            req.usuario = decoded;

            return next();
        } catch (error) {
            return res.status(401).json({ error: error.message || 'Token inválido ou expirado' });
        }
    },

    // Libera somente para o Produtor / Dono da terra (ADMIN)
    verifyAdmin: (req, res, next) => {
        if (!req.usuario || req.usuario.perfil !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado: Apenas administradores podem realizar esta ação' });
        }
        next();
    },

    // Libera para ADMIN e MEEIRO (bloqueando o AJUDANTE em rotas financeiras como o Acerto a Meia)
    verifyUser: (req, res, next) => {
        if (!req.usuario || !['ADMIN', 'MEEIRO'].includes(req.usuario.perfil)) {
            return res.status(403).json({ error: 'Acesso negado: Apenas administradores ou meeiros responsáveis podem realizar esta ação' });
        }
        next();
    }
};

module.exports = authMiddleware;
