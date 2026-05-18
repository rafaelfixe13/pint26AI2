import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import Navbar from "./NavBar";
import "../styles/BadgesList.css";
import { API_BASE } from "../api";
import { BsSearch, BsStarFill, BsAward } from "react-icons/bs";
import { FaMedal } from "react-icons/fa";
import { MdFilterList, MdOutlineAssignment } from "react-icons/md";
import { AiOutlineLoading3Quarters, AiOutlineAppstore } from "react-icons/ai";
import { HiOutlineEmojiSad } from "react-icons/hi";
import { IoEyeOutline } from "react-icons/io5";
import { GoHome } from "react-icons/go";

const NAV_ITEMS_CONSULTOR = [
  { label: "Início",             icon: <GoHome size={16} /> },
  { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
  { label: "Os meus badges",     icon: <BsAward size={16} /> },
  { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
];

// ✅ Aceita activeTabInicial como prop
function BadgesList({ navItems = NAV_ITEMS_CONSULTOR, onTabExtra, activeTabInicial }) {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");
  const perfilAtivo = Number(localStorage.getItem("perfilAtivo") || "0");
  const isConsultor = perfilAtivo === 1;

  const [badges, setBadges] = useState([]);
  const [badgesAprovados, setBadgesAprovados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  // ✅ Usa activeTabInicial se fornecido, senão usa o label do navItems ou default
  const [activeTab, setActiveTab] = useState(
    activeTabInicial ||
    navItems.find(i => i.label.includes("Catálogo"))?.label ||
    "Catálogo de Badges"
  );
  const [filters, setFilters] = useState({
    serviceline: "",
    area: "",
    nivel: "",
    estado: "",
  });

  // ✅ useEffect de deteção automática REMOVIDO — activeTabInicial resolve isto

  useEffect(() => {
    const fetchBadges = fetch(`${API_BASE}/badges`).then((r) => r.json());

    const fetchAprovados = isConsultor && utilizador
      ? fetch(`${API_BASE}/candidaturas/minhas?idutilizador=${utilizador.idutilizador}`)
          .then((r) => r.json())
          .catch(() => [])
      : Promise.resolve([]);

    Promise.all([fetchBadges, fetchAprovados])
      .then(([allBadges, candidaturas]) => {
        setBadges(Array.isArray(allBadges) ? allBadges : []);
        const aprovados = new Set(
          (Array.isArray(candidaturas) ? candidaturas : [])
            .filter((c) => c.estado === "fechado" && c.resultado === "aprovado")
            .map((c) => c.idbadge)
        );
        setBadgesAprovados(aprovados);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar badges.");
        setLoading(false);
      });
  }, []);

  const handleTabChange = (label) => {
    setActiveTab(label);

    if (onTabExtra) { onTabExtra(label); return; }

    const p = localStorage.getItem("perfilAtivo");
    if (label === "Início") {
      if (p === "1") navigate("/consultor");
      else if (p === "2") navigate("/talent/catalogo");
      else if (p === "4") navigate("/admin/utilizadores");
      else navigate("/perfil");
    }
    if (label === "Candidaturas")   navigate("/consultor/candidaturas");
    if (label === "Os meus badges") navigate("/consultor");
  };

  const uniqueValues = (key) => [...new Set(badges.map((b) => b[key]).filter(Boolean))];

  const filtered = badges.filter((b) => {
    if (isConsultor && badgesAprovados.has(b.idbadge)) return false;
    const matchSearch =
      b.nome?.toLowerCase().includes(search.toLowerCase()) ||
      b.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchSL     = !filters.serviceline || b.serviceline === filters.serviceline;
    const matchArea   = !filters.area        || b.area        === filters.area;
    const matchNivel  = !filters.nivel       || b.nivel       === filters.nivel;
    const matchEstado = !filters.estado      || b.estado      === filters.estado;
    return matchSearch && matchSL && matchArea && matchNivel && matchEstado;
  });

  const getPointsColor = (pontos) => {
    if (pontos >= 100) return "#7c3aed";
    if (pontos >= 75)  return "#0369a1";
    if (pontos >= 50)  return "#059669";
    return "#d97706";
  };

  return (
    <div className="page-wrapper">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navItems={navItems}
      />

      <div className="catalog-container">
        <div className="catalog-header">
          <h1>Catálogo de Badges</h1>
          <p>Consulte todos os badges disponíveis, descrições, pontos e requisitos.</p>
        </div>

        <div className="catalog-toolbar">
          <div className="search-box">
            <BsSearch className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Pesquisar badge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filters">
            <MdFilterList size={20} className="filter-icon" />
            <select value={filters.serviceline} onChange={(e) => setFilters({ ...filters, serviceline: e.target.value })}>
              <option value="">Service Line</option>
              {uniqueValues("serviceline").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
              <option value="">Área</option>
              {uniqueValues("area").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filters.nivel} onChange={(e) => setFilters({ ...filters, nivel: e.target.value })}>
              <option value="">Nível</option>
              {uniqueValues("nivel").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
              <option value="">Estado</option>
              {uniqueValues("estado").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {loading && (
          <div className="catalog-status">
            <AiOutlineLoading3Quarters size={32} className="spinner" />
            <p>A carregar badges...</p>
          </div>
        )}

        {error && <div className="catalog-status error">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="catalog-status">
            <HiOutlineEmojiSad size={40} />
            <p>Nenhum badge encontrado.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <Row xs={1} sm={2} md={3} lg={4} className="g-3">
            {filtered.map((badge) => (
              <Col key={badge.idbadge} className="d-flex">
                <div className="badge-card">
                  {badge.ispublic === false && (
                    <span className="tag-especial">
                      <BsStarFill size={12} style={{ marginRight: 4 }} />
                      Conquista Especial
                    </span>
                  )}

                  {/* Corpo */}
                  <div className="badge-card-body">
                    <div className="badge-icon-wrap">
                      {badge.imagemurl ? (
                        <img
                          src={badge.imagemurl}
                          alt={badge.nome}
                          className="badge-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="badge-icon-fallback"
                        style={{ display: badge.imagemurl ? "none" : "flex" }}
                      >
                        <FaMedal size={44} color="#d97706" />
                      </div>
                    </div>

                    <h3 className="badge-name">{badge.nome}</h3>
                    {badge.descricao && <p className="badge-desc">{badge.descricao}</p>}

                    <div className="badge-info">
                      {badge.serviceline && (
                        <p><span className="info-label">Service Line:</span> {badge.serviceline}</p>
                      )}
                      {badge.area && (
                        <p><span className="info-label">Área:</span> {badge.area}</p>
                      )}
                      {badge.nivel && (
                        <p><span className="info-label">Nível:</span> {badge.nivel}</p>
                      )}
                      {badge.estado
                        ? <p><span className="info-label">Estado:</span> {badge.estado}</p>
                        : badge.expiremeses
                          ? <p><span className="info-label">Estado:</span> {`Expira em ${badge.expiremeses} meses`}</p>
                          : null}
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="badge-card-footer">
                    <span
                      className="badge-points"
                      style={{ backgroundColor: getPointsColor(badge.pontos) }}
                    >
                      {badge.pontos} Pontos
                    </span>
                    <button
                      className="btn-detalhes"
                      onClick={() => navigate(`/badges/${badge.idbadge}`)}
                    >
                      <IoEyeOutline size={16} />
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}

export default BadgesList;