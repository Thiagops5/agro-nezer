const db = require('../config/db');
const { DataTypes } = require('sequelize');

// Tabela intermediaria (N:M) que permite aplicar 1 ou varios insumos na mesma pulverizacao
const AplicacaoInsumo = db.define('AplicacaoInsumo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    quantidadeAplicada: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    unMedida: {
        type: DataTypes.ENUM('L', 'ml', 'Kg', 'g', 'un'),
        allowNull: false
    },
    // congela o custo unitario do insumo no momento da aplicacao (ou apos confirmacao do Admin)
    custoUnitarioCongelado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    custoItem: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    carenciaDiasAplicada: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    dataFimCarencia: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

module.exports = AplicacaoInsumo;
