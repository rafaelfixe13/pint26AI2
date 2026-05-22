const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { atualizarFoto, atualizarPerfil, getRanking } = require('../controllers/utilizadoresController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `foto${req.params.id}${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

router.get('/ranking',        getRanking);         // ← novo
router.put('/:id/foto',  upload.single('foto'), atualizarFoto);
router.put('/:id/perfil', atualizarPerfil);

module.exports = router;