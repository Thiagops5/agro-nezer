const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Usuario = db.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    // telefone como STRING pra nao perder zero à esquerda do DDD ou formatacao
    telefone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // cpf obrigatorio e unico (serve tambem para fazer o login sem precisar inventar username)
    cpf: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // trocamos o nome isAdmin por perfil porque agora sao 3 papeis (e nao só true/false)
    perfil: {
        type: DataTypes.ENUM('ADMIN', 'MEEIRO', 'AJUDANTE'),
        allowNull: false,
        defaultValue: 'MEEIRO'
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    // quando o Admin cadastra o meeiro, ele precisa criar a propria senha no primeiro acesso
    mustChangePassword: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

// garante que o hash da senha nunca seja enviado nas respostas JSON da API
Usuario.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.senha;
    return values;
};

module.exports = Usuario;
