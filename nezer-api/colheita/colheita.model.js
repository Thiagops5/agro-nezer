const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Colheita = db.define('Colheita', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true, // obrigatorio junto com autoIncrement no SQLite
        autoIncrement: true
    },
    dataColheita: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    // aqui usamos ENUM para limitar a caixa de selecao aos 3 destinos oficiais da cultura
    tipoDestino: {
        type: DataTypes.ENUM('MERCADO', 'ATACADO', 'POLPA'),
        allowNull: false
    },
    unMedida: {
        type: DataTypes.ENUM('CX', 'KG', 'UN'),
        allowNull: false,
        defaultValue: 'CX'
    },
    qntCaixas: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    // preco por caixa copiado da Cultura no dia da colheita (o meeiro nao digita valor em R$)
    valorCaixaFixado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    valorTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
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
    // marca se o talhao estava em periodo de carencia na hora da colheita
    emCarencia: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // confirma que o meeiro leu o alerta vermelho e aceitou o termo de ciencia
    termoCienciaAceito: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // toda colheita nasce PENDENTE ate o Admin conferir a foto e aprovar ou rejeitar
    statusConferencia: {
        type: DataTypes.ENUM('PENDENTE', 'APROVADA', 'REJEITADA'),
        allowNull: false,
        defaultValue: 'PENDENTE'
    },
    observacaoAdmin: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // guarda quando a colheita chegou no servidor para controlar a janela de 48h de correcao
    conferidoEm: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = Colheita;
