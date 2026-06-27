const express = require('express');
const router = express.Router();

const {
  listarUtilizadores, listarTodasRoles, adicionarRole, removerRole, atualizarEstadoConta, criarUtilizador,
} = require('../controllers/adminController');

const { getEstatisticas } = require('../controllers/estatisticasController');

const {
  getAllBadges, createBadge, updateBadge, toggleBadge, listarNiveis, listarHierarquia, getBadgesUtilizador, listarBadgesComRequisitos, listarEspeciais,
} = require('../controllers/badgeController');

const {
  listarLearningPaths, criarLearningPath, editarLearningPath, toggleLearningPath,
  listarServiceLines, criarServiceLine, editarServiceLine, toggleServiceLine,
  criarArea, editarArea, toggleArea,
  criarNivel, editarNivel, toggleNivel, apagarNivel,
  criarRequisito, editarRequisito, toggleRequisito,
} = require('../controllers/estruturaController');

// Utilizadores
router.post('/utilizadores', criarUtilizador);
router.get('/utilizadores', listarUtilizadores);
router.get('/utilizadores/:idutilizador/badges', getBadgesUtilizador);
router.get('/roles', listarTodasRoles);
router.post('/utilizadores/roles/adicionar', adicionarRole);
router.post('/utilizadores/roles/remover', removerRole);
router.put('/utilizadores/estado', atualizarEstadoConta);

// Estatísticas agregadas (dashboard + relatórios)
router.get('/estatisticas', getEstatisticas);

// Badges
router.get('/badges', getAllBadges);
router.post('/badges', createBadge);
router.put('/badges/:id', updateBadge);
router.patch('/badges/:id/ativo', toggleBadge);
router.get('/niveis', listarNiveis);
router.get('/hierarquia', listarHierarquia);
router.get('/badges-com-requisitos', listarBadgesComRequisitos);
router.get('/especiais', listarEspeciais);

// Learning Paths
router.get('/learningpaths', listarLearningPaths);
router.post('/learningpaths', criarLearningPath);
router.put('/learningpaths/:id', editarLearningPath);
router.patch('/learningpaths/:id/ativo', toggleLearningPath);

// Service Lines
router.get('/servicelines', listarServiceLines);
router.post('/servicelines', criarServiceLine);
router.put('/servicelines/:id', editarServiceLine);
router.patch('/servicelines/:id/ativo', toggleServiceLine);

// Áreas
router.post('/areas', criarArea);
router.put('/areas/:id', editarArea);
router.patch('/areas/:id/ativo', toggleArea);

// Níveis
router.post('/niveis', criarNivel);
router.put('/niveis/:id', editarNivel);
router.patch('/niveis/:id/ativo', toggleNivel);
router.delete('/niveis/:id', apagarNivel);

// Requisitos
router.post('/requisitos', criarRequisito);
router.put('/requisitos/:id', editarRequisito);
router.patch('/requisitos/:id/ativo', toggleRequisito);

module.exports = router;
