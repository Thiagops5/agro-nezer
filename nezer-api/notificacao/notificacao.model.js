const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Notificacao = db.define('Notificacao', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tipo: {
        type: DataTypes.ENUM(
            // Notificacoes para o Meeiro / Ajudante
            'COLHEITA_APROVADA',
            'COLHEITA_AJUSTADA',
            'COLHEITA_REJEITADA',
            'INSUMO_DISPONIVEL',
            'INSUMO_CONFIRMADO',
            'ACERTO_GERADO',
            'ACERTO_PAGO',
            // Notificacoes para o Administrador
            'COLHEITA_REGISTRADA',
            'APLICACAO_REGISTRADA',
            'INSUMO_PENDENTE',
            'PRAGA_REPORTADA',
            'AJUDANTE_REGISTRADO'
        ),
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mensagem: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    lida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    // identifica qual entidade gerou a notificacao para o front-end abrir direto no clique
    referenciaTipo: {
        type: DataTypes.ENUM('COLHEITA', 'APLICACAO', 'OCORRENCIA', 'ACERTO', 'INSUMO', 'USUARIO'),
        allowNull: true
    },
    referenciaId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // guarda detalhes extras em JSON, ex: { antes: 40, depois: 38 } quando o Admin ajusta uma colheita
    dadosExtras: {
        type: DataTypes.JSON,
        allowNull: true
    }
});

module.exports = Notificacao;
