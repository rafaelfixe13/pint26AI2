const Badge = require('../models/Badge');
const { sequelize } = require('../config/database');


const getAllBadges = async (_req, res) => {
  try {
    const badges = await sequelize.query(
      'SELECT * FROM badges ORDER BY idbadge',
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getBadgeById = async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT
        b.*,
        n.codigo   AS nivel_codigo, n.nome AS nivel,
        a.idarea,  a.nome AS area,
        sl.idserviceline, sl.nome AS serviceline,
        lp.nome    AS learningpath,
        r.idrequisito, r.codigo AS req_codigo, r.titulo AS req_titulo,
        r.descricao AS req_descricao, r.imagemurl AS req_imagemurl, r.ordem AS req_ordem
      FROM badges b
      LEFT JOIN niveis       n  ON n.idnivel         = b.idnivel
      LEFT JOIN areas        a  ON a.idarea           = n.idarea
      LEFT JOIN servicelines sl ON sl.idserviceline   = a.idserviceline
      LEFT JOIN learningpaths lp ON lp.idlearningpath = n.idlearningpath
      LEFT JOIN requisitos   r  ON r.idbadge = b.idbadge AND r.ativo = true
      WHERE b.idbadge = :id
      ORDER BY r.ordem, r.idrequisito
    `, { replacements: { id: req.params.id } });

    if (!rows.length) return res.status(404).json({ error: 'Badge não encontrado.' });

    const f = rows[0];
    const badge = {
      idbadge: f.idbadge, nome: f.nome, descricao: f.descricao,
      imagemurl: f.imagemurl, pontos: f.pontos, expiremeses: f.expiremeses,
      linkpublicobase: f.linkpublicobase, ispublico: f.ispublico,
      competencias: f.competencias, idnivel: f.idnivel, ativo: f.ativo,
      nivel: f.nivel, nivel_codigo: f.nivel_codigo,
      area: f.area, idarea: f.idarea,
      serviceline: f.serviceline, idserviceline: f.idserviceline,
      learningpath: f.learningpath,
      requisitos: rows
        .filter((r) => r.idrequisito)
        .map((r) => ({
          idrequisito: r.idrequisito, codigo: r.req_codigo, titulo: r.req_titulo,
          descricao: r.req_descricao, imagemurl: r.req_imagemurl, ordem: r.req_ordem,
        })),
    };

    res.json(badge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const createBadge = async (req, res) => {
  const { nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase, ispublico, competencias, idnivel } = req.body;
  if (!nome || pontos === undefined) {
    return res.status(400).json({ error: 'nome e pontos são obrigatórios.' });
  }
  try {
    const badge = await Badge.create({
      nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase, competencias,
      idnivel: idnivel || null,
      ispublico: ispublico !== undefined ? ispublico : true,
    });
    res.status(201).json(badge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const updateBadge = async (req, res) => {
  try {
    const { nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase, ispublico, competencias, idnivel } = req.body;
    const updates = {
      nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase, ispublico, competencias,
      idnivel: idnivel || null,
    };
    const [updated] = await Badge.update(updates, { where: { idbadge: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Badge não encontrado.' });
    res.json(await Badge.findByPk(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const deleteBadge = async (req, res) => {
  try {
    const deleted = await Badge.destroy({
      where: { idbadge: req.params.id }
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Badge não encontrado.' });
    }
    res.json({ message: 'Badge eliminado.' });
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
        n.idlearningpath, lp.nome AS lp_nome
      FROM servicelines sl
      LEFT JOIN areas a ON a.idserviceline = sl.idserviceline
      LEFT JOIN niveis n ON n.idarea = a.idarea
      LEFT JOIN learningpaths lp ON lp.idlearningpath = n.idlearningpath
      ORDER BY sl.idserviceline, a.idarea, n.idnivel
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
        };
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


const getBadgesUtilizador = async (req, res) => {
  const { idutilizador } = req.params;
  try {
    const rows = await sequelize.query(`
      SELECT
        sl.idserviceline, sl.nome AS sl_nome, sl.ativo AS sl_ativo,
        a.idarea, a.nome AS area_nome, a.ativo AS area_ativo,
        n.idnivel, n.codigo AS nivel_codigo, n.nome AS nivel_nome, n.ativo AS nivel_ativo,
        n.idlearningpath, lp.nome AS lp_nome,
        b.idbadge, b.nome AS badge_nome, b.descricao AS badge_descricao,
        b.pontos, b.imagemurl AS badge_imagem, b.ispublico, b.expiremeses, b.ativo AS badge_ativo,
        r.idrequisito, r.codigo AS req_codigo, r.titulo AS req_titulo,
        r.descricao AS req_descricao, r.ativo AS req_ativo,
        CASE WHEN ur.idrequisito IS NOT NULL THEN true ELSE false END AS req_concluido,
        ur.dataconclusao AS req_dataconclusao,
        CASE WHEN ub.idbadge IS NOT NULL THEN true ELSE false END AS badge_conquistado,
        ub.dataconquista AS badge_dataconquista
      FROM servicelines sl
      LEFT JOIN areas a ON a.idserviceline = sl.idserviceline
      LEFT JOIN niveis n ON n.idarea = a.idarea
      LEFT JOIN learningpaths lp ON lp.idlearningpath = n.idlearningpath
      LEFT JOIN badges b ON b.idnivel = n.idnivel
      LEFT JOIN requisitos r ON r.idbadge = b.idbadge
      LEFT JOIN utilizador_requisitos ur ON ur.idrequisito = r.idrequisito AND ur.idutilizador = :idutilizador
      LEFT JOIN utilizador_badges ub ON ub.idbadge = b.idbadge AND ub.idutilizador = :idutilizador
      ORDER BY sl.idserviceline, a.idarea, n.idnivel, r.codigo
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { idutilizador },
    });

    const slMap = {};
    for (const row of rows) {
      if (!slMap[row.idserviceline]) {
        slMap[row.idserviceline] = {
          idserviceline: row.idserviceline, nome: row.sl_nome, ativo: row.sl_ativo, areas: {},
        };
      }
      const sl = slMap[row.idserviceline];
      if (!row.idarea) continue;

      if (!sl.areas[row.idarea]) {
        sl.areas[row.idarea] = {
          idarea: row.idarea, nome: row.area_nome, ativo: row.area_ativo, niveis: {},
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
            conquistado: row.badge_conquistado,
            dataconquista: row.badge_dataconquista,
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
            ativo: row.req_ativo,
            concluido: row.req_concluido,
            dataconclusao: row.req_dataconclusao,
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


const listarBadgesComRequisitos = async (_req, res) => {
  try {
    const rows = await sequelize.query(`
      SELECT
        b.idbadge, b.nome, b.descricao, b.imagemurl, b.pontos,
        b.expiremeses, b.linkpublicobase, b.ispublico, b.competencias, b.ativo,
        b.idnivel,
        n.codigo AS nivel_codigo, n.nome AS nivel_nome,
        a.idarea, a.nome AS area_nome,
        sl.idserviceline, sl.nome AS sl_nome,
        r.idrequisito, r.codigo AS req_codigo, r.titulo AS req_titulo,
        r.descricao AS req_descricao, r.imagemurl AS req_imagemurl, r.ordem, r.ativo AS req_ativo
      FROM badges b
      LEFT JOIN niveis n ON n.idnivel = b.idnivel
      LEFT JOIN areas a ON a.idarea = n.idarea
      LEFT JOIN servicelines sl ON sl.idserviceline = a.idserviceline
      LEFT JOIN requisitos r ON r.idbadge = b.idbadge
      ORDER BY sl.nome NULLS LAST, a.nome NULLS LAST, b.idbadge, r.ordem NULLS LAST
    `, { type: sequelize.QueryTypes.SELECT });

    const badgeMap = {};
    for (const row of rows) {
      if (!badgeMap[row.idbadge]) {
        badgeMap[row.idbadge] = {
          idbadge: row.idbadge, nome: row.nome, descricao: row.descricao,
          imagemurl: row.imagemurl, pontos: row.pontos, expiremeses: row.expiremeses,
          linkpublicobase: row.linkpublicobase, ispublico: row.ispublico,
          competencias: row.competencias, ativo: row.ativo,
          idnivel: row.idnivel,
          nivel_codigo: row.nivel_codigo, nivel_nome: row.nivel_nome,
          idarea: row.idarea, area_nome: row.area_nome,
          idserviceline: row.idserviceline, sl_nome: row.sl_nome,
          requisitos: [],
        };
      }
      if (row.idrequisito) {
        badgeMap[row.idbadge].requisitos.push({
          idrequisito: row.idrequisito, codigo: row.req_codigo, titulo: row.req_titulo,
          descricao: row.req_descricao, imagemurl: row.req_imagemurl,
          ordem: row.ordem, ativo: row.req_ativo,
        });
      }
    }

    res.json(Object.values(badgeMap));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllBadges, getBadgeById, createBadge, updateBadge, deleteBadge,
  toggleBadge, listarNiveis, listarHierarquia, getBadgesUtilizador, listarBadgesComRequisitos,
};
