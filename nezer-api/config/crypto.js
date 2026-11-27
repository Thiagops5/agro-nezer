const crypto = require('crypto');

const ALGORITMO = 'aes-256-cbc';

// Gera uma chave de 32 bytes e um IV de 16 bytes a partir da senha secreta do .env
// Usamos IV deterministico para que o mesmo CPF sempre gere o mesmo texto cifrado (permitindo buscar no banco e manter unique: true)
function getChaves() {
    const segredo = process.env.CRYPTO_SECRET;
    if (!segredo) {
        throw new Error('CRYPTO_SECRET não configurada no .env');
    }
    const chave = crypto.createHash('sha256').update(segredo).digest();
    const iv = crypto.createHash('md5').update(segredo).digest();
    return { chave, iv };
}

function criptografar(texto) {
    if (!texto) return texto;
    const { chave, iv } = getChaves();
    const cipher = crypto.createCipheriv(ALGORITMO, chave, iv);
    let encrypted = cipher.update(String(texto), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function descriptografar(textoCifrado) {
    if (!textoCifrado) return textoCifrado;
    const { chave, iv } = getChaves();
    const decipher = crypto.createDecipheriv(ALGORITMO, chave, iv);
    let decrypted = decipher.update(textoCifrado, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { criptografar, descriptografar };
