const { Insumo, AplicacaoInsumo, Ocorrencia } = require('../models');

const insumoService = {
    create: async (insumoData) => {
        try {
            // Se o Admin informar valorTotalCompra e quantidadeEstoque (> 0), calcula o custoUnitario automatico
            if (
                insumoData.valorTotalCompra !== undefined &&
                Number(insumoData.quantidadeEstoque) > 0 &&
                insumoData.custoUnitario === undefined
            ) {
                insumoData.custoUnitario =
                    Number(insumoData.valorTotalCompra) / Number(insumoData.quantidadeEstoque);
            }

            // Se informou quantidadeEstoque, define ativo automaticamente (0 = esgotado/inativo)
            if (insumoData.quantidadeEstoque !== undefined && insumoData.ativo === undefined) {
                insumoData.ativo = Number(insumoData.quantidadeEstoque) > 0;
            }
            return await Insumo.create(insumoData);
        } catch (error) {
            throw new Error('Erro ao criar insumo: ' + error.message);
        }
    },

    // Por padrao traz apenas insumos confirmados e disponiveis no estoque (ativo: true) para Aplicacao
    findAll: async (incluirInativos = false) => {
        const where = { statusCadastro: 'CONFIRMADO' };
        if (!incluirInativos) {
            where.ativo = true;
        }
        return await Insumo.findAll({ where });
    },

    // Traz apenas os insumos esgotados (ativo: false) para o meeiro poder pedir reposicao na tela de Praga
    findEsgotados: async () => {
        return await Insumo.findAll({
            where: { statusCadastro: 'CONFIRMADO', ativo: false }
        });
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

        // Se informou valorTotalCompra na edicao, calcula custoUnitario pela nova quantidade (ou pela atual)
        if (insumoData.valorTotalCompra !== undefined && insumoData.custoUnitario === undefined) {
            const qtdBase =
                insumoData.quantidadeEstoque !== undefined
                    ? Number(insumoData.quantidadeEstoque)
                    : Number(insumo.quantidadeEstoque);
            if (qtdBase > 0) {
                insumoData.custoUnitario = Number(insumoData.valorTotalCompra) / qtdBase;
            }
        }

        // Se atualizou a quantidade em estoque, atualiza o status ativo automaticamente
        if (insumoData.quantidadeEstoque !== undefined) {
            insumoData.ativo = Number(insumoData.quantidadeEstoque) > 0;
        }

        return await insumo.update(insumoData);
    },

    // Desativa manualmente ou reativa exigindo confirmacao da nova quantidade em estoque e do custo unitario
    toggleAtivo: async (id, ativo, dadosReposicao = {}) => {
        const insumo = await Insumo.findByPk(id);
        if (!insumo) throw new Error('Insumo não encontrado');

        if (!ativo) {
            return await insumo.update({ ativo: false });
        }

        const novaQtd = Number(dadosReposicao.quantidadeEstoque);

        if (!dadosReposicao.quantidadeEstoque || Number.isNaN(novaQtd) || novaQtd <= 0) {
            throw new Error('Para reativar o insumo, informe a nova quantidade comprada (maior que zero).');
        }

        let novoCusto = dadosReposicao.custoUnitario;
        if (novoCusto === undefined && dadosReposicao.valorTotalCompra !== undefined) {
            novoCusto = Number(dadosReposicao.valorTotalCompra) / novaQtd;
        }

        if (novoCusto === undefined || Number(novoCusto) < 0) {
            throw new Error('Para reativar o insumo, é obrigatório confirmar o custo unitário (ou valorTotalCompra).');
        }

        const updateData = {
            ativo: true,
            quantidadeEstoque: novaQtd,
            custoUnitario: Number(novoCusto)
        };
        if (dadosReposicao.urlNotaFiscal !== undefined) {
            updateData.urlNotaFiscal = dadosReposicao.urlNotaFiscal;
        }

        return await insumo.update(updateData);
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
