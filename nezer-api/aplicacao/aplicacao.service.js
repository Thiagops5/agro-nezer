const {
    db,
    Aplicacao,
    AplicacaoInsumo,
    Insumo,
    Talhao,
    Usuario
} = require('../models');
const { converterUnidade } = require('../config/unidades');
const notificacaoService = require('../notificacao/notificacao.service');

const aplicacaoService = {
    create: async (dados, usuarioLogado, urlFoto = null) => {
        const t = await db.transaction();
        try {
            const listaItens = typeof dados.itens === 'string' ? JSON.parse(dados.itens) : dados.itens;

            if (!Array.isArray(listaItens) || listaItens.length === 0) {
                throw new Error('Informe pelo menos 1 insumo para registrar a aplicação.');
            }

            const talhao = await Talhao.findByPk(dados.talhaoId, {
                include: [{ model: Usuario, as: 'ajudantes', attributes: ['id'] }],
                transaction: t
            });
            if (!talhao) {
                throw new Error('Talhão não encontrado.');
            }

            if (usuarioLogado.perfil === 'MEEIRO' && talhao.usuarioId !== usuarioLogado.id) {
                throw new Error('Acesso negado: este talhão pertence a outro meeiro.');
            }
            if (usuarioLogado.perfil === 'AJUDANTE') {
                const ehAjudante = talhao.ajudantes?.some((a) => a.id === usuarioLogado.id);
                if (!ehAjudante) {
                    throw new Error('Acesso negado: você não está vinculado a este talhão.');
                }
            }

            const dataBase = dados.dataAplicacao ? new Date(dados.dataAplicacao) : new Date();

            const novaAplicacao = await Aplicacao.create(
                {
                    talhaoId: talhao.id,
                    usuarioId: usuarioLogado.id,
                    dataAplicacao: dataBase,
                    urlFoto,
                    latitude: dados.latitude || null,
                    longitude: dados.longitude || null,
                    custoTotal: 0,
                    status: 'REGISTRADA'
                },
                { transaction: t }
            );

            let custoTotalAplicacao = 0;
            let temInsumoPendente = false;
            let maiorDataCarencia = null;
            let maiorCarenciaDias = 0;
            let nomeMaiorCarencia = null;

            for (const item of listaItens) {
                if (!item.quantidadeAplicada || Number(item.quantidadeAplicada) <= 0) {
                    throw new Error('A quantidade aplicada de cada insumo deve ser maior que zero.');
                }

                if (item.insumoId) {
                    const insumo = await Insumo.findByPk(item.insumoId, { transaction: t });
                    if (!insumo) {
                        throw new Error(`Insumo ID ${item.insumoId} não encontrado.`);
                    }
                    if (insumo.statusCadastro !== 'CONFIRMADO' || !insumo.ativo) {
                        throw new Error(`O insumo "${insumo.nomeInsumo}" está esgotado ou aguardando confirmação do Admin.`);
                    }

                    const unAplicada = item.unMedida || insumo.unidadeMedida;
                    const qtdConvertida = converterUnidade(item.quantidadeAplicada, unAplicada, insumo.unidadeMedida);

                    if (Number(insumo.quantidadeEstoque) < qtdConvertida) {
                        throw new Error(
                            `Estoque insuficiente para "${insumo.nomeInsumo}". Disponível: ${insumo.quantidadeEstoque} ${insumo.unidadeMedida}.`
                        );
                    }

                    let novoEstoque = Number(insumo.quantidadeEstoque) - qtdConvertida;
                    let continuaAtivo = true;
                    if (novoEstoque <= 0.0001) {
                        novoEstoque = 0;
                        continuaAtivo = false;
                    }
                    await insumo.update(
                        { quantidadeEstoque: Number(novoEstoque.toFixed(2)), ativo: continuaAtivo },
                        { transaction: t }
                    );

                    const custoUnitario = Number(insumo.custoUnitario);
                    const custoItem = Number((qtdConvertida * custoUnitario).toFixed(2));
                    custoTotalAplicacao += custoItem;

                    const dataFimCarencia = new Date(dataBase);
                    dataFimCarencia.setDate(dataFimCarencia.getDate() + insumo.carenciaDias);

                    if (insumo.carenciaDias > 0 && (!maiorDataCarencia || dataFimCarencia > maiorDataCarencia)) {
                        maiorDataCarencia = dataFimCarencia;
                        maiorCarenciaDias = insumo.carenciaDias;
                        nomeMaiorCarencia = insumo.nomeInsumo;
                    }

                    await AplicacaoInsumo.create(
                        {
                            aplicacaoId: novaAplicacao.id,
                            insumoId: insumo.id,
                            quantidadeAplicada: item.quantidadeAplicada,
                            unMedida: unAplicada,
                            custoUnitarioCongelado: custoUnitario,
                            custoItem,
                            carenciaDiasAplicada: insumo.carenciaDias,
                            dataFimCarencia
                        },
                        { transaction: t }
                    );
                } else if (item.nomePersonalizado) {
                    const nomeLimpo = item.nomePersonalizado.trim();
                    let insumoPersonalizado = await Insumo.findOne({
                        where: { nomeInsumo: nomeLimpo },
                        transaction: t
                    });

                    if (!insumoPersonalizado) {
                        insumoPersonalizado = await Insumo.create(
                            {
                                nomeInsumo: nomeLimpo,
                                tipoInsumo: 'OUTRO',
                                unidadeMedida: item.unMedida || 'un',
                                custoUnitario: 0,
                                quantidadeEstoque: 0,
                                carenciaDias: 0,
                                statusCadastro: 'PENDENTE_CONFIRMACAO',
                                ativo: false
                            },
                            { transaction: t }
                        );
                    }

                    temInsumoPendente = true;

                    await AplicacaoInsumo.create(
                        {
                            aplicacaoId: novaAplicacao.id,
                            insumoId: insumoPersonalizado.id,
                            quantidadeAplicada: item.quantidadeAplicada,
                            unMedida: item.unMedida || insumoPersonalizado.unidadeMedida,
                            custoUnitarioCongelado: 0,
                            custoItem: 0,
                            carenciaDiasAplicada: 0,
                            dataFimCarencia: dataBase
                        },
                        { transaction: t }
                    );
                } else {
                    throw new Error('Cada item da aplicação precisa de um insumoId ou nomePersonalizado.');
                }
            }

            await novaAplicacao.update(
                {
                    custoTotal: Number(custoTotalAplicacao.toFixed(2)),
                    status: temInsumoPendente ? 'PENDENTE_INSUMO' : 'REGISTRADA'
                },
                { transaction: t }
            );

            if (
                maiorCarenciaDias > 0 &&
                (!talhao.carenciaAte || maiorDataCarencia > new Date(talhao.carenciaAte))
            ) {
                await talhao.update(
                    {
                        carenciaAte: maiorDataCarencia,
                        ultimoInsumoNome: nomeMaiorCarencia
                    },
                    { transaction: t }
                );
            }

            await notificacaoService.notificarAdmins(
                {
                    tipo: temInsumoPendente ? 'INSUMO_PENDENTE' : 'APLICACAO_REGISTRADA',
                    titulo: temInsumoPendente
                        ? `Insumo personalizado pendente (${talhao.nomeTalhao})`
                        : `Nova aplicação registrada (${talhao.nomeTalhao})`,
                    mensagem: temInsumoPendente
                        ? `${usuarioLogado.nome} aplicou um insumo não cadastrado em ${talhao.nomeTalhao}. Preencha o custo e a carência.`
                        : `${usuarioLogado.nome} registrou uma aplicação em ${talhao.nomeTalhao}.`,
                    referenciaTipo: 'APLICACAO',
                    referenciaId: novaAplicacao.id
                },
                t
            );

            await t.commit();
            return await aplicacaoService.findById(novaAplicacao.id, usuarioLogado);
        } catch (error) {
            await t.rollback();
            throw error;
        }
    },

    findAll: async (usuarioLogado) => {
        const include = [
            {
                model: Talhao,
                include: [{ model: Usuario, as: 'ajudantes', attributes: ['id'], through: { attributes: [] } }]
            },
            { model: Usuario, attributes: ['id', 'nome', 'perfil'] },
            { model: AplicacaoInsumo, include: [{ model: Insumo }] }
        ];

        const aplicacoes = await Aplicacao.findAll({
            include,
            order: [['dataAplicacao', 'DESC']]
        });

        if (usuarioLogado.perfil === 'MEEIRO') {
            return aplicacoes.filter((a) => a.Talhao && a.Talhao.usuarioId === usuarioLogado.id);
        }
        if (usuarioLogado.perfil === 'AJUDANTE') {
            return aplicacoes.filter((a) =>
                a.Talhao?.ajudantes?.some((aj) => aj.id === usuarioLogado.id)
            );
        }

        return aplicacoes;
    },

    findById: async (id, usuarioLogado) => {
        const aplicacao = await Aplicacao.findByPk(id, {
            include: [
                {
                    model: Talhao,
                    include: [{ model: Usuario, as: 'ajudantes', attributes: ['id'], through: { attributes: [] } }]
                },
                { model: Usuario, attributes: ['id', 'nome', 'perfil'] },
                { model: AplicacaoInsumo, include: [{ model: Insumo }] }
            ]
        });

        if (!aplicacao) return null;

        if (usuarioLogado.perfil === 'MEEIRO' && aplicacao.Talhao?.usuarioId !== usuarioLogado.id) {
            throw new Error('Acesso negado: esta aplicação pertence a outro meeiro.');
        }
        if (usuarioLogado.perfil === 'AJUDANTE') {
            const ehAjudante = aplicacao.Talhao?.ajudantes?.some((aj) => aj.id === usuarioLogado.id);
            if (!ehAjudante) {
                throw new Error('Acesso negado: você não está vinculado ao talhão desta aplicação.');
            }
        }

        return aplicacao;
    }
};

module.exports = aplicacaoService;
