const { Insumo, AplicacaoInsumo, Ocorrencia } = require('../models');

const insumoService = {
    create: async (insumoData) => {
        try {
            return await Insumo.create(insumoData);
        } catch (error) {
            throw new Error('Erro ao criar insumo: ' + error.message);
        }
    },

    // Por padrao traz apenas insumos confirmados e disponiveis no estoque (ativo: true)
    findAll: async (incluirInativos = false) => {
        const where = { statusCadastro: 'CONFIRMADO' };
        if (!incluirInativos) {
            where.ativo = true;
        }
        return await Insumo.findAll({ where });
    },

    // Lista os insumos personalizados sugeridos pelos meeiros que aguardam o Admin preencher custo e carencia
    findPendentes: async () => {
        return await Insumo.findAll({
            where: { statusCadastro: 'PENDENTE_CONFIRMACAO' }
        });
    },

    findById: async (id) => {
        return await Insumo.findByPk(id);
    },

    update: async (id, insumoData) => {
        const insumo = await Insumo.findByPk(id);
        if (!insumo) throw new Error('Insumo não encontrado');

        return await insumo.update(insumoData);
    },

    // Marca como indisponivel (ativo = false) quando acaba no estoque, sem apagar o historico
    toggleAtivo: async (id, ativo) => {
        const insumo = await Insumo.findByPk(id);
        if (!insumo) throw new Error('Insumo não encontrado');

        return await insumo.update({ ativo });
    },

    delete: async (id) => {
        const insumo = await Insumo.findByPk(id);
        if (!insumo) throw new Error('Insumo não encontrado');

        // Trava 409 Conflict: nao exclui insumo que ja foi aplicado ou pedido em ocorrencia
        const aplicacaoCount = await AplicacaoInsumo.count({ where: { insumoId: id } });
        const ocorrenciaCount = await Ocorrencia.count({ where: { insumoId: id } });

        if (aplicacaoCount > 0 || ocorrenciaCount > 0) {
            throw new Error('Não foi possível excluir insumo pois possui registros vinculados.');
        }

        await insumo.destroy();
    }
};

module.exports = insumoService;
