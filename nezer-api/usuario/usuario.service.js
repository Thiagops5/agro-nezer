const bcrypt = require('bcrypt');
const { criptografar, descriptografar } = require('../config/crypto');
// Importamos tudo de ../models porque o delete precisa contar se o usuario tem talhoes, aplicacoes, colheitas, acertos ou ocorrencias vinculados!
const {
    db,
    Usuario,
    Talhao,
    Aplicacao,
    Colheita,
    AcertoFinanceiro,
    refreshToken
} = require('../models');

// Helper simples para devolver o usuario para a tela sem a senha (o toJSON ja tira) e com cpf/telefone legiveis
function descriptografarUsuario(usuario) {
    if (!usuario) return null;
    const dados = usuario.toJSON();
    if (dados.cpf) dados.cpf = descriptografar(dados.cpf);
    if (dados.telefone) dados.telefone = descriptografar(dados.telefone);
    return dados;
}

const usuarioService = {
    create: async (usuarioData) => {
        try {
            usuarioData.senha = await bcrypt.hash(usuarioData.senha, 10);
            usuarioData.cpf = criptografar(usuarioData.cpf.replace(/\D/g, ''));

            if (usuarioData.email) {
                usuarioData.email = usuarioData.email.trim().toLowerCase();
            }
            if (usuarioData.telefone) {
                usuarioData.telefone = criptografar(usuarioData.telefone.replace(/\D/g, ''));
            }

            const novoUsuario = await Usuario.create(usuarioData);
            return descriptografarUsuario(novoUsuario);
        } catch (error) {
            throw new Error('Erro ao criar usuário: ' + error.message);
        }
    },

    // Uso interno (ex: auth.service.js precisa da instancia do Sequelize com .senha e .save())
    findById: async (id) => {
        return await Usuario.findByPk(id);
    },

    // Uso da tela do Admin (devolve sem senha e com cpf/telefone descriptografados)
    findByIdPublico: async (id) => {
        const usuario = await Usuario.findByPk(id);
        return descriptografarUsuario(usuario);
    },

    findByCpf: async (cpf) => {
        const cpfCifrado = criptografar(cpf.replace(/\D/g, ''));
        return await Usuario.findOne({ where: { cpf: cpfCifrado } });
    },

    findByEmail: async (email) => {
        return await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });
    },

    findAll: async (incluirInativos = false) => {
        const where = incluirInativos ? {} : { ativo: true };
        const usuarios = await Usuario.findAll({ where });
        return usuarios.map(descriptografarUsuario);
    },

    findArquivados: async () => {
        const usuarios = await Usuario.findAll({ where: { ativo: false } });
        return usuarios.map(descriptografarUsuario);
    },

    // Filtra so os campos permitidos para ninguem alterar senha ou id por aqui
    update: async (id, data) => {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) throw new Error('Usuário não encontrado');

        const allowedFields = ['nome', 'email', 'telefone', 'perfil'];
        const updateData = {};

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        }

        if (updateData.email) {
            updateData.email = updateData.email.trim().toLowerCase();
        }
        if (updateData.telefone) {
            updateData.telefone = criptografar(updateData.telefone.replace(/\D/g, ''));
        }

        await usuario.update(updateData);
        return descriptografarUsuario(usuario);
    },

    // Ativa ou desativa/arquiva o meeiro/ajudante (ao desativar: checa pendencias, desvincula talhoes e revoga tokens)
    toggleAtivo: async (id, ativo) => {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) throw new Error('Usuário não encontrado');

        // Se estiver reativando, volta para a lista ativa com o mesmo login e senha
        if (ativo) {
            await usuario.update({ ativo: true });
            return descriptografarUsuario(usuario);
        }

        // 1. Trava financeira: nao deixa desativar/arquivar se houver acerto PENDENTE ou lancamentos em aberto
        const acertoPendente = await AcertoFinanceiro.count({
            where: { usuarioId: id, statusPagamento: 'PENDENTE' }
        });
        const colheitaEmAberto = await Colheita.count({
            where: { usuarioId: id, acertoFinanceiroId: null }
        });
        const aplicacaoEmAberto = await Aplicacao.count({
            where: { usuarioId: id, acertoFinanceiroId: null }
        });

        if (acertoPendente > 0 || colheitaEmAberto > 0 || aplicacaoEmAberto > 0) {
            throw new Error(
                'Não foi possível arquivar este usuário pois possui acertos pendentes ou lançamentos em aberto.'
            );
        }

        // 2. Desvincula dos talhoes, revoga sessoes (refresh tokens) e marca ativo = false
        const t = await db.transaction();
        try {
            await Talhao.update({ usuarioId: null }, { where: { usuarioId: id }, transaction: t });
            await usuario.setTalhoesAjudados([], { transaction: t });
            await refreshToken.update({ revoked: true }, { where: { usuarioId: id }, transaction: t });
            await usuario.update({ ativo: false }, { transaction: t });
            await t.commit();
            return descriptografarUsuario(usuario);
        } catch (error) {
            await t.rollback();
            throw error;
        }
    },

    // Mantem compatibilidade caso alguma rota DELETE chame delete(id): executa o mesmo arquivamento seguro
    delete: async (id) => {
        return await usuarioService.toggleAtivo(id, false);
    }
};

module.exports = usuarioService;
