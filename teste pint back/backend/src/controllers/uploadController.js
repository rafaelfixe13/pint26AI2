const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'badges',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 400, height: 400, crop: 'limit' }],
  },
});

const upload = multer({ storage });

const uploadImagem = [
  upload.single('imagem'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
    res.json({ url: req.file.path });
  },
];

module.exports = { uploadImagem };
