const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const usuarioService = require('../usuario/usuario.service');
const LogoutList = require('./logoutList.model');
const RefreshToken = require('./refreshToken.model');

const authService = {
    login: async (identificador, senha) => {
        if (!identificador || !senha) {
            throw new Error('Informe CPF ou e-mail e senha');
        }

        // Se tiver '@', o usuario digitou um e-mail; senao, tira pontos/tracos e busca pelo CPF!
        const usuario = identificador.includes('@')
            ? await usuarioService.findByEmail(identificador.trim().toLowerCase())
            : await usuarioService.findByCpf(identificador.replace(/\D/g, ''));

        if (!usuario) throw new Error('Identificador ou senha errada');

        const isMatch = await bcrypt.compare(senha, usuario.senha);
        if (!isMatch) {
            throw new Error('Identificador ou senha errada');
        }
        if (!usuario.ativo) throw new Error('Este usuário foi desativado!');

        const token = jwt.sign(
            {
                id: usuario.id,
                identificador: usuario.email || usuario.cpf,
                nome: usuario.nome,
                perfil: usuario.perfil
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        const refreshTokenValue = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7));
        await RefreshToken.create({
            token: refreshTokenValue,
            usuarioId: usuario.id,
            expiresAt,
            revoked: false
        });

        return {
            accessToken: token,
            refreshToken: refreshTokenValue,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                identificador: usuario.email || usuario.cpf,
                perfil: usuario.perfil,
                // avisa o front-end se o usuario ainda precisa criar a propria senha no primeiro acesso
                mustChangePassword: usuario.mustChangePassword
            }
        };
    },

    refreshToken: async (oldRefreshTokenValue) => {
        if (!oldRefreshTokenValue) {
            throw new Error('Refresh token não fornecido');
        }

        const storedToken = await RefreshToken.findOne({ where: { token: oldRefreshTokenValue } });
        if (!storedToken) {
            throw new Error('Refresh token inválido');
        }

        // token ja revogado sendo reutilizado: revoga todos os refresh tokens do usuario (deteccao de roubo)
        if (storedToken.revoked) {
            await RefreshToken.update({ revoked: true }, { where: { usuarioId: storedToken.usuarioId } });
            throw new Error('Tentativa de reutilização de token detectada. Sessão encerrada por segurança.');
        }

        if (new Date() > new Date(storedToken.expiresAt)) {
            throw new Error('Refresh token expirado');
        }

        // rotacao: o refresh antigo e revogado e um novo par e emitido
        storedToken.revoked = true;
        await storedToken.save();

        const usuario = await usuarioService.findById(storedToken.usuarioId);
        if (!usuario || !usuario.ativo) {
            throw new Error('Usuário inválido ou desativado');
        }

        const newAccessToken = jwt.sign(
            {
                id: usuario.id,
                identificador: usuario.email || usuario.cpf,
                nome: usuario.nome,
                perfil: usuario.perfil
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        const newRefreshTokenValue = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7));
        await RefreshToken.create({
            token: newRefreshTokenValue,
            usuarioId: usuario.id,
            expiresAt,
            revoked: false
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshTokenValue
        };
    },

    logout: async (refreshTokenValue, token) => {
        if (refreshTokenValue) {
            await RefreshToken.update({ revoked: true }, { where: { token: refreshTokenValue } });
        }
        await LogoutList.create({ token });
    },

    me: async (id) => {
        const usuario = await usuarioService.findById(id);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }
        return {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil,
            mustChangePassword: usuario.mustChangePassword
        };
    },

    // Pensei comigo mesmo antes de fazer: "se é ruim o usuário usar o PUT de /usuarios/:id para editar a si mesmo
    // (porque ele poderia trocar o id na URL ou tentar mandar perfil: 'ADMIN' no body), como eu faria isso seguro?"
    // Daí cheguei à conclusão: "por que não aproveitar o /me do auth, que já pega o id direto do token, e criar
    // um PUT /me para alterar só os próprios dados (nome, email e telefone) sem precisar de id na URL?"
    atualizarPerfil: async (usuarioId, { nome, email, telefone }) => {
        return await usuarioService.update(usuarioId, { nome, email, telefone });
    },

    // usada quando o meeiro entra pela primeira vez com a senha temporaria e define a senha definitiva
    trocarSenha: async (usuarioId, senhaAtual, novaSenha) => {
        if (!senhaAtual || !novaSenha) {
            throw new Error('Informe a senha atual e a nova senha');
        }
        if (novaSenha.length < 6) {
            throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        }

        const usuario = await usuarioService.findById(usuarioId);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        const senhaConfere = await bcrypt.compare(senhaAtual, usuario.senha);
        if (!senhaConfere) {
            throw new Error('Senha atual incorreta');
        }

        usuario.senha = await bcrypt.hash(novaSenha, 10);
        usuario.mustChangePassword = false;
        await usuario.save();

        return { message: 'Senha atualizada com sucesso!' };
    },

    verifyToken: async (token) => {
        try {
            const isBlacklisted = await LogoutList.findOne({ where: { token } });
            if (isBlacklisted) {
                throw new Error('Token revogado');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new Error('Token inválido');
        }
    }
};

module.exports = authService;
