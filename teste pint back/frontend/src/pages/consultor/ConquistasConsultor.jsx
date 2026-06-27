import { useEffect, useState } from "react";
import Navbar from "../NavBar";
import "../../styles/ConquistasTM.css";
import { API_BASE } from "../../api";
import { Container, Row, Col } from "react-bootstrap";
import { NAV_CONSULTOR } from "../../utils/navConfig";

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsTrophy } from "react-icons/bs";
import { HiOutlineEmojiSad } from "react-icons/hi";

function ConquistasConsultor() {
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

  return (
    <div className="page-wrapper">
      <Navbar navItems={NAV_CONSULTOR} />

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
