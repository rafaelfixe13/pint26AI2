const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { atualizarFoto, atualizarPerfil } = require('../controllers/utilizadoresController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ✅ aponta para backend/src/uploads (igual ao express.static do app.js)
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `foto_${req.params.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.put('/:id/foto', upload.single('foto'), atualizarFoto);
router.put('/:id/perfil', atualizarPerfil);

module.exports = router;