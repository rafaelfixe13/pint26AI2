const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const {
  criarCandidatura,
  listarMinhasCandidaturas,
  listarCandidaturasTM,
  validarTM,
  listarCandidaturasSL,
  validarSL,
  detalhesCandidatura,
  estadoCandidatura,
} = require('../controllers/candidaturaController');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'evidencias_candidaturas',
    resource_type: 'auto',
    public_id: `evidencia_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    format: file.originalname.split('.').pop(),
  }),
});

const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

// Rotas sem parâmetro — devem vir ANTES de /:id
router.get('/minhas',      listarMinhasCandidaturas);
router.get('/badge-estado', estadoCandidatura);
router.get('/tm/lista',    listarCandidaturasTM);
router.get('/sl/lista',    listarCandidaturasSL);

// Consultor submete
router.post('/', upload.array('evidencias', 10), criarCandidatura);

// Acções por id — DEPOIS das rotas estáticas
router.get('/:id',    detalhesCandidatura);
router.put('/:id/tm', validarTM);
router.put('/:id/sl', validarSL);

module.exports = router;
