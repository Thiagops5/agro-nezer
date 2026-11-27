// Importamos os models com letra maiuscula la do nosso models/index.js
const { Talhao, Cultura, Usuario, Aplicacao, Colheita, AcertoFinanceiro } = require('../models');

const talhaoService = {
    create: async (talhaoData) => {
        try {
            const newTalhao = await Talhao.create(talhaoData);

            // se o admin mandou uma lista de ids de meeiros ajudantes, faz a ligacao N:M na tabela intermediaria
            if (talhaoData.ajudantes && talhaoData.ajudantes.length > 0) {
                await newTalhao.setAjudantes(talhaoData.ajudantes);
            }

            return newTalhao;
        } catch (error) {
            throw new Error('Erro ao criar talhão: ' + error.message);
        }
    },

    findAll: async () => {
        // traz a cultura, o meeiro responsavel e os meeiros ajudantes vinculados ao talhao
        return await Talhao.findAll({
            include: [
                { model: Cultura },
                { model: Usuario },
                { model: Usuario, as: 'ajudantes', through: { attributes: [] } }
            ]
        });
    },

    findById: async (id) => {
        return await Talhao.findByPk(id, {
            include: [
                { model: Cultura },
                { model: Usuario },
                { model: Usuario, as: 'ajudantes', through: { attributes: [] } }
            ]
        });
    },

    update: async (id, talhaoData) => {
        const talhao = await Talhao.findByPk(id);
        if (!talhao) throw new Error('Talhão não encontrado');

        await talhao.update(talhaoData);

        // atualiza os meeiros ajudantes vinculados ao talhao se o array vier no body
        if (talhaoData.ajudantes) {
            await talhao.setAjudantes(talhaoData.ajudantes);
        }

        return talhao;
    },

    // Desvincula o meeiro responsavel (ou ajudantes) deste talhao sem apagar o talhao nem o usuario
    desvincularMeeiro: async (id, usuarioId = null) => {
        const talhao = await Talhao.findByPk(id);
        if (!talhao) throw new Error('Talhão não encontrado');

        if (!usuarioId || talhao.usuarioId === Number(usuarioId)) {
            await talhao.update({ usuarioId: null });
        }
        if (usuarioId) {
            await talhao.removeAjudante(Number(usuarioId));
        }

        return await talhaoService.findById(id);
    },

    delete: async (id) => {
        const talhao = await Talhao.findByPk(id);
        if (!talhao) throw new Error('Talhão não encontrado');

        // 1. Verifica se existe um meeiro responsavel ou meeiros ajudantes vinculados a este talhao
        const ajudantesCount = await talhao.countAjudantes();
        if (talhao.usuarioId || ajudantesCount > 0) {
            throw new Error('Não foi possível excluir talhão pois possui registros vinculados (meeiro responsável ou ajudantes ativos neste talhão).');
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
