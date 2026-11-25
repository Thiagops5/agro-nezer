const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Aplicacao = db.define('Aplicacao', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    dataAplicacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    // soma do custoItem de todos os insumos usados nessa aplicacao (mistura de tanque)
    custoTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    urlFoto: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    latitude: {
        type: DataTypes.STRING,
        allowNull: true
    },
    longitude: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // fica PENDENTE_INSUMO se algum insumo personalizado ainda estiver aguardando o Admin confirmar
    status: {
        type: DataTypes.ENUM('REGISTRADA', 'PENDENTE_INSUMO'),
        allowNull: false,
        defaultValue: 'REGISTRADA'
    }
});

module.exports = Aplicacao;
