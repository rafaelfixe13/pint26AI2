import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/ConsultorDashboard.css";

import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { MdOutlineAssignment, MdLeaderboard } from "react-icons/md";
import { BsAward, BsAwardFill, BsStarFill, BsClockHistory, BsTrophy, BsCheckLg, BsGraphUpArrow, BsClipboard, BsExclamationTriangleFill } from "react-icons/bs";
import { FaMedal, FaRegSmile } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { API_BASE } from "../../api";
import { verificarMarcos } from "../../utils/marcos";
import { calcularExpiracoes } from "../../utils/expiracaoConsultor";
import CelebracaoModal from "../../components/CelebracaoModal";

import { NAV_CONSULTOR } from "../../utils/navConfig";

const ESTADOS_ATIVOS = ["OPEN", "SUBMITTED", "UNDER_REVIEW", "EM_VALIDACAO"];

function estadoInfo(estado) {
  const e = estado?.toUpperCase();
  if (e === "OPEN")         return { texto: "Por corrigir",    cls: "estado-open" };
  if (e === "SUBMITTED")    return { texto: "Em validação TM",  cls: "estado-submitted" };
  if (e === "UNDER_REVIEW" || e === "EM_VALIDACAO")
                            return { texto: "Em validação SL",  cls: "estado-validacao" };
  if (e === "APPROVED")     return { texto: "Aprovado",         cls: "estado-aprovado" };
  if (e === "REJECTED")     return { texto: "Rejeitado",        cls: "estado-rejeitado" };
  return { texto: estado, cls: "" };
}

// ── Níveis
const NOMES_NIVEL = { A: "Júnior", B: "Interm.", C: "Sénior", D: "Expert", E: "Líder" };

// Letra do nível (A-E)
function letraNivel(badge) {
  const m = (badge?.nivel || "").trim().match(/^([A-E])/i);
  return m ? m[1].toUpperCase() : "?";
}

function nivelOrder(badge) {
  if (badge?.idnivel != null) return Number(badge.idnivel);
  const l = letraNivel(badge);
  return l === "?" ? 99 : l.charCodeAt(0) - 64;
}

function nomeGrupo(letra) {
  return NOMES_NIVEL[(letra || "").toUpperCase()] ?? letra;
}

// Estado de um nível: badge conquistado tem prioridade, senão usa a candidatura em curso
function estadoNivel(badge, estadoPorBadge) {
  if (badge?.conquistado) return "APPROVED";
  const e = estadoPorBadge[badge?.idbadge];
  if (e === "EM_VALIDACAO") return "UNDER_REVIEW";
  return e || "NAO_INICIADO";
}

// Estado agregado de um nível de dificuldade (pode ter mais de um badge):
// aprovado tem prioridade, depois em validação, depois aberto.
function estadoNivelAgrupado(badges, estadoPorBadge) {
  const estados = badges.map((b) => estadoNivel(b, estadoPorBadge));
  if (estados.includes("APPROVED")) return "APPROVED";
  if (estados.some((e) => e === "SUBMITTED" || e === "UNDER_REVIEW")) return "SUBMITTED";
  if (estados.includes("OPEN")) return "OPEN";
  return "NAO_INICIADO";
}

function classeEstado(estado) {
  if (estado === "APPROVED") return "aprovado";
  if (estado === "SUBMITTED" || estado === "UNDER_REVIEW") return "validacao";
  if (estado === "OPEN") return "aberto";
  return "nao-iniciado";
}

// Bola de um nível (A-E)
function NivelDot({ letra, estado }) {
  const cls = classeEstado(estado);
  return (
    <div className="cons-nivel">
      <div className={`cons-nivel-dot ${cls}`}>
        {estado === "APPROVED" ? <BsCheckLg size={18} /> : letra}
      </div>
      <span className={`cons-nivel-label ${cls}`}>{nomeGrupo(letra)}</span>
    </div>
  );
}

// Chip de estado da área (Completo / aprovados-total / 0-total)
function AreaStatusChip({ niveis }) {
  const total = niveis.length;
  const aprovados = niveis.filter((n) => n.estado === "APPROVED").length;
  const emProgresso = niveis.filter((n) =>
    ["SUBMITTED", "UNDER_REVIEW", "OPEN"].includes(n.estado)
  ).length;

  if (total > 0 && aprovados === total) {
    return <span className="cons-area-chip completo">Completo</span>;
  }
  if (aprovados > 0 || emProgresso > 0) {
    return <span className="cons-area-chip ativo">{aprovados}/{total}</span>;
  }
  return <span className="cons-area-chip vazio">0/{total}</span>;
}

// Card de uma área com a trilha de níveis A-E (ligados por conectores)
function AreaProgressCard({ area }) {
  const niveis = area.niveis;
  return (
    <div className="cons-area-card">
      <div className="cons-area-head">
        <div className="cons-area-titles">
          {area.serviceline && <span className="cons-area-sl">{area.serviceline}</span>}
          <span className="cons-area-title">{area.nome}</span>
        </div>
        <AreaStatusChip niveis={niveis} />
      </div>
      <div className="cons-niveis-row">
        {niveis.map((n, i) => {
          const prevAprovado = i > 0 && niveis[i - 1].estado === "APPROVED";
          return (
            <div className="cons-nivel-item" key={n.idbadge ?? i}>
              {i > 0 && <span className={`cons-conn ${prevAprovado ? "ok" : ""}`} />}
              <NivelDot letra={n.letra} estado={n.estado} />
              {i < niveis.length - 1 && (
                <span className={`cons-conn ${n.estado === "APPROVED" ? "ok" : ""}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashBoard() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [candidaturas, setCandidaturas] = useState([]);
  const [recomendados, setRecomendados] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marcos, setMarcos] = useState([]);
  const [badgesExpiracao, setBadgesExpiracao] = useState([]);

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }

    const fetchCandidaturas = fetch(
      `${API_BASE}/candidaturas/minhas?idutilizador=${utilizador.idutilizador}`
    ).then((r) => r.json()).catch(() => []);

    const fetchBadges = fetch(`${API_BASE}/badges`)
      .then((r) => r.json()).catch(() => []);

    const fetchHierarquia = fetch(
      `${API_BASE}/admin/utilizadores/${utilizador.idutilizador}/badges`
    ).then((r) => r.json()).catch(() => []);

    Promise.all([fetchCandidaturas, fetchBadges, fetchHierarquia])
      .then(([cands, badges, hierarquia]) => {
        const listaCands = Array.isArray(cands) ? cands : [];
        const listaBadges = Array.isArray(badges) ? badges : [];
        setCandidaturas(listaCands);
        setLearningPaths(Array.isArray(hierarquia) ? hierarquia : []);

        const meta = {};
        listaBadges.forEach((b) => { meta[b.idbadge] = b; });

        // Badges conquistados a expirar (notificação só no app)
        setBadgesExpiracao(
          calcularExpiracoes(
            listaCands.map((c) => ({ ...c, expiremeses: meta[c.idbadge]?.expiremeses }))
          )
        );

        const indispo = new Set(
          listaCands
            .filter((c) => ["APPROVED", ...ESTADOS_ATIVOS].includes(c.estado?.toUpperCase()))
            .map((c) => c.idbadge)
        );

        // Recomendar o PRÓXIMO NÍVEL de cada área: o badge de nível mais baixo
        // ainda não conquistado nem em processo dessa área.
        const listaHier = Array.isArray(hierarquia) ? hierarquia : [];
        const candidatos = [];
        listaHier.forEach((sl) =>
          (sl.areas || []).forEach((area) => {
            const badgesArea = (area.badges || [])
              .map((b) => ({ ...meta[b.idbadge], ...b }))
              .sort((a, b) => nivelOrder(a) - nivelOrder(b));
            const conquered = badgesArea.filter((b) => b.conquistado).length;
            const next = badgesArea.find((b) => !b.conquistado && !indispo.has(b.idbadge));
            if (next) {
              candidatos.push({
                ...next,
                pontos: next.pontos ?? 0,
                _conquered: conquered,
                _own: utilizador.idarea != null && String(area.idarea) === String(utilizador.idarea),
              });
            }
          })
        );

        // Prioridade: áreas já iniciadas → área do consultor → mais progresso → nível mais baixo
        candidatos.sort((a, b) => {
          const aStarted = a._conquered > 0 ? 1 : 0;
          const bStarted = b._conquered > 0 ? 1 : 0;
          if (bStarted !== aStarted) return bStarted - aStarted;
          if (b._own !== a._own) return (b._own ? 1 : 0) - (a._own ? 1 : 0);
          if (b._conquered !== a._conquered) return b._conquered - a._conquered;
          return nivelOrder(a) - nivelOrder(b);
        });

        let reco = candidatos.slice(0, 6);

        // Fallback: se a hierarquia não devolver nada, usar a lógica por área/pontos
        if (reco.length === 0) {
          reco = listaBadges.filter((b) => !indispo.has(b.idbadge));
          if (utilizador.idarea != null) {
            const daArea = reco.filter((b) => String(b.idarea) === String(utilizador.idarea));
            reco = daArea.length > 0 ? daArea : reco;
          }
          reco = reco.sort((a, b) => (a.pontos ?? 0) - (b.pontos ?? 0)).slice(0, 6);
        }

        setRecomendados(reco);

        // Celebração de marcos
        const novosMarcos = verificarMarcos(utilizador.idutilizador, listaCands);
        if (novosMarcos.length > 0) setMarcos(novosMarcos);

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  //Estatísticas
  const obtidos = candidaturas.filter((c) => c.estado?.toUpperCase() === "APPROVED");
  const totalObtidos = obtidos.length;
  const totalPontos = obtidos.reduce((s, c) => s + (c.badge_pontos || 0), 0);
  const emCurso = candidaturas.filter((c) => ESTADOS_ATIVOS.includes(c.estado?.toUpperCase())).length;
  const submetidas = candidaturas.length;

  const candidaturasRecentes = [...candidaturas]
    .sort((a, b) => new Date(b.datacriacao) - new Date(a.datacriacao))
    .slice(0, 5);

  // Progresso global do lp
  const allHierBadges = learningPaths.flatMap((sl) => (sl.areas || []).flatMap((a) => a.badges || []));
  const totalBadgesLP = allHierBadges.length;
  const conquistadosLP = allHierBadges.filter((b) => b.conquistado).length;
  const pctBadges = totalBadgesLP ? Math.round((conquistadosLP / totalBadgesLP) * 100) : 0;

  return (
    <div className="page-wrapper">
      {marcos.length > 0 && (
        <CelebracaoModal
          marco={marcos[0]}
          onClose={() => setMarcos((prev) => prev.slice(1))}
        />
      )}

      <Navbar navItems={NAV_CONSULTOR} />

      <main className="cons-dashboard-content">
        <div className="cons-dashboard-header">
          <h1>Olá, {utilizador?.nome?.split(" ")[0] || "Consultor"} <FaRegSmile /></h1>
          <p>Aqui está o resumo do seu progresso e dos próximos passos.</p>
        </div>

        {/* Aviso in-app de badges a expirar */}
        {badgesExpiracao.length > 0 && (
          <div className="cons-expiracao-banner">
            <div className="cons-expiracao-icon"><BsExclamationTriangleFill /></div>
            <div className="cons-expiracao-texto">
              <h2>Tem badges a expirar</h2>
              <ul>
                {badgesExpiracao.slice(0, 5).map((b) => (
                  <li
                    key={b.idcandidatura ?? b.idbadge}
                    onClick={() => b.idbadge && navigate(`/badges/${b.idbadge}`)}
                  >
                    <strong>{b.nome}</strong>{" "}
                    {b.expirado
                      ? "- expirado"
                      : b.diasRestantes === 0
                        ? "- expira hoje"
                        : `- expira em ${b.diasRestantes} dia${b.diasRestantes === 1 ? "" : "s"}`}
                    {" "}({b.dataExpiracao.toLocaleDateString("pt-PT")})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Cartões de estatísticas */}
        <div className="cons-dashboard-cards">
          <div className="cons-card">
            <div className="cons-card-icon bg-green"><BsAwardFill size={24} /></div>
            <div className="cons-card-info">
              <h3>Badges Obtidos</h3>
              <p className="cons-card-value">{loading ? "..." : totalObtidos}</p>
            </div>
          </div>

          <div className="cons-card">
            <div className="cons-card-icon bg-amber"><BsStarFill size={24} /></div>
            <div className="cons-card-info">
              <h3>Pontos</h3>
              <p className="cons-card-value">{loading ? "..." : totalPontos}</p>
            </div>
          </div>

          <div className="cons-card" onClick={() => navigate("/consultor/candidaturas")} style={{ cursor: "pointer" }}>
            <div className="cons-card-icon bg-purple"><BsClockHistory size={24} /></div>
            <div className="cons-card-info">
              <h3>Em Curso</h3>
              <p className="cons-card-value">{loading ? "..." : emCurso}</p>
            </div>
          </div>

          <div className="cons-card" onClick={() => navigate("/consultor/candidaturas")} style={{ cursor: "pointer" }}>
            <div className="cons-card-icon bg-blue"><MdOutlineAssignment size={24} /></div>
            <div className="cons-card-info">
              <h3>Candidaturas</h3>
              <p className="cons-card-value">{loading ? "..." : submetidas}</p>
            </div>
          </div>
        </div>

        {/* Progresso nas Áreas*/}
        <div className="cons-section cons-lp-section">
          <div className="cons-section-head">
            <h2><BsGraphUpArrow /> Progresso nos Learning Paths</h2>
            <button className="cons-section-link" onClick={() => navigate("/consultor/badges")}>
              Os meus badges
            </button>
          </div>

          {loading ? (
            <p className="cons-empty">A carregar...</p>
          ) : (
            <>
              {/*progresso geral lp */}
              <div className="cons-lp-banner">
                <span className="cons-lp-kicker">Learning Path</span>
                <h3 className="cons-lp-banner-title">Jornada Técnica</h3>
                <p className="cons-lp-banner-sub">
                  {conquistadosLP} de {totalBadgesLP} badges conquistados
                </p>
                <div className="cons-lp-banner-track">
                  <div className="cons-lp-banner-fill" style={{ width: `${pctBadges}%` }} />
                </div>
                <span className="cons-lp-banner-pct">{pctBadges}% completo</span>
              </div>

              {(() => {
            // Mapa idbadge -> estado da candidatura em curso (para níveis ainda não conquistados)
            const estadoPorBadge = {};
            candidaturas.forEach((c) => {
              const e = c.estado?.toUpperCase();
              if (e) estadoPorBadge[c.idbadge] = e;
            });

      
            const areas = [];
            learningPaths.forEach((sl) => {
              (sl.areas || []).forEach((a) => {
                // Agrupar por idnivel (fallback: cada badge é o seu próprio nível)
                const grupos = new Map();
                (a.badges || []).forEach((b, i) => {
                  const chave = b.idnivel != null ? `n${b.idnivel}` : `b${i}`;
                  const ord = b.idnivel != null ? Number(b.idnivel) : 1000 + i;
                  if (!grupos.has(chave)) grupos.set(chave, { ord, badges: [] });
                  grupos.get(chave).badges.push(b);
                });

                const niveis = [...grupos.values()]
                  .sort((x, y) => x.ord - y.ord)
                  .slice(0, 5)
                  .map((g, idx) => ({
                    letra: String.fromCharCode(65 + idx),
                    estado: estadoNivelAgrupado(g.badges, estadoPorBadge),
                  }));

                if (niveis.length > 0) {
                  areas.push({ serviceline: sl.nome, nome: a.nome, niveis });
                }
              });
            });

            if (areas.length === 0) {
              return <p className="cons-empty">Sem áreas disponíveis de momento.</p>;
            }

            return (
              <div className="cons-lp-tree">
                {areas.map((area, j) => (
                  <AreaProgressCard area={area} key={`${area.serviceline}-${area.nome}-${j}`} />
                ))}
              </div>
            );
              })()}
            </>
          )}
        </div>

        <div className="cons-dashboard-grid">
          {/* Badges recomendados */}
          <div className="cons-section">
            <div className="cons-section-head">
              <h2><BsStarFill /> Próximos níveis recomendados</h2>
              <button className="cons-section-link" onClick={() => navigate("/consultor/catalogo")}>
                Ver catálogo
              </button>
            </div>

            {loading ? (
              <p className="cons-empty">A carregar...</p>
            ) : recomendados.length === 0 ? (
              <p className="cons-empty">Sem recomendações de momento. Veja o catálogo completo.</p>
            ) : (
              <div className="cons-reco-grid">
                {recomendados.map((b) => (
                  <div
                    key={b.idbadge}
                    className="cons-reco-card"
                    onClick={() => navigate(`/badges/${b.idbadge}`)}
                  >
                    {b.imagemurl ? (
                      <img src={b.imagemurl} alt={b.nome} className="cons-reco-img" />
                    ) : (
                      <div className="cons-reco-img-fallback"><FaMedal size={32} color="#d97706" /></div>
                    )}
                    <span className="cons-reco-name">{b.nome}</span>
                    {b.nivel && <span className="cons-reco-meta">{b.nivel}</span>}
                    <span className="cons-reco-points">{b.pontos} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Candidaturas submetidas */}
          <div className="cons-section">
            <div className="cons-section-head">
              <h2><BsClipboard /> Candidaturas Recentes</h2>
              <button className="cons-section-link" onClick={() => navigate("/consultor/candidaturas")}>
                Ver todas
              </button>
            </div>

            {loading ? (
              <p className="cons-empty">A carregar...</p>
            ) : candidaturasRecentes.length === 0 ? (
              <p className="cons-empty">Ainda não submeteu nenhuma candidatura.</p>
            ) : (
              <div className="cons-cand-list">
                {candidaturasRecentes.map((c) => {
                  const info = estadoInfo(c.estado);
                  return (
                    <div
                      key={c.idcandidatura}
                      className="cons-cand-item"
                      onClick={() => navigate(`/badges/${c.idbadge}`)}
                    >
                      {c.badge_imagem ? (
                        <img src={c.badge_imagem} alt={c.badge_nome} className="cons-cand-img" />
                      ) : (
                        <div className="cons-cand-img-fallback"><FaMedal size={20} color="#6b9bc7" /></div>
                      )}
                      <div className="cons-cand-info">
                        <span className="cons-cand-name">{c.badge_nome}</span>
                        <span className="cons-cand-date">
                          {new Date(c.datacriacao).toLocaleDateString("pt-PT")}
                          {c.badge_pontos != null && ` · ${c.badge_pontos} pts`}
                        </span>
                      </div>
                      <span className={`cons-estado ${info.cls}`}>{info.texto}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
