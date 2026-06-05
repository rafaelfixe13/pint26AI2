import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles/Perfil.css";
import {
  MdOutlineEmail, MdOutlineVerified, MdOutlineAssignment, MdLeaderboard,
} from "react-icons/md";
import {
  BsCalendarCheck, BsAward, BsBarChart, BsClockHistory, BsTrophy,
  BsStarFill, BsDiagram3, BsCameraFill,
} from "react-icons/bs";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { FiUsers, FiLock, FiChevronRight } from "react-icons/fi";
import { FaMedal } from "react-icons/fa";
import { API_BASE } from "../api";

// ─── Nav items por perfil ──────────────────────────────────
const NAV_CONSULTOR = [
  { label: "Início",             icon: <GoHome size={16} /> },
  { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
  { label: "Os meus badges",     icon: <BsAward size={16} /> },
  { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
  { label: "Conquistas",         icon: <BsTrophy size={16} /> },
  { label: "Rankings",           icon: <MdLeaderboard size={16} /> },
];

const NAV_TALENT = [
  { label: "Início",      icon: <GoHome size={16} /> },
  { label: "Validações",  icon: <MdOutlineVerified size={16} /> },
  { label: "Histórico",   icon: <BsClockHistory size={16} /> },
  { label: "Catálogo",    icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas",  icon: <BsTrophy size={16} /> },
  { label: "Relatórios",  icon: <BsBarChart size={16} /> },
  { label: "Consultores", icon: <FiUsers size={16} /> },
];

const NAV_ADMIN = [
  { label: "Utilizadores", icon: <FiUsers size={16} /> },
  { label: "Badges",       icon: <BsAward size={16} /> },
];

const ROLES = {
  1: "Consultor",
  2: "Talent Manager",
  3: "Service Line Leader",
  4: "Administrador",
};

function getNavItems(perfilAtivo) {
  if (perfilAtivo === "2") return NAV_TALENT;
  if (perfilAtivo === "4") return NAV_ADMIN;
  return NAV_CONSULTOR;
}

function Perfil() {
  const navigate = useNavigate();

  const perfilAtivo = localStorage.getItem("perfilAtivo") || "1";
  const isConsultor = perfilAtivo === "1";

  const [activeTab, setActiveTab] = useState("O meu perfil");
  const [utilizador, setUtilizador] = useState(
    JSON.parse(localStorage.getItem("utilizador") || "{}")
  );
  const [fotoPreview, setFotoPreview] = useState(null);

  const [obtidos, setObtidos] = useState([]);
  const [emCurso, setEmCurso] = useState(0);
  const [totalCand, setTotalCand] = useState(0);
  const [atividade, setAtividade] = useState([]);
  const [areaNome, setAreaNome] = useState(null);
  const [serviceLineNome, setServiceLineNome] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(JSON.parse(localStorage.getItem("utilizador") || "{}")?.idutilizador)
  );

  const navItems = getNavItems(perfilAtivo);

  // ── Buscar estatísticas e dados de badges ───────────────
  useEffect(() => {
    if (!utilizador?.idutilizador) return;

    const fetchCands = isConsultor
      ? fetch(`${API_BASE}/candidaturas/minhas?idutilizador=${utilizador.idutilizador}`)
          .then((r) => r.json()).catch(() => [])
      : Promise.resolve([]);

    const fetchBadges = fetch(`${API_BASE}/badges`).then((r) => r.json()).catch(() => []);

    Promise.all([fetchCands, fetchBadges])
      .then(([cands, badges]) => {
        const listaCands = Array.isArray(cands) ? cands : [];
        const listaBadges = Array.isArray(badges) ? badges : [];

        const meta = {};
        listaBadges.forEach((b) => { meta[b.idbadge] = b; });

        if (utilizador.idarea != null) {
          const b = listaBadges.find((x) => String(x.idarea) === String(utilizador.idarea));
          if (b) { setAreaNome(b.area); setServiceLineNome(b.serviceline); }
        }

        const aprovadas = listaCands.filter((c) => c.estado?.toUpperCase() === "APPROVED");
        setObtidos(aprovadas.map((c) => ({
          ...c,
          nivel: meta[c.idbadge]?.nivel,
          area: meta[c.idbadge]?.area,
        })));

        const ativos = ["OPEN", "SUBMITTED", "UNDER_REVIEW", "EM_VALIDACAO"];
        setEmCurso(listaCands.filter((c) => ativos.includes(c.estado?.toUpperCase())).length);
        setTotalCand(listaCands.length);

        setAtividade(
          [...listaCands]
            .sort((a, b) => new Date(b.datacriacao) - new Date(a.datacriacao))
            .slice(0, 5)
        );

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [utilizador?.idutilizador, isConsultor]);

  const getInitials = (nome) => {
    if (!nome) return "?";
    return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const formatarData = (data) => {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-PT", {
      day: "2-digit", month: "long", year: "numeric",
    });
  };

  const handleTabChange = (label) => {
    setActiveTab(label);
    if (perfilAtivo === "1") {
      if (label === "Início")             navigate("/consultor");
      if (label === "Catálogo de Badges") navigate("/consultor/catalogo");
      if (label === "Os meus badges")     navigate("/consultor/badges");
      if (label === "Candidaturas")       navigate("/consultor/candidaturas");
      if (label === "Conquistas")         navigate("/consultor/conquistas");
      if (label === "Rankings")           navigate("/consultor/rankings");
    }
    if (perfilAtivo === "2") {
      if (label === "Início")      navigate("/talent");
      if (label === "Validações")  navigate("/talent/validacoes");
      if (label === "Histórico")   navigate("/talent/historico");
      if (label === "Catálogo")    navigate("/talent/catalogo");
      if (label === "Conquistas")  navigate("/talent/conquistas");
      if (label === "Relatórios")  navigate("/talent/relatorios");
      if (label === "Consultores") navigate("/talent/diretorio");
    }
    if (perfilAtivo === "4") {
      if (label === "Utilizadores") navigate("/admin/utilizadores");
      if (label === "Badges")       navigate("/admin/badges");
    }
  };

  const fotoAtual = fotoPreview
    || (utilizador?.fotourl
        ? utilizador.fotourl.startsWith("data:")
          ? utilizador.fotourl
          : `data:image/jpeg;base64,${utilizador.fotourl}`
        : null);

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64completo = reader.result;
      const base64puro = base64completo.split(",")[1];
      setFotoPreview(base64completo);
      try {
        const res = await fetch(
          `${API_BASE}/utilizadores/${utilizador.idutilizador}/foto-base64`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fotourl: base64puro }),
          }
        );
        if (res.ok) {
          const u = { ...utilizador, fotourl: base64puro };
          localStorage.setItem("utilizador", JSON.stringify(u));
          setUtilizador(u);
        }
      } catch (err) {
        console.error("Erro ao atualizar foto de perfil:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Estatísticas derivadas ──────────────────────────────
  const totalObtidos = obtidos.length;
  const totalPontos = obtidos.reduce((s, c) => s + (c.badge_pontos || 0), 0);

  const competencias = Object.values(
    obtidos.reduce((acc, b) => {
      const area = b.area || "Outros";
      acc[area] = acc[area] || { area, count: 0 };
      acc[area].count += 1;
      return acc;
    }, {})
  );

  const estadoActividade = (estado) => {
    const e = estado?.toUpperCase();
    if (e === "APPROVED") return { cls: "green",  texto: "Aprovado" };
    if (e === "REJECTED") return { cls: "red",    texto: "Rejeitado" };
    if (e === "OPEN")     return { cls: "amber",  texto: "Por corrigir" };
    return { cls: "blue", texto: "Em validação" };
  };

  const STATS = [
    { num: totalObtidos, label: "Badges obtidos", icon: <BsAward size={18} />,            cls: "green"  },
    { num: totalPontos,  label: "Pontos",         icon: <BsStarFill size={16} />,         cls: "amber"  },
    { num: emCurso,      label: "Em curso",       icon: <BsClockHistory size={16} />,     cls: "purple" },
    { num: totalCand,    label: "Candidaturas",   icon: <MdOutlineAssignment size={16} />, cls: "blue"  },
  ];

  return (
    <div className="page-wrapper">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} navItems={navItems} />

      <div className="pf-wrap">

        {/* ===== HERO ===== */}
        <section className="pf-hero">
          <div className="pf-hero-cover" />

          <button className="pf-hero-pass" onClick={() => navigate("/alterar-password")}>
            <FiLock size={14} /> Alterar palavra-passe
          </button>

          <div className="pf-hero-body">
            <div className="pf-avatar-wrap">
              {fotoAtual ? (
                <img src={fotoAtual} alt={utilizador.nome} className="pf-avatar" />
              ) : (
                <div className="pf-avatar pf-avatar-initials">{getInitials(utilizador?.nome)}</div>
              )}
              <label className="pf-avatar-edit" title="Mudar foto">
                <BsCameraFill size={13} />
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFotoChange} />
              </label>
            </div>

            <div className="pf-hero-info">
              <h1 className="pf-name">{utilizador?.nome ?? "—"}</h1>
              <div className="pf-chips">
                <span className="pf-chip pf-chip-role">{ROLES[utilizador?.idrole] || "Utilizador"}</span>
                {areaNome && <span className="pf-chip">{areaNome}</span>}
                {serviceLineNome && <span className="pf-chip pf-chip-soft">{serviceLineNome}</span>}
              </div>
            </div>

            {isConsultor && (
              <div className="pf-hero-stats">
                <div className="pf-hero-stat">
                  <span className="pf-hero-stat-num">{loading ? "…" : totalObtidos}</span>
                  <span className="pf-hero-stat-label">Badges</span>
                </div>
                <div className="pf-hero-divider" />
                <div className="pf-hero-stat">
                  <span className="pf-hero-stat-num">{loading ? "…" : totalPontos}</span>
                  <span className="pf-hero-stat-label">Pontos</span>
                </div>
                <div className="pf-hero-divider" />
                <div className="pf-hero-stat">
                  <span className="pf-hero-stat-num">{loading ? "…" : emCurso}</span>
                  <span className="pf-hero-stat-label">Em curso</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===== Cartões de resumo ===== */}
        {isConsultor && (
          <section className="pf-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="pf-stat-card">
                <div className={`pf-stat-icon ${s.cls}`}>{s.icon}</div>
                <div>
                  <span className="pf-stat-num">{loading ? "…" : s.num}</span>
                  <span className="pf-stat-label">{s.label}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ===== Conteúdo principal ===== */}
        <div className="pf-content">

          {/* Coluna esquerda */}
          <div className="pf-col-main">

            {isConsultor && (
              <div className="pf-card">
                <div className="pf-card-head">
                  <h3>Badges em destaque</h3>
                  <button className="pf-link" onClick={() => navigate("/consultor/badges")}>
                    Ver todos <FiChevronRight size={14} />
                  </button>
                </div>

                {loading ? (
                  <p className="pf-empty">A carregar…</p>
                ) : obtidos.length === 0 ? (
                  <div className="pf-empty-box">
                    <FaMedal size={32} color="#cbd5e1" />
                    <p>Ainda não conquistou nenhum badge.</p>
                    <button className="pf-btn-primary" onClick={() => navigate("/consultor/catalogo")}>
                      Explorar catálogo
                    </button>
                  </div>
                ) : (
                  <div className="pf-badges">
                    {obtidos.slice(0, 8).map((b) => (
                      <div
                        key={b.idcandidatura}
                        className="pf-badge"
                        onClick={() => navigate(`/badges/${b.idbadge}`)}
                      >
                        <div className="pf-badge-icon">
                          {b.badge_imagem ? (
                            <img src={b.badge_imagem} alt={b.badge_nome} />
                          ) : (
                            <FaMedal size={26} color="#d97706" />
                          )}
                        </div>
                        <span className="pf-badge-name">{b.badge_nome}</span>
                        {b.nivel && <span className="pf-badge-meta">{b.nivel}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isConsultor && (
              <div className="pf-card">
                <div className="pf-card-head">
                  <h3>Atividade recente</h3>
                  <button className="pf-link" onClick={() => navigate("/consultor/candidaturas")}>
                    Ver candidaturas <FiChevronRight size={14} />
                  </button>
                </div>

                {loading ? (
                  <p className="pf-empty">A carregar…</p>
                ) : atividade.length === 0 ? (
                  <p className="pf-empty">Sem atividade recente.</p>
                ) : (
                  <div className="pf-timeline">
                    {atividade.map((a) => {
                      const info = estadoActividade(a.estado);
                      return (
                        <div key={a.idcandidatura} className="pf-timeline-item">
                          <span className={`pf-dot ${info.cls}`} />
                          <div className="pf-timeline-text">
                            <span className="pf-timeline-title">{a.badge_nome}</span>
                            <span className={`pf-tag ${info.cls}`}>{info.texto}</span>
                          </div>
                          <span className="pf-timeline-date">
                            {new Date(a.datacriacao).toLocaleDateString("pt-PT")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!isConsultor && (
              <div className="pf-card">
                <h3>Informação da conta</h3>
                <p className="pf-empty">
                  Perfil de {ROLES[utilizador?.idrole] || "Utilizador"}.
                  As estatísticas de badges aplicam-se ao perfil de Consultor.
                </p>
              </div>
            )}
          </div>

          {/* Coluna direita */}
          <div className="pf-col-side">

            {/* Detalhes da conta */}
            <div className="pf-card">
              <h3>Detalhes da conta</h3>
              <div className="pf-detail">
                <span className="pf-detail-ic"><MdOutlineEmail size={17} /></span>
                <div>
                  <span className="pf-detail-label">Email</span>
                  <span className="pf-detail-val">{utilizador?.email ?? "—"}</span>
                </div>
              </div>
              {serviceLineNome && (
                <div className="pf-detail">
                  <span className="pf-detail-ic"><BsDiagram3 size={16} /></span>
                  <div>
                    <span className="pf-detail-label">Service Line</span>
                    <span className="pf-detail-val">{serviceLineNome}</span>
                  </div>
                </div>
              )}
              <div className="pf-detail">
                <span className="pf-detail-ic"><BsCalendarCheck size={16} /></span>
                <div>
                  <span className="pf-detail-label">Membro desde</span>
                  <span className="pf-detail-val">{formatarData(utilizador?.datacriacao)}</span>
                </div>
              </div>
              <div className="pf-detail">
                <span className="pf-detail-ic"><MdOutlineVerified size={17} /></span>
                <div>
                  <span className="pf-detail-label">Estado da conta</span>
                  <span className={`pf-detail-val estado-${(utilizador?.estadoconta ?? "").toLowerCase()}`}>
                    {utilizador?.estadoconta ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Áreas de competência */}
            {isConsultor && (
              <div className="pf-card">
                <h3>Áreas de competência</h3>
                {loading ? (
                  <p className="pf-empty">A carregar…</p>
                ) : competencias.length === 0 ? (
                  <p className="pf-empty">Sem badges conquistados ainda.</p>
                ) : (
                  <div className="pf-comp-list">
                    {competencias.map((c) => (
                      <div key={c.area} className="pf-comp">
                        <div className="pf-comp-ic"><BsAward size={16} /></div>
                        <span className="pf-comp-name">{c.area}</span>
                        <span className="pf-comp-count">{c.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
