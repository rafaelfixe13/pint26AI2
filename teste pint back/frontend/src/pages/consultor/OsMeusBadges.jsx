import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/OsMeusBadges.css";

import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { MdOutlineAssignment, MdLeaderboard } from "react-icons/md";
import { BsAward, BsAwardFill, BsStarFill, BsLinkedin, BsSearch, BsGrid3X3Gap, BsTrophy } from "react-icons/bs";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { FaMedal } from "react-icons/fa";
import { FiUsers, FiChevronRight, FiDownload, FiClock } from "react-icons/fi";
import { HiOutlineEmojiSad } from "react-icons/hi";
import { API_BASE } from "../../api";
import { gerarCertificadoPDF } from "../../utils/certificado";
import { definirRgpd } from "../../utils/rgpd";
import RgpdModal from "../../components/RgpdModal";

import { NAV_CONSULTOR } from "../../utils/navConfig";

// Calcula estado de expiração a partir da data de conquista + meses
function expiryInfo(dataConquista, expiremeses) {
  if (!expiremeses || !dataConquista) return null; // não expira
  const exp = new Date(dataConquista);
  exp.setMonth(exp.getMonth() + Number(expiremeses));
  const agora = new Date();
  const diasRestantes = Math.ceil((exp - agora) / (1000 * 60 * 60 * 24));
  if (diasRestantes < 0)  return { cls: "mb-estado-expirado", texto: "Expirado" };
  if (diasRestantes <= 30) return { cls: "mb-estado-aviso", texto: `Expira em ${diasRestantes} dias` };
  return { cls: "mb-estado-ok", texto: `Válido até ${exp.toLocaleDateString("pt-PT")}` };
}

const getPointsColor = (pontos) => {
  if (pontos >= 100) return "#7c3aed";
  if (pontos >= 75)  return "#0369a1";
  if (pontos >= 50)  return "#059669";
  return "#d97706";
};

function OsMeusBadges() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroSL, setFiltroSL] = useState("");

  // Pesquisa de consultores (galeria pública)
  const [consultorQuery, setConsultorQuery] = useState("");
  const [consultorResults, setConsultorResults] = useState([]);
  const [searchingCons, setSearchingCons] = useState(false);

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }

    const fetchCandidaturas = fetch(
      `${API_BASE}/candidaturas/minhas?idutilizador=${utilizador.idutilizador}`
    ).then((r) => r.json()).catch(() => []);

    const fetchBadges = fetch(`${API_BASE}/badges`)
      .then((r) => r.json()).catch(() => []);

    Promise.all([fetchCandidaturas, fetchBadges])
      .then(([cands, todosBadges]) => {
        const aprovadas = (Array.isArray(cands) ? cands : [])
          .filter((c) => c.estado?.toUpperCase() === "APPROVED");

        const meta = {};
        (Array.isArray(todosBadges) ? todosBadges : []).forEach((b) => { meta[b.idbadge] = b; });

        // Enriquecer cada badge conquistado com metadados (área, SL, nível, expiração)
        const obtidos = aprovadas.map((c) => {
          const m = meta[c.idbadge] || {};
          return {
            idbadge: c.idbadge,
            idcandidatura: c.idcandidatura,
            nome: c.badge_nome || m.nome,
            descricao: m.descricao,
            imagemurl: c.badge_imagem || m.imagemurl,
            pontos: c.badge_pontos ?? m.pontos ?? 0,
            dataconquista: c.dataaprovacao || c.datacriacao,
            nivel: m.nivel,
            area: m.area,
            serviceline: m.serviceline,
            expiremeses: m.expiremeses,
            ispublico: m.ispublico,
            linkpublicobase: m.linkpublicobase,
            publico: c.publico ?? false,
            idespecial: m.idespecial,
            especial_nome: m.especial_nome,
          };
        });

        setBadges(obtidos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Pesquisar consultores (debounce simples)
  useEffect(() => {
    const q = consultorQuery.trim();
    if (q.length < 2) { setConsultorResults([]); return; }
    setSearchingCons(true);
    const t = setTimeout(() => {
      fetch(`${API_BASE}/publico/consultores?nome=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => setConsultorResults(Array.isArray(data) ? data : []))
        .catch(() => setConsultorResults([]))
        .finally(() => setSearchingCons(false));
    }, 300);
    return () => clearTimeout(t);
  }, [consultorQuery]);

  //RGPD
  const [rgpd, setRgpd] = useState(utilizador?.rgpd === true);
  const [pendingAccao, setPendingAccao] = useState(null);
  const [rgpdLoading, setRgpdLoading] = useState(false);

  const aceitarRgpd = async () => {
    setRgpdLoading(true);
    try {
      await definirRgpd(utilizador.idutilizador, true);
      setRgpd(true);
      const accao = pendingAccao;
      setPendingAccao(null);
      if (accao) accao();
    } catch {
      alert("Não foi possível registar o consentimento. Tente novamente.");
    } finally {
      setRgpdLoading(false);
    }
  };

  // Alternar visibilidade pública de um badge
  const doToggle = async (b, novo) => {
    setBadges((prev) => prev.map((x) => x.idbadge === b.idbadge ? { ...x, publico: novo } : x));
    try {
      const res = await fetch(`${API_BASE}/publico/badge`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idutilizador: utilizador.idutilizador, idbadge: b.idbadge, publico: novo }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBadges((prev) => prev.map((x) => x.idbadge === b.idbadge ? { ...x, publico: !novo } : x));
    }
  };

  const togglePublico = (b) => {
    const novo = !b.publico;
    if (novo && !rgpd) {                       // tornar público exige RGPD
      setPendingAccao(() => () => doToggle(b, true));
      return;
    }
    doToggle(b, novo);
  };

  // Gera e abre o certificado em PDF (novo separador)
  const baixarCertificado = (b) => {
    gerarCertificadoPDF({
      nome: utilizador?.nome,
      badgeNome: b.nome,
      nivel: b.nivel,
      area: b.area,
      serviceline: b.serviceline,
      pontos: b.pontos,
      data: b.dataconquista,
      idcandidatura: b.idcandidatura,
      imagemurl: b.imagemurl,
    });
  };

  // Adiciona o badge à secção "Licenças e Certificados" do perfil do LinkedIn
  const doAddToProfile = (b) => {
    const url = b.idcandidatura
      ? `${window.location.origin}/verificar/${b.idcandidatura}`
      : (b.linkpublicobase || `${window.location.origin}/publico/consultor/${utilizador.idutilizador}`);

    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: b.nome || "Badge Softinsa",
      organizationName: "Softinsa",
      certUrl: url,
    });
    if (b.idcandidatura) params.set("certId", String(b.idcandidatura));

    const d = b.dataconquista ? new Date(b.dataconquista) : null;
    if (d && !isNaN(d)) {
      params.set("issueYear", String(d.getFullYear()));
      params.set("issueMonth", String(d.getMonth() + 1));
      if (b.expiremeses) {
        const exp = new Date(d);
        exp.setMonth(exp.getMonth() + Number(b.expiremeses));
        params.set("expirationYear", String(exp.getFullYear()));
        params.set("expirationMonth", String(exp.getMonth() + 1));
      }
    }

    window.open(
      `https://www.linkedin.com/profile/add?${params.toString()}`,
      "_blank", "noopener,noreferrer"
    );
  };

  const adicionarAoPerfilLinkedin = (b) => {
    if (!rgpd) {                               // adicionar ao perfil exige RGPD
      setPendingAccao(() => () => doAddToProfile(b));
      return;
    }
    doAddToProfile(b);
  };


  //Filtros
  const serviceLines = [...new Set(badges.map((b) => b.serviceline).filter(Boolean))];

  const filtrados = badges.filter((b) => {
    const matchSearch = !search ||
      b.nome?.toLowerCase().includes(search.toLowerCase());
    const matchSL = !filtroSL || b.serviceline === filtroSL;
    return matchSearch && matchSL;
  });

  //Estatísticas
  const totalPontos = badges.reduce((s, b) => s + (b.pontos || 0), 0);
  const totalAreas = new Set(badges.map((b) => b.area).filter(Boolean)).size;

  return (
    <div className="mb-container">
      {pendingAccao && (
        <RgpdModal
          onAccept={aceitarRgpd}
          onCancel={() => setPendingAccao(null)}
          loading={rgpdLoading}
        />
      )}

      <Navbar navItems={NAV_CONSULTOR} />

      <main className="mb-content">
        <div className="mb-header">
          <h1>Os meus badges</h1>
          <p>Todos os badges que conquistou na plataforma.</p>
        </div>

        {/* Galeria pública */}
        <div className="mb-galeria">
          <div className="mb-galeria-head">
            <FiUsers size={18} />
            <div>
              <h2>Galeria pública de consultores</h2>
              <p>Pesquise um consultor para ver os badges que ele tornou públicos.</p>
            </div>
          </div>
          <div className="mb-galeria-search">
            <BsSearch size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Pesquisar consultor por nome..."
              value={consultorQuery}
              onChange={(e) => setConsultorQuery(e.target.value)}
            />
          </div>

          {consultorQuery.trim().length >= 2 && (
            <div className="mb-galeria-results">
              {searchingCons ? (
                <p className="mb-galeria-empty">A pesquisar…</p>
              ) : consultorResults.length === 0 ? (
                <p className="mb-galeria-empty">Nenhum consultor encontrado.</p>
              ) : (
                consultorResults.map((c) => (
                  <button
                    key={c.idutilizador}
                    className="mb-cons-row"
                    onClick={() => navigate(`/publico/consultor/${c.idutilizador}`)}
                  >
                    {c.fotourl ? (
                      <img
                        src={c.fotourl.startsWith("data:") ? c.fotourl : `data:image/jpeg;base64,${c.fotourl}`}
                        alt={c.nome}
                        className="mb-cons-avatar"
                      />
                    ) : (
                      <div className="mb-cons-avatar mb-cons-avatar-ini">
                        {c.nome?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <div className="mb-cons-info">
                      <span className="mb-cons-nome">{c.nome}</span>
                      <span className="mb-cons-meta">
                        {[c.serviceline, c.area].filter(Boolean).join(" • ") || "Consultor"}
                      </span>
                    </div>
                    <span className="mb-cons-count">{Number(c.publicos) || 0} públicos</span>
                    <FiChevronRight size={18} className="mb-cons-chevron" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="mb-resumo">
          <div className="mb-resumo-card">
            <div className="mb-resumo-icon mb-bg-green"><BsAwardFill size={22} /></div>
            <div className="mb-resumo-info">
              <h3>Badges Obtidos</h3>
              <p className="mb-resumo-valor">{loading ? "..." : badges.length}</p>
            </div>
          </div>
          <div className="mb-resumo-card">
            <div className="mb-resumo-icon mb-bg-amber"><BsStarFill size={22} /></div>
            <div className="mb-resumo-info">
              <h3>Pontos Totais</h3>
              <p className="mb-resumo-valor">{loading ? "..." : totalPontos}</p>
            </div>
          </div>
          <div className="mb-resumo-card">
            <div className="mb-resumo-icon mb-bg-blue"><BsGrid3X3Gap size={22} /></div>
            <div className="mb-resumo-info">
              <h3>Áreas</h3>
              <p className="mb-resumo-valor">{loading ? "..." : totalAreas}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        {!loading && badges.length > 0 && (
          <div className="mb-toolbar">
            <div className="mb-search">
              <BsSearch size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Pesquisar badge..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {serviceLines.length > 0 && (
              <select className="mb-select" value={filtroSL} onChange={(e) => setFiltroSL(e.target.value)}>
                <option value="">Todas as Service Lines</option>
                {serviceLines.map((sl) => <option key={sl} value={sl}>{sl}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Conteúdo */}
        {loading && (
          <div className="mb-status">
            <p>A carregar os seus badges...</p>
          </div>
        )}

        {!loading && badges.length === 0 && (
          <div className="mb-status">
            <HiOutlineEmojiSad size={48} className="mb-status-icon" />
            <p>Ainda não conquistou nenhum badge.</p>
            <button className="mb-btn mb-btn-ver" style={{ maxWidth: 220 }} onClick={() => navigate("/consultor/catalogo")}>
              <AiOutlineAppstore size={16} /> Explorar catálogo
            </button>
          </div>
        )}

        {!loading && badges.length > 0 && filtrados.length === 0 && (
          <div className="mb-status">
            <HiOutlineEmojiSad size={40} className="mb-status-icon" />
            <p>Nenhum badge corresponde aos filtros.</p>
          </div>
        )}

        {!loading && filtrados.length > 0 && (
          <div className="mb-grid">
            {filtrados.map((b) => {
              const exp = expiryInfo(b.dataconquista, b.expiremeses);
              return (
                <div key={b.idbadge} className="mb-card">
                  {b.idespecial != null && (
                    <span className="mb-tag-especial">
                      <BsStarFill size={11} /> {b.especial_nome || "Badge Especial"}
                    </span>
                  )}

                  <button
                    className={`mb-toggle-publico ${b.publico ? "on" : "off"}`}
                    onClick={() => togglePublico(b)}
                    title={b.publico ? "Visível na galeria pública - clique para ocultar" : "Oculto - clique para tornar público"}
                  >
                    {b.publico ? <IoEyeOutline size={13} /> : <IoEyeOffOutline size={13} />}
                    {b.publico ? "Público" : "Privado"}
                  </button>

                  <div className="mb-icon-wrap">
                    {b.imagemurl ? (
                      <img
                        src={b.imagemurl}
                        alt={b.nome}
                        className="mb-icon-img"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div className="mb-icon-fallback" style={{ display: b.imagemurl ? "none" : "flex" }}>
                      <FaMedal size={34} color="#d97706" />
                    </div>
                  </div>

                  <h3 className="mb-name">{b.nome}</h3>
                  {b.descricao && <p className="mb-desc">{b.descricao}</p>}

                  <div className="mb-info">
                    {b.serviceline && (
                      <p><span className="mb-info-label">Service Line:</span> {b.serviceline}</p>
                    )}
                    {b.area && (
                      <p><span className="mb-info-label">Área:</span> {b.area}</p>
                    )}
                    {b.nivel && (
                      <p><span className="mb-info-label">Nível:</span> {b.nivel}</p>
                    )}
                    <p>
                      <span className="mb-info-label">Estado:</span>{" "}
                      {exp
                        ? <span className={exp.cls}>{exp.texto}</span>
                        : <span className="mb-estado-ok">Sem expiração</span>}
                    </p>
                    {b.dataconquista && (
                      <p><span className="mb-info-label">Conquistado:</span> {new Date(b.dataconquista).toLocaleDateString("pt-PT")}</p>
                    )}
                  </div>

                  <span className="mb-points" style={{ backgroundColor: getPointsColor(b.pontos) }}>
                    {b.pontos} Pontos
                  </span>

                  <div className="mb-card-acoes">
                    <button className="mb-btn mb-btn-ver" onClick={() => navigate(`/badges/${b.idbadge}`)}>
                      <IoEyeOutline size={15} /> Ver Detalhes
                    </button>
                    <button className="mb-btn mb-btn-cert" title="Descarregar certificado (PDF)" onClick={() => baixarCertificado(b)}>
                      <FiDownload size={15} />
                    </button>
                    <button className="mb-btn mb-btn-linkedin" title="Adicionar aos certificados do LinkedIn" onClick={() => adicionarAoPerfilLinkedin(b)}>
                      <BsLinkedin size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default OsMeusBadges;
