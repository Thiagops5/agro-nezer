const db = require('../config/db');


const Usuario = require('../usuario/usuario.model');
const Cultura = require('../cultura/cultura.model');
const Insumo = require('../insumo/insumo.model');
const Talhao = require('../talhao/talhao.model');
const Aplicacao = require('../aplicacao/aplicacao.model');
const AplicacaoInsumo = require('../aplicacao/aplicacaoInsumo.model');
const Colheita = require('../colheita/colheita.model');
const AcertoFinanceiro = require('../acerto/acerto.model');
const refreshToken = require('../auth/refreshToken.model');
const LogoutList = require('../auth/logoutList.model');

// 1. Cultura e Talhao (1:N) - Uma cultura pode estar plantada em varios talhoes
Cultura.hasMany(Talhao, { foreignKey: 'culturaId' });
Talhao.belongsTo(Cultura, { foreignKey: 'culturaId' });

// 2. Usuario (Meeiro Responsavel) e Talhao (1:N) - Quem responde pelo talhao e recebe o acerto
Usuario.hasMany(Talhao, { foreignKey: 'usuarioId' });
Talhao.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// 3. Talhao e Usuario (Meeiros Ajudantes - N:M) - Ajudantes que tambem podem lancar no mesmo talhao
Talhao.belongsToMany(Usuario, {
    through: 'TalhaoAjudante',
    as: 'ajudantes',
    foreignKey: 'talhaoId',
    otherKey: 'usuarioId'
});
Usuario.belongsToMany(Talhao, {
    through: 'TalhaoAjudante',
    as: 'talhoesAjudados',
    foreignKey: 'usuarioId',
    otherKey: 'talhaoId'
});

// 4. Aplicacao: pertence a um Talhao e a um Usuario (quem aplicou no campo)
Talhao.hasMany(Aplicacao, { foreignKey: 'talhaoId' });
Aplicacao.belongsTo(Talhao, { foreignKey: 'talhaoId' });

Usuario.hasMany(Aplicacao, { foreignKey: 'usuarioId' });
Aplicacao.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// 5. Aplicacao e Insumo (N:M com tabela propria AplicacaoInsumo para guardar quantidade e custo congelado)
Aplicacao.hasMany(AplicacaoInsumo, { foreignKey: 'aplicacaoId' });
AplicacaoInsumo.belongsTo(Aplicacao, { foreignKey: 'aplicacaoId' });

Insumo.hasMany(AplicacaoInsumo, { foreignKey: 'insumoId' });
AplicacaoInsumo.belongsTo(Insumo, { foreignKey: 'insumoId' });

// 6. Colheita: pertence a um Talhao e a um Usuario (quem colheu)
Talhao.hasMany(Colheita, { foreignKey: 'talhaoId' });
Colheita.belongsTo(Talhao, { foreignKey: 'talhaoId' });

Usuario.hasMany(Colheita, { foreignKey: 'usuarioId' });
Colheita.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// 7. AcertoFinanceiro: pertence a um Talhao e a um Usuario (Meeiro Responsavel)
Talhao.hasMany(AcertoFinanceiro, { foreignKey: 'talhaoId' });
AcertoFinanceiro.belongsTo(Talhao, { foreignKey: 'talhaoId' });

Usuario.hasMany(AcertoFinanceiro, { foreignKey: 'usuarioId' });
AcertoFinanceiro.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Cada AcertoFinanceiro agrupa varias Aplicacoes (descontos) e varias Colheitas (receitas)
AcertoFinanceiro.hasMany(Aplicacao, { foreignKey: 'acertoFinanceiroId' });
Aplicacao.belongsTo(AcertoFinanceiro, { foreignKey: 'acertoFinanceiroId' });

AcertoFinanceiro.hasMany(Colheita, { foreignKey: 'acertoFinanceiroId' });
Colheita.belongsTo(AcertoFinanceiro, { foreignKey: 'acertoFinanceiroId' });

// 8. Autenticacao: Usuario e refreshToken (1:N)
Usuario.hasMany(refreshToken, { foreignKey: 'usuarioId' });
refreshToken.belongsTo(Usuario, { foreignKey: 'usuarioId' });

module.exports = {
    db,
    Usuario,
    Cultura,
    Insumo,
    Talhao,
    Aplicacao,
    AplicacaoInsumo,
    Colheita,
    AcertoFinanceiro,
    refreshToken,
    LogoutList
};
