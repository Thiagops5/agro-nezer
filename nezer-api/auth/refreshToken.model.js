const db = require('../config/db');
const { DataTypes } = require('sequelize');

const refreshToken = db.define('refresh_token', {
    token: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = refreshToken;
