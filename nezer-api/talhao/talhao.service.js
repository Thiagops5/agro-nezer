// Importamos os models com letra maiuscula la do nosso models/index.js
const { Talhao, Cultura, Usuario, Aplicacao, Colheita, AcertoFinanceiro } = require('../models');

const talhaoService = {
    create: async (talhaoData) => {
        try {
            return await Talhao.create(talhaoData);
        } catch (error) {
            throw new Error('Erro ao criar talhão: ' + error.message);
        }
    },

    findAll: async () => {
        // traz a cultura (com os 3 precos de caixa) e o meeiro responsavel pelo talhao
        return await Talhao.findAll({
            include: [
                { model: Cultura },
                { model: Usuario }
            ]
        });
    },

    findById: async (id) => {
        return await Talhao.findByPk(id, {
            include: [
                { model: Cultura },
                { model: Usuario }
            ]
        });
    },

    update: async (id, talhaoData) => {
        const talhao = await Talhao.findByPk(id);
        if (!talhao) throw new Error('Talhão não encontrado');

        return await talhao.update(talhaoData);
    },

    delete: async (id) => {
        const talhao = await Talhao.findByPk(id);
        if (!talhao) throw new Error('Talhão não encontrado');

        // 1. Verifica se existe um usuario (meeiro) vinculado a este talhao
        if (talhao.usuarioId) {
            throw new Error('Não foi possível excluir talhão pois possui registros vinculados (meeiro responsável ativo neste talhão).');
        }

        // 2. Verifica se ja existem aplicacoes, colheitas ou acertos registrados neste talhao
        const aplicacaoCount = await Aplicacao.count({ where: { talhaoId: id } });
        const colheitaCount = await Colheita.count({ where: { talhaoId: id } });
        const acertoCount = await AcertoFinanceiro.count({ where: { talhaoId: id } });

        if (aplicacaoCount > 0 || colheitaCount > 0 || acertoCount > 0) {
            throw new Error('Não foi possível excluir talhão pois possui registros vinculados (aplicações, colheitas ou acertos).');
        }

        await talhao.destroy();
    }
};

module.exports = talhaoService;
