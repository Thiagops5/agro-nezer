// Tabela de conversao para a unidade base de cada familia
// Volume -> base em ml | Massa -> base em g | Unidade -> base em un
const FATORES = {
    L: { familia: 'VOLUME', fator: 1000 },
    ml: { familia: 'VOLUME', fator: 1 },
    t: { familia: 'MASSA', fator: 1000000 },
    Kg: { familia: 'MASSA', fator: 1000 },
    g: { familia: 'MASSA', fator: 1 },
    un: { familia: 'UNIDADE', fator: 1 }
};

/**
 * Converte uma quantidade da unidade aplicada na roca para a unidade base cadastrada no Insumo.
 * Ex: converterUnidade(500, 'ml', 'L') => 0.5
 */
function converterUnidade(quantidade, deUnidade, paraUnidade) {
    const qtd = Number(quantidade);
    if (Number.isNaN(qtd) || qtd <= 0) {
        throw new Error('Quantidade aplicada deve ser maior que zero.');
    }

    if (deUnidade === paraUnidade) return qtd;

    const origem = FATORES[deUnidade];
    const destino = FATORES[paraUnidade];

    if (!origem || !destino) {
        throw new Error(`Unidade de medida inválida: ${deUnidade} -> ${paraUnidade}`);
    }

    if (origem.familia !== destino.familia) {
        throw new Error(`Unidade incompatível: não é possível converter ${deUnidade} para ${paraUnidade}.`);
    }

    // Converte para a unidade base (ml ou g) e depois divide pelo fator da unidade do Insumo
    const emBase = qtd * origem.fator;
    return emBase / destino.fator;
}

module.exports = { converterUnidade, FATORES };
