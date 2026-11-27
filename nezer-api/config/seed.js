const { Usuario } = require('../models');
const usuarioService = require('../usuario/usuario.service');

// Cria o primeiro administrador (Dono) quando ainda nao existe nenhum no banco.
// Os dados podem ser trocados pelo .env (ADMIN_NOME, ADMIN_CPF, ADMIN_EMAIL, ADMIN_SENHA).
const seedAdmin = async () => {
    const adminExists = await Usuario.findOne({ where: { perfil: 'ADMIN' } });
    if (adminExists) return;

    const email = process.env.ADMIN_EMAIL || 'admin@agronezer.com';
    const cpf = process.env.ADMIN_CPF || '00000000000';
    const senha = process.env.ADMIN_SENHA || '123456';

    await usuarioService.create({
        nome: process.env.ADMIN_NOME || 'Produtor Admin',
        cpf,
        email,
        senha,
        perfil: 'ADMIN',
        mustChangePassword: false
    });

    console.log(`SEED: administrador criado (${email} | CPF: ${cpf})`);
};

module.exports = seedAdmin;
