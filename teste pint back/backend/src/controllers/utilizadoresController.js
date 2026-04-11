const Utilizador = require('../models/Utilizador');

const atualizarFoto = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum ficheiro enviado.' });
  }

  try {
    const baseUrl = 'http://localhost:3000';
    const fotourl = `${baseUrl}/uploads/${req.file.filename}`;

    await Utilizador.update(
      { fotourl },
      { where: { idutilizador: id } }
    );

    return res.json({ fotourl });
  } catch (error) {
    console.error('Erro ao atualizar foto:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = { atualizarFoto };
