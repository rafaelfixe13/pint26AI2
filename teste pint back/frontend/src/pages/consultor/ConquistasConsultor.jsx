import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/ConquistasTM.css";
import { API_BASE } from "../../api";
import { Container, Row, Col } from "react-bootstrap";

import { GoHome } from "react-icons/go";
import { AiOutlineAppstore, AiOutlineLoading3Quarters } from "react-icons/ai";
import { MdOutlineAssignment, MdLeaderboard } from "react-icons/md";
import { BsAward, BsTrophy } from "react-icons/bs";
import { HiOutlineEmojiSad } from "react-icons/hi";

const NAV_ITEMS = [
  { label: "Início",             icon: <GoHome size={16} /> },
  { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
  { label: "Os meus badges",     icon: <BsAward size={16} /> },
  { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
  { label: "Conquistas",         icon: <BsTrophy size={16} /> },
  { label: "Rankings",           icon: <MdLeaderboard size={16} /> },
];

function ConquistasConsultor() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Conquistas");
  const [conquistas, setConquistas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/talent/badgesespeciais`)
      .then((res) => res.json())
      .then((data) => {
        setConquistas(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleTabChange = (label) => {
    setActiveTab(label);
    if (label === "Início")             navigate("/consultor");
    if (label === "Catálogo de Badges") navigate("/consultor/catalogo");
    if (label === "Os meus badges")     navigate("/consultor/badges");
    if (label === "Candidaturas")       navigate("/consultor/candidaturas");
    if (label === "Conquistas")         navigate("/consultor/conquistas");
    if (label === "Rankings")           navigate("/consultor/rankings");
  };

  return (
    <div className="page-wrapper">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} navItems={NAV_ITEMS} />

      <div className="conquistas-container">

        <div className="conquistas-header">
          <h1>Conquistas Especiais</h1>
          <p>Distinções premium que reconhecem marcos e certificações de destaque.</p>
        </div>

        <section className="conquistas-section">
          <h2 className="section-title">Conquistas Especiais</h2>

          {loading && (
            <div className="conquistas-status">
              <AiOutlineLoading3Quarters size={28} className="spinner" />
              <p>A carregar conquistas...</p>
            </div>
          )}

          {!loading && conquistas.length === 0 && (
            <div className="conquistas-status">
              <HiOutlineEmojiSad size={36} />
              <p>Nenhuma conquista especial disponível.</p>
            </div>
          )}

          {!loading && conquistas.length > 0 && (
            <Container fluid className="px-0">
              <Row xs={1} sm={2} md={3} className="g-3">
                {conquistas.map((c) => (
                  <Col key={c.idespecial}>
                    <div className="conquista-card h-100">
                      <div className="conquista-card-topo">
                        <div className="conquista-icon-wrap">
                          <BsTrophy size={28} className="conquista-icon" />
                        </div>
                      </div>
                      <div className="conquista-card-body">
                        <div className="conquista-titulo-row">
                          <h3>{c.nome}</h3>
                          {c.ativo !== false && (
                            <span className="conquista-badge-ativa">ATIVA</span>
                          )}
                        </div>
                        <p className="conquista-descricao">{c.descricao}</p>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Container>
          )}
        </section>

      </div>
    </div>
  );
}

export default ConquistasConsultor;
