const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Insumo = db.define('Insumo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    custoUnitario: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    unidadeMedida: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Insumo;