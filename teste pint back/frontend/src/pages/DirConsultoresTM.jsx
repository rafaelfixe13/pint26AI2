import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles/DirConsultoresTM.css";
import { API_BASE } from "../api";
import { Container, Row, Col } from "react-bootstrap";
import { BsSearch, BsStarFill, BsClockHistory, BsTrophy, BsBarChart } from "react-icons/bs";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore, AiOutlineLoading3Quarters } from "react-icons/ai";
import { MdFilterList, MdOutlineVerified } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { HiOutlineEmojiSad } from "react-icons/hi";

const NAV_ITEMS = [
  { label: "Início",      icon: <GoHome size={16} /> },
  { label: "Validações",  icon: <MdOutlineVerified size={16} /> },
  { label: "Histórico",   icon: <BsClockHistory size={16} /> },
  { label: "Catálogo",    icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas",  icon: <BsTrophy size={16} /> },
  { label: "Relatórios",  icon: <BsBarChart size={16} /> },
  { label: "Consultores", icon: <FiUsers size={16} /> },
];

const getInitials = (nome) => {
  if (!nome) return "?";
  return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
};

function DiretorioConsultores() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Consultores");
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filtroSL, setFiltroSL] = useState("");
  const [filtroArea, setFiltroArea] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/admin/consultores`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConsultores(data);
        } else {
          setError("Erro ao carregar consultores.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar consultores.");
        setLoading(false);
      });
  }, []);

  const handleTabChange = (label) => {
    setActiveTab(label);
    if (label === "Início")      navigate("/talent");
    if (label === "Conquistas")  navigate("/talent/conquistas");
    if (label === "Catálogo")    navigate("/talent/catalogo");
  };

  const uniqueSL   = [...new Set(consultores.map((c) => c.serviceline).filter(Boolean))];
  const uniqueArea = [...new Set(consultores.map((c) => c.area).filter(Boolean))];

  const filtered = consultores.filter((c) => {
    const matchSearch = c.nome?.toLowerCase().includes(search.toLowerCase());
    const matchSL     = !filtroSL   || c.serviceline === filtroSL;
    const matchArea   = !filtroArea || c.area === filtroArea;
    return matchSearch && matchSL && matchArea;
  });

  return (
    <div className="page-wrapper">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navItems={NAV_ITEMS}
      />

      <div className="diretorio-container">
        <div className="diretorio-header">
          <div>
            <h1>Diretório de Consultores</h1>
            <p>Acompanhe o progresso e a evolução dos consultores.</p>
          </div>
        </div>

        <div className="diretorio-toolbar">
          <div className="diretorio-search">
            <BsSearch size={15} />
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="diretorio-filters">
            <MdFilterList size={20} className="filter-icon" />
            <select value={filtroSL} onChange={(e) => setFiltroSL(e.target.value)}>
              <option value="">Service Line</option>
              {uniqueSL.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
              <option value="">Área</option>
              {uniqueArea.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {loading && (
          <div className="diretorio-status">
            <AiOutlineLoading3Quarters size={32} className="spinner" />
            <p>A carregar consultores...</p>
          </div>
        )}

        {error && (
          <div className="diretorio-status error"><p>{error}</p></div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="diretorio-status">
            <HiOutlineEmojiSad size={40} />
            <p>Nenhum consultor encontrado.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <Container fluid className="px-0">
            <Row xs={1} sm={2} md={3} xl={4} className="g-3">
              {filtered.map((c) => (
                <Col key={c.idutilizador}>
                  <div className="consultor-card h-100">
                    <div className="consultor-foto-wrap">
                      {c.fotourl ? (
                        <img
                          src={c.fotourl}
                          alt={c.nome}
                          className="consultor-foto"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="consultor-foto consultor-foto-iniciais"
                        style={{ display: c.fotourl ? "none" : "flex" }}
                      >
                        {getInitials(c.nome)}
                      </div>
                    </div>

                    <h3 className="consultor-nome">{c.nome}</h3>

                    <div className="consultor-info">
                      {c.serviceline && <p><span>Service Line:</span> {c.serviceline}</p>}
                      {c.area        && <p><span>Área:</span> {c.area}</p>}
                    </div>

                    <div className="consultor-stats">
                      <div className="consultor-stat">
                        <FiUsers size={14} />
                        <span>Badges: <strong>{c.totalbadges ?? 0}</strong></span>
                      </div>
                      <div className="consultor-stat">
                        <BsStarFill size={13} color="#f59e0b" />
                        <span>Pontos: <strong>{c.totalpontos ?? 0}</strong></span>
                      </div>
                    </div>

                    <button
                      className="consultor-btn"
                      onClick={() => navigate(`/talent/consultores/${c.idutilizador}`)}
                    >
                      Ver Perfil
                    </button>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        )}
      </div>
    </div>
  );
}

export default DiretorioConsultores;