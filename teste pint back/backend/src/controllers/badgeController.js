const Badge = require('../models/Badge');
const { sequelize } = require('../config/database');

const getAllBadges = async (_req, res) => {
  try {
    const badges = await sequelize.query(`
      SELECT b.*,
             nv.nome AS nivel,
             a.nome  AS area,
             sl.nome AS serviceline,
             esp.nome AS especial_nome
      FROM badges b
      LEFT JOIN nivel       nv  ON nv.idnivel       = b.idnivel
      LEFT JOIN areas       a   ON a.idarea          = b.idarea
      LEFT JOIN serviceline sl  ON sl.idserviceline  = a.idserviceline
      LEFT JOIN especial    esp ON esp.idespecial    = b.idespecial
      WHERE b.ativo = true
      ORDER BY b.idbadge
    `, { type: sequelize.QueryTypes.SELECT });
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBadgeById = async (req, res) => {
  try {
    const rows = await sequelize.query(`
      SELECT
        b.*,
        nv.nome           AS nivel,
        a.idarea,         a.nome  AS area,
        sl.idserviceline, sl.nome AS serviceline,
        esp.nome AS especial_nome,
        r.idrequisito, r.codigo AS req_codigo, r.titulo AS req_titulo,
        r.descricao AS req_descricao, r.imagemurl AS req_imagemurl, r.ordem AS req_ordem
      FROM badges b
      LEFT JOIN nivel        nv  ON nv.idnivel       = b.idnivel
      LEFT JOIN areas        a   ON a.idarea          = b.idarea
      LEFT JOIN serviceline  sl  ON sl.idserviceline  = a.idserviceline
      LEFT JOIN especial     esp ON esp.idespecial    = b.idespecial
      LEFT JOIN requisitos   r   ON r.idbadge = b.idbadge AND r.ativo = true
      WHERE b.idbadge = :id
      ORDER BY r.ordem, r.idrequisito
    `, { replacements: { id: req.params.id }, type: sequelize.QueryTypes.SELECT });

    if (!rows.length) return res.status(404).json({ error: 'Badge não encontrado.' });

    const f = rows[0];
    const badge = {
      idbadge: f.idbadge, nome: f.nome, descricao: f.descricao,
      imagemurl: f.imagemurl, pontos: f.pontos, expiremeses: f.expiremeses,
      linkpublicobase: f.linkpublicobase, ispublico: f.ispublico,
      competencias: f.competencias, idnivel: f.idnivel, ativo: f.ativo,
      nivel: f.nivel,
      area: f.area, idarea: f.idarea,
      serviceline: f.serviceline, idserviceline: f.idserviceline,
      idespecial: f.idespecial, especial_nome: f.especial_nome,
      requisitos: rows
        .filter((r) => r.idrequisito)
        .map((r) => ({
          idrequisito: r.idrequisito, codigo: r.req_codigo, titulo: r.req_titulo,
          descricao: r.req_descricao, imagemurl: r.req_imagemurl, ordem: r.req_ordem,
        })),
    };
    res.json(badge);
  } catch (error) {
    console.error('Erro getBadgeById:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const createBadge = async (req, res) => {
  const { nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase, ispublico, competencias, idnivel, idarea, certificado, idespecial } = req.body;
  if (!nome || pontos === undefined) {
    return res.status(400).json({ error: 'nome e pontos são obrigatórios.' });
  }
  try {
    const badge = await Badge.create({
      nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase, competencias,
      idnivel: idnivel || null,
      idarea: idarea || null,
      certificado: certificado || null,
      idespecial: idespecial || null,
      ispublico: ispublico !== undefined ? ispublico : true,
    });
    res.status(201).json(badge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBadge = async (req, res) => {
  try {
    const { nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase, ispublico, competencias, idnivel, idarea, certificado, idespecial } = req.body;
    const updates = {
      nome, descricao, imagemurl, pontos, expiremeses, linkpublicobase, ispublico, competencias,
      idnivel: idnivel || null,
      idarea: idarea || null,
      certificado: certificado || null,
      idespecial: idespecial || null,
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
    const deleted = await Badge.destroy({ where: { idbadge: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Badge não encontrado.' });
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
      SELECT n.idnivel, n.nome, n.descricao
      FROM nivel n
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
        b.idbadge, b.idnivel,
        n.nome AS nivel_nome
      FROM serviceline sl
      LEFT JOIN areas   a  ON a.idserviceline = sl.idserviceline
      LEFT JOIN badges  b  ON b.idarea = a.idarea AND b.ativo = true
      LEFT JOIN nivel   n  ON n.idnivel = b.idnivel
      ORDER BY sl.idserviceline, a.idarea, n.nome
    `, { type: sequelize.QueryTypes.SELECT });

    const slMap = {};
    for (const row of rows) {
      if (!slMap[row.idserviceline]) {
        slMap[row.idserviceline] = {
          idserviceline: row.idserviceline,
          nome: row.sl_nome,
          ativo: row.sl_ativo,
          areas: {},
        };
      }
      const sl = slMap[row.idserviceline];
      if (!row.idarea) continue;

      if (!sl.areas[row.idarea]) {
        sl.areas[row.idarea] = {
          idarea: row.idarea,
          nome: row.area_nome,
          ativo: row.area_ativo,
          niveis: [],
        };
      }

      // Recolhe níveis únicos usados pelos badges desta área
      if (row.idnivel) {
        const area = sl.areas[row.idarea];
        const jaExiste = area.niveis.some((n) => n.idnivel === row.idnivel);
        if (!jaExiste) {
          area.niveis.push({
            idnivel: row.idnivel,
            nome: row.nivel_nome,
          });
        }
      }
    }

    const resultado = Object.values(slMap).map((sl) => ({
      ...sl,
      areas: Object.values(sl.areas),
    }));

    res.json(resultado);
  } catch (error) {
    console.error('Erro listarHierarquia:', error.message);
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
        b.idbadge, b.nome AS badge_nome, b.descricao AS badge_descricao,
        b.pontos, b.imagemurl AS badge_imagem, b.ispublico, b.expiremeses, b.ativo AS badge_ativo,
        nv.nome AS nivel_nome,
        r.idrequisito, r.codigo AS req_codigo, r.titulo AS req_titulo,
        r.descricao AS req_descricao, r.ativo AS req_ativo,
        CASE WHEN cr.cumprido = true THEN true ELSE false END AS req_concluido,
        cr.dataverificacao AS req_dataconclusao,
        CASE WHEN cb.estado = 'APPROVED' THEN true ELSE false END AS badge_conquistado,
        cb.dataaprovacao AS badge_dataconquista
      FROM serviceline sl
      LEFT JOIN areas a               ON a.idserviceline = sl.idserviceline
      LEFT JOIN badges b              ON b.idarea = a.idarea
      LEFT JOIN nivel nv              ON nv.idnivel = b.idnivel
      LEFT JOIN requisitos r          ON r.idbadge = b.idbadge
      LEFT JOIN candidaturasbadge cb  ON cb.badge_id = b.idbadge AND cb.user_id = :idutilizador
      LEFT JOIN candidaturasrequisitos cr ON cr.idrequisito = r.idrequisito AND cr.idcandidatura = cb.idcandidatura
      ORDER BY sl.idserviceline, a.idarea, b.idbadge, r.codigo
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
          idarea: row.idarea, nome: row.area_nome, ativo: row.area_ativo, badges: {},
        };
      }
      const area = sl.areas[row.idarea];
      if (!row.idbadge) continue;

      if (!area.badges[row.idbadge]) {
        area.badges[row.idbadge] = {
          idbadge: row.idbadge, nome: row.badge_nome, descricao: row.badge_descricao,
          pontos: row.pontos, imagemurl: row.badge_imagem, ispublico: row.ispublico,
          conquistado: row.badge_conquistado, dataconquista: row.badge_dataconquista,
          ativo: row.badge_ativo, nivel: row.nivel_nome, requisitos: [],
        };
      }

      if (row.idrequisito) {
        const badge = area.badges[row.idbadge];
        const jaExiste = badge.requisitos.some((r) => r.idrequisito === row.idrequisito);
        if (!jaExiste) {
          badge.requisitos.push({
            idrequisito: row.idrequisito, codigo: row.req_codigo, titulo: row.req_titulo,
            descricao: row.req_descricao, ativo: row.req_ativo,
            concluido: row.req_concluido, dataconclusao: row.req_dataconclusao,
          });
        }
      }
    }

    const resultado = Object.values(slMap).map((sl) => ({
      ...sl,
      areas: Object.values(sl.areas).map((area) => ({
        ...area,
        badges: Object.values(area.badges),
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
        b.idnivel, b.idarea,
        nv.nome AS nivel_nome,
        a.nome AS area_nome,
        sl.idserviceline, sl.nome AS sl_nome,
        r.idrequisito, r.codigo AS req_codigo, r.titulo AS req_titulo,
        r.descricao AS req_descricao, r.imagemurl AS req_imagemurl, r.ordem, r.ativo AS req_ativo
      FROM badges b
      LEFT JOIN nivel       nv ON nv.idnivel      = b.idnivel
      LEFT JOIN areas       a  ON a.idarea         = b.idarea
      LEFT JOIN serviceline sl ON sl.idserviceline = a.idserviceline
      LEFT JOIN requisitos  r  ON r.idbadge = b.idbadge
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
          idnivel: row.idnivel, nivel_nome: row.nivel_nome,
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

const listarEspeciais = async (_req, res) => {
  try {
    const especiais = await sequelize.query(`
      SELECT idespecial, nome, descricao, ativo
      FROM especial
      WHERE ativo = true
      ORDER BY idespecial
    `, { type: sequelize.QueryTypes.SELECT });
    res.json(especiais);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllBadges, getBadgeById, createBadge, updateBadge, deleteBadge,
  toggleBadge, listarNiveis, listarHierarquia, getBadgesUtilizador, listarBadgesComRequisitos,
  listarEspeciais,
};