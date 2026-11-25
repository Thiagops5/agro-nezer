const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Cultura = db.define('Cultura', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nomeCultura: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // os 3 precos por caixa definidos pelo Admin para cada canal de venda
    precoMercado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    precoAtacado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    precoPolpa: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
});

module.exports = Cultura;
