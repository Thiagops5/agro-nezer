const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Insumo = db.define('Insumo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nomeInsumo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    tipoInsumo: {
        type: DataTypes.ENUM('DEFENSIVO', 'FERTILIZANTE', 'BIOLOGICO', 'OUTRO'),
        allowNull: false,
        defaultValue: 'DEFENSIVO'
    },
    unidadeMedida: {
        type: DataTypes.ENUM('L', 'ml', 'Kg', 'g', 't', 'un'),
        allowNull: false,
        defaultValue: 'L'
    },
    // custo unitario que vira desconto no acerto financeiro (comeca 0 se for sugerido pelo meeiro)
    custoUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    // quantidade atual disponivel no barracao (quando chega a 0 na aplicacao, desativa automaticamente)
    quantidadeEstoque: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    carenciaDias: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    // nota fiscal opcional em PDF ou imagem para dar transparencia ao custo descontado
    urlNotaFiscal: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // se o meeiro usar um insumo fora da lista, nasce PENDENTE_CONFIRMACAO ate o Admin preencher custo e bula
    statusCadastro: {
        type: DataTypes.ENUM('CONFIRMADO', 'PENDENTE_CONFIRMACAO'),
        allowNull: false,
        defaultValue: 'CONFIRMADO'
    },
    // quando o insumo acaba no estoque, fica ativo = false (oculto para novas aplicacoes, mas preserva o historico)
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
});

module.exports = Insumo;
