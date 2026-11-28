const { Notificacao, Usuario } = require('../models');

const notificacaoService = {
    // Funcao interna chamada pelos outros services (colheita, aplicacao, ocorrencia, acerto, insumo)
    notificar: async (
        { usuarioId, tipo, titulo, mensagem, referenciaTipo = null, referenciaId = null, dadosExtras = null },
        transaction = null
    ) => {
        return await Notificacao.create(
            { usuarioId, tipo, titulo, mensagem, referenciaTipo, referenciaId, dadosExtras },
            transaction ? { transaction } : {}
        );
    },

    // Helper para disparar notificacao automatica para todos os Admins ativos (ex: nova colheita, praga, insumo pendente)
    notificarAdmins: async (
        { tipo, titulo, mensagem, referenciaTipo = null, referenciaId = null, dadosExtras = null },
        transaction = null
    ) => {
        const admins = await Usuario.findAll({
            where: { perfil: 'ADMIN', ativo: true },
            attributes: ['id'],
            transaction: transaction || undefined
        });

        for (const admin of admins) {
            await notificacaoService.notificar(
                { usuarioId: admin.id, tipo, titulo, mensagem, referenciaTipo, referenciaId, dadosExtras },
                transaction
            );
        }
    },

    findMinhas: async (usuarioId) => {
        return await Notificacao.findAll({
            where: { usuarioId },
            order: [['createdAt', 'DESC']] // traz as mais novas primeiro
        });
    },

    marcarComoLida: async (id, usuarioId) => {
        // busca por id E usuarioId para ninguem marcar a notificacao de outra pessoa
        const notificacao = await Notificacao.findOne({ where: { id, usuarioId } });
        if (!notificacao) throw new Error('Notificação não encontrada');
        return await notificacao.update({ lida: true });
    },

    marcarTodasComoLidas: async (usuarioId) => {
        await Notificacao.update({ lida: true }, { where: { usuarioId, lida: false } });
        return { message: 'Todas as notificações foram marcadas como lidas.' };
    }
};

module.exports = notificacaoService;
