const multer = require('multer');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf' // para a Nota Fiscal do Insumo!
];


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // limite de 10 MB na entrada
    fileFilter: (req, file, cb) => {
        if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
            return cb(new Error('Formato inválido. Envie apenas imagens (JPG, PNG, WebP) ou PDF.'));
        }
        cb(null, true);
    }
});


async function processarArquivo(file) {
    // Se for PDF (Nota Fiscal), nao passa pelo sharp — devolve intacto
    if (file.mimetype === 'application/pdf') {
        return {
            buffer: file.buffer,
            extensao: 'pdf',
            contentType: 'application/pdf'
        };
    }

    // Se for foto, redimensiona para no maximo 1280px de largura e transforma em WebP leve
    const bufferComprimido = await sharp(file.buffer)
        .rotate() // corrige foto tirada em pe/deitada no celular automaticamente!
        .resize({ width: 1280, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();

    return {
        buffer: bufferComprimido,
        extensao: 'webp',
        contentType: 'image/webp'
    };
}

async function salvarArquivo(file, pasta = 'geral') {
    const { buffer, extensao, contentType } = await processarArquivo(file);
    const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;
    const caminhoRelativo = `${pasta}/${nomeArquivo}`;

    // Se tiver chaves da Cloudflare R2 no .env, sobe para a nuvem
    if (process.env.R2_ENDPOINT && process.env.R2_BUCKET) {
        const s3 = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
            }
        });

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET,
                Key: caminhoRelativo,
                Body: buffer,
                ContentType: contentType
            })
        );

        return `${process.env.R2_PUBLIC_URL}/${caminhoRelativo}`;
    }

    // Sem R2 no .env? Salva na pasta local uploads/ do seu PC!
    const dirDestino = path.join(__dirname, '..', 'uploads', pasta);
    fs.mkdirSync(dirDestino, { recursive: true });
    fs.writeFileSync(path.join(dirDestino, nomeArquivo), buffer);

    return `/uploads/${caminhoRelativo}`;
}

module.exports = { upload, salvarArquivo };
