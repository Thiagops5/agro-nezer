const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Ocorrencia = db.define('Ocorrencia', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    dataOcorrencia: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // foto da praga ou do problema encontrado no talhao
    urlFoto: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // nome do produto que o meeiro sugeriu ou pediu para o Admin comprar
    insumoSugerido: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('ABERTA', 'INSUMO_SOLICITADO', 'INSUMO_DISPONIVEL', 'RESOLVIDA'),
        allowNull: false,
        defaultValue: 'ABERTA'
    },
    observacaoAdmin: {
        type: DataTypes.STRING(500),
        allowNull: true
    }
});

module.exports = Ocorrencia;
