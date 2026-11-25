const db = require('../config/db');
const { DataTypes } = require('sequelize');

const AcertoFinanceiro = db.define('AcertoFinanceiro', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    dataAcerto: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    // soma de todas as colheitas APROVADAS que ainda estavam em aberto (sem acertoFinanceiroId)
    receitas: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    // soma de todas as aplicacoes de insumos que ainda estavam em aberto
    descontos: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    // receitas - descontos
    saldoLiquido: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    // percentual copiado do Talhao no momento do fechamento (ex: 50%)
    percentualMeeiro: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // parte liquida do Meeiro / Parceiro
    valorAcerto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    // parte liquida do Produtor / Dono da terra
    valorProdutor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    // caixa de selecao fechada com ENUM: so aceita PENDENTE ou PAGO
    statusPagamento: {
        type: DataTypes.ENUM('PENDENTE', 'PAGO'),
        allowNull: false,
        defaultValue: 'PENDENTE'
    },
    // comprovante PIX opcional anexado pelo Admin quando paga o meeiro
    urlComprovantePix: {
        type: DataTypes.STRING(500),
        allowNull: true
    }
});

module.exports = AcertoFinanceiro;
