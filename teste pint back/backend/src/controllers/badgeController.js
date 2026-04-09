const Badge = require('../models/Badge');
const { sequelize } = require('../config/database');

const getAllBadges = async (_req, res) => {
  try {
    const badges = await sequelize.query(`
      SELECT b.*, n.nome AS nomenivel, n.codigo AS codigonivel
      FROM badges b
      LEFT JOIN niveis n ON b.idnivel = n.idnivel
      ORDER BY b.idbadge
    `, { type: sequelize.QueryTypes.SELECT });
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createBadge = async (req, res) => {
  const { idnivel, nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase, ispublico } = req.body;
  if (!idnivel || !nome || pontos === undefined) {
    return res.status(400).json({ error: 'idnivel, nome e pontos são obrigatórios.' });
  }
  try {
    const existente = await Badge.findOne({ where: { idnivel } });
    if (existente) return res.status(409).json({ error: 'Já existe um badge para este nível.' });
    const badge = await Badge.create({
      idnivel, nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase,
      ispublico: ispublico !== undefined ? ispublico : true,
    });
    res.status(201).json(badge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBadge = async (req, res) => {
  try {
    const [updated] = await Badge.update(req.body, { where: { idbadge: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Badge não encontrado.' });
    res.json(await Badge.findByPk(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const toggleBadge = async (req, res) => {
  try {
    const badge = await Badge.findByPk(req.params.id);
    if (!badge) return res.status(404).json({ error: 'Badge não encontrado.' });
    await badge.update({ ativo: !badge.ativo });
    res.json({ ativo: badge.ativo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listarNiveis = async (_req, res) => {
  try {
    const niveis = await sequelize.query(`
      SELECT n.idnivel, n.codigo, n.nome, n.descricao, n.idarea, n.idlearningpath, n.ativo,
             lp.nome AS lp_nome
      FROM niveis n
      LEFT JOIN learningpaths lp ON lp.idlearningpath = n.idlearningpath
      ORDER BY n.idnivel
    `, { type: sequelize.QueryTypes.SELECT });
    res.json(niveis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listarHierarquia = async (_req, res) => {
  try {
    const rows = await sequelize.query(`
      SELECT
        sl.idserviceline, sl.nome AS sl_nome, sl.ativo AS sl_ativo,
        a.idarea, a.nome AS area_nome, a.ativo AS area_ativo,
        n.idnivel, n.codigo AS nivel_codigo, n.nome AS nivel_nome, n.ativo AS nivel_ativo,
        n.idlearningpath, lp.nome AS lp_nome,
        b.idbadge, b.nome AS badge_nome, b.descricao AS badge_descricao,
        b.pontos, b.imagemurl AS badge_imagem, b.ispublico, b.expiremeses, b.linkpublicobase, b.ativo AS badge_ativo,
        r.idrequisito, r.codigo AS req_codigo, r.titulo AS req_titulo,
        r.descricao AS req_descricao, r.imagemurl AS req_imagemurl, r.ativo AS req_ativo
      FROM servicelines sl
      LEFT JOIN areas a ON a.idserviceline = sl.idserviceline
      LEFT JOIN niveis n ON n.idarea = a.idarea
      LEFT JOIN learningpaths lp ON lp.idlearningpath = n.idlearningpath
      LEFT JOIN badges b ON b.idnivel = n.idnivel
      LEFT JOIN requisitos r ON r.idnivel = n.idnivel
      ORDER BY sl.idserviceline, a.idarea, n.idnivel, r.codigo
    `, { type: sequelize.QueryTypes.SELECT });

    const slMap = {};
    for (const row of rows) {
      if (!slMap[row.idserviceline]) {
        slMap[row.idserviceline] = {
          idserviceline: row.idserviceline, nome: row.sl_nome, ativo: row.sl_ativo, areas: {}
        };
      }
      const sl = slMap[row.idserviceline];
      if (!row.idarea) continue;

      if (!sl.areas[row.idarea]) {
        sl.areas[row.idarea] = {
          idarea: row.idarea, nome: row.area_nome, ativo: row.area_ativo, niveis: {}
        };
      }
      const area = sl.areas[row.idarea];
      if (!row.idnivel) continue;

      if (!area.niveis[row.idnivel]) {
        area.niveis[row.idnivel] = {
          idnivel: row.idnivel,
          codigo: row.nivel_codigo,
          nome: row.nivel_nome,
          ativo: row.nivel_ativo,
          idlearningpath: row.idlearningpath,
          lp_nome: row.lp_nome,
          badge: row.idbadge ? {
            idbadge: row.idbadge,
            nome: row.badge_nome,
            descricao: row.badge_descricao,
            pontos: row.pontos,
            imagemurl: row.badge_imagem,
            ispublico: row.ispublico,
            expiremeses: row.expiremeses,
            linkpublicobase: row.linkpublicobase,
            ativo: row.badge_ativo,
          } : null,
          requisitos: [],
        };
      }

      if (row.idrequisito) {
        const nivel = area.niveis[row.idnivel];
        const jaExiste = nivel.requisitos.some((r) => r.idrequisito === row.idrequisito);
        if (!jaExiste) {
          nivel.requisitos.push({
            idrequisito: row.idrequisito,
            codigo: row.req_codigo,
            titulo: row.req_titulo,
            descricao: row.req_descricao,
            imagemurl: row.req_imagemurl,
            ativo: row.req_ativo,
          });
        }
      }
    }

    const resultado = Object.values(slMap).map((sl) => ({
      ...sl,
      areas: Object.values(sl.areas).map((area) => ({
        ...area,
        niveis: Object.values(area.niveis),
      })),
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllBadges, createBadge, updateBadge, toggleBadge, listarNiveis, listarHierarquia,
};
