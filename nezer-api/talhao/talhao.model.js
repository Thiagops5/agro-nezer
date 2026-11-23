const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Talhao = db.define('Talhao', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nomeTalhao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    area: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // percentual que cabe ao meeiro no acerto a meia (padrao 50%)
    percentualMeeiro: {
        type: DataTypes.FLOAT,
        defaultValue: 50.0,
        allowNull: false
    },
    // data ate quando o talhao esta em periodo de carencia (null = liberado)
    carenciaAte: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // guarda o nome do ultimo defensivo que gerou a carencia pra exibir direto no alerta vermelho
    ultimoInsumoNome: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Talhao;
