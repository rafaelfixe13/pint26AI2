import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/ConsultorDashboard.css";

import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { MdOutlineAssignment, MdLeaderboard } from "react-icons/md";
import { BsAward, BsAwardFill, BsStarFill, BsClockHistory, BsTrophy } from "react-icons/bs";
import { FaMedal } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { API_BASE } from "../../api";
import { verificarMarcos } from "../../utils/marcos";
import CelebracaoModal from "../../components/CelebracaoModal";

const NAV_ITEMS = [
  { label: "Início",             icon: <GoHome size={16} /> },
  { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
  { label: "Os meus badges",     icon: <BsAward size={16} /> },
  { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
  { label: "Conquistas",         icon: <BsTrophy size={16} /> },
  { label: "Rankings",           icon: <MdLeaderboard size={16} /> },
  { label: "Lembretes",          icon: <FiClock size={16} /> },
];

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

// Anel de progresso circular (SVG)
function ProgressRing({ pct = 0, size = 132, stroke = 13, color = "#3b82f6" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="cons-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="cons-ring-text">
        {pct}%
      </text>
    </svg>
  );
}

export default function DashBoard() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [activeTab, setActiveTab] = useState("Início");
  const [candidaturas, setCandidaturas] = useState([]);
  const [recomendados, setRecomendados] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marco, setMarco] = useState(null);

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

    const fetchRanking = fetch(`${API_BASE}/utilizadores/ranking`)
      .then((r) => r.json()).catch(() => []);

    Promise.all([fetchCandidaturas, fetchBadges, fetchHierarquia, fetchRanking])
      .then(([cands, badges, hierarquia, ranking]) => {
        const listaCands = Array.isArray(cands) ? cands : [];
        const listaBadges = Array.isArray(badges) ? badges : [];
        setCandidaturas(listaCands);
        setLearningPaths(Array.isArray(hierarquia) ? hierarquia : []);

        const meta = {};
        listaBadges.forEach((b) => { meta[b.idbadge] = b; });

        const indispo = new Set(
          listaCands
            .filter((c) => ["APPROVED", ...ESTADOS_ATIVOS].includes(c.estado?.toUpperCase()))
            .map((c) => c.idbadge)
        );

        const nivelOrder = (b) => {
          if (b.idnivel != null) return Number(b.idnivel);
          const m = (b.nivel || "").trim().match(/^([A-E])/i);
          return m ? m[1].toUpperCase().charCodeAt(0) - 64 : 99;
        };

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

        // Celebração de marcos (req. 16)
        const aprov = listaCands.filter((c) => c.estado?.toUpperCase() === "APPROVED");
        const listaRanking = Array.isArray(ranking) ? ranking : [];
        const primeiroRanking =
          listaRanking.length > 0 &&
          String(listaRanking[0].idutilizador) === String(utilizador.idutilizador);
        const m = verificarMarcos(utilizador.idutilizador, {
          totalBadges: aprov.length,
          totalPontos: aprov.reduce((s, c) => s + (c.badge_pontos || 0), 0),
          primeiroRanking,
        });
        if (m) setMarco(m);

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Estatísticas ──────────────────────────────────────
  const obtidos = candidaturas.filter((c) => c.estado?.toUpperCase() === "APPROVED");
  const totalObtidos = obtidos.length;
  const totalPontos = obtidos.reduce((s, c) => s + (c.badge_pontos || 0), 0);
  const emCurso = candidaturas.filter((c) => ESTADOS_ATIVOS.includes(c.estado?.toUpperCase())).length;
  const submetidas = candidaturas.length;

  const candidaturasRecentes = [...candidaturas]
    .sort((a, b) => new Date(b.datacriacao) - new Date(a.datacriacao))
    .slice(0, 5);

  // ── Métricas de progresso visual ───────────────────────
  const allHierBadges = learningPaths.flatMap((sl) => (sl.areas || []).flatMap((a) => a.badges || []));
  const totalBadgesLP = allHierBadges.length;
  const conquistadosLP = allHierBadges.filter((b) => b.conquistado).length;
  const pctBadges = totalBadgesLP ? Math.round((conquistadosLP / totalBadgesLP) * 100) : 0;

  const porNivel = Object.values(
    allHierBadges.reduce((acc, b) => {
      const lvl = b.nivel || "Sem nível";
      acc[lvl] = acc[lvl] || { nivel: lvl, total: 0, ok: 0 };
      acc[lvl].total++;
      if (b.conquistado) acc[lvl].ok++;
      return acc;
    }, {})
  ).sort((a, b) => a.nivel.localeCompare(b.nivel));

  const handleTabChange = (label) => {
    setActiveTab(label);
    if (label === "Início")             navigate("/consultor");
    if (label === "Catálogo de Badges") navigate("/consultor/catalogo");
    if (label === "Os meus badges")     navigate("/consultor/badges");
    if (label === "Candidaturas")       navigate("/consultor/candidaturas");
    if (label === "Conquistas")         navigate("/consultor/conquistas");
    if (label === "Rankings")           navigate("/consultor/rankings");
    if (label === "Lembretes")          navigate("/consultor/lembretes");
  };

  return (
    <div className="page-wrapper">
      {marco && <CelebracaoModal marco={marco} onClose={() => setMarco(null)} />}

      <Navbar activeTab={activeTab} onTabChange={handleTabChange} navItems={NAV_ITEMS} />

      <main className="cons-dashboard-content">
        <div className="cons-dashboard-header">
          <h1>Olá, {utilizador?.nome?.split(" ")[0] || "Consultor"} 👋</h1>
          <p>Aqui está o resumo do seu progresso e dos próximos passos.</p>
        </div>

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

        {/* Métricas de progresso visual */}
        <div className="cons-section cons-metrics-section">
          <div className="cons-section-head">
            <h2>📊 Métricas de progresso</h2>
          </div>

          {loading ? (
            <p className="cons-empty">A carregar...</p>
          ) : totalBadgesLP === 0 ? (
            <p className="cons-empty">Sem dados de progresso de momento.</p>
          ) : (
            <div className="cons-metrics">
              <div className="cons-metrics-rings">
                <div className="cons-ring-card">
                  <ProgressRing pct={pctBadges} color="#3b82f6" />
                  <span className="cons-ring-label">Badges concluídos</span>
                  <span className="cons-ring-sub">{conquistadosLP} de {totalBadgesLP}</span>
                </div>
              </div>

              <div className="cons-metrics-bars">
                <h4 className="cons-metrics-bars-title">Progresso por nível</h4>
                {porNivel.map((n) => {
                  const pct = n.total ? Math.round((n.ok / n.total) * 100) : 0;
                  return (
                    <div className="cons-lp-row" key={n.nivel}>
                      <div className="cons-lp-row-top">
                        <span className="cons-lp-area">{n.nivel}</span>
                        <span className="cons-lp-count">{n.ok}/{n.total} · {pct}%</span>
                      </div>
                      <div className="cons-lp-bar">
                        <div
                          className={`cons-lp-fill ${pct === 100 ? "completo" : ""}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Progresso nos Learning Paths */}
        <div className="cons-section cons-lp-section">
          <div className="cons-section-head">
            <h2>📈 Progresso nas Áreas</h2>
            <button className="cons-section-link" onClick={() => navigate("/consultor/badges")}>
              Os meus badges
            </button>
          </div>

          {loading ? (
            <p className="cons-empty">A carregar...</p>
          ) : (() => {
            const areas = learningPaths
              .flatMap((sl) =>
                (sl.areas || []).map((a) => ({
                  serviceline: sl.nome,
                  nome: a.nome,
                  total: (a.badges || []).length,
                  conquered: (a.badges || []).filter((b) => b.conquistado).length,
                }))
              )
              .filter((a) => a.total > 0);

            if (areas.length === 0) {
              return <p className="cons-empty">Sem areas disponíveis de momento.</p>;
            }

            return (
              <div className="cons-lp-list">
                {areas.map((a, i) => {
                  const pct = a.total ? Math.round((a.conquered / a.total) * 100) : 0;
                  return (
                    <div key={`${a.nome}-${i}`} className="cons-lp-row">
                      <div className="cons-lp-row-top">
                        <span className="cons-lp-area">
                          {a.nome}
                          <span className="cons-lp-sl">{a.serviceline}</span>
                        </span>
                        <span className="cons-lp-count">{a.conquered}/{a.total} badges</span>
                      </div>
                      <div className="cons-lp-bar">
                        <div
                          className={`cons-lp-fill ${pct === 100 ? "completo" : ""}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div className="cons-dashboard-grid">
          {/* Badges recomendados */}
          <div className="cons-section">
            <div className="cons-section-head">
              <h2>⭐ Próximos níveis recomendados</h2>
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
              <h2>📋 Candidaturas Recentes</h2>
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
