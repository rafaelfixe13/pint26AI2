import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/ConquistasTM.css";
import { API_BASE } from "../../api";
import { Container, Row, Col } from "react-bootstrap";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore, AiOutlineLoading3Quarters } from "react-icons/ai";
import { MdOutlineVerified } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { BsTrophy, BsClockHistory, BsBarChart } from "react-icons/bs";
import { HiOutlineEmojiSad } from "react-icons/hi";
import { NAV_TALENT } from "../../utils/navConfig";

const getInitials = (nome) => {
  if (!nome) return "?";
  return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
};

const MEDAL_COLORS = ["#f59e0b", "#9ca3af", "#b45309"];

function ConquistasTM() {
  const [conquistas, setConquistas] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loadingConquistas, setLoadingConquistas] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [filtroSL, setFiltroSL] = useState("");
  const [filtroArea, setFiltroArea] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/talent/badgesespeciais`)
      .then((res) => res.json())
      .then((data) => {
        setConquistas(Array.isArray(data) ? data : []);
        setLoadingConquistas(false);
      })
      .catch(() => setLoadingConquistas(false));

    fetch(`${API_BASE}/talent/ranking`)
      .then((res) => res.json())
      .then((data) => {
        setRanking(Array.isArray(data) ? data : []);
        setLoadingRanking(false);
      })
      .catch(() => setLoadingRanking(false));
  }, []);

  const uniqueSL   = [...new Set(ranking.map((r) => r.serviceline).filter(Boolean))];
  const uniqueArea = [...new Set(ranking.map((r) => r.area).filter(Boolean))];

  const filteredRanking = ranking.filter((r) => {
    const matchSL   = !filtroSL   || r.serviceline === filtroSL;
    const matchArea = !filtroArea || r.area === filtroArea;
    return matchSL && matchArea;
  });

  return (
    <div className="page-wrapper">
      <Navbar navItems={NAV_TALENT} />

      <div className="conquistas-container">

        <div className="conquistas-header">
          <h1>Sistema de Conquistas e Ranking</h1>
          <p>Acompanhe as conquistas especiais e o ranking de pontuação dos consultores.</p>
        </div>

        {/* Conquistas Especiais */}
        <section className="conquistas-section">
          <h2 className="section-title">Conquistas Especiais Ativas</h2>

          {loadingConquistas && (
            <div className="conquistas-status">
              <AiOutlineLoading3Quarters size={28} className="spinner" />
              <p>A carregar conquistas...</p>
            </div>
          )}

          {!loadingConquistas && conquistas.length === 0 && (
            <div className="conquistas-status">
              <HiOutlineEmojiSad size={36} />
              <p>Nenhuma conquista especial ativa.</p>
            </div>
          )}

          {!loadingConquistas && conquistas.length > 0 && (
            <Container fluid className="px-0">
              <Row xs={1} sm={2} md={3} className="g-3">
                {conquistas.map((c) => (
                  <Col key={c.idbadgeespecial}>
                    <div className="conquista-card h-100">
                      <div className="conquista-card-topo">
                        <div className="conquista-icon-wrap">
                          <BsTrophy size={28} className="conquista-icon" />
                        </div>
                      </div>
                      <div className="conquista-card-body">
                        <div className="conquista-titulo-row">
                          <h3>{c.nome}</h3>
                          <span className="conquista-badge-ativa">ATIVA</span>
                        </div>
                        <p className="conquista-descricao">{c.descricao}</p>
                        <div className="conquista-recompensa">
                          <span>Recompensa:</span>
                          <strong>+{c.pontos} Pontos Bónus</strong>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Container>
          )}
        </section>

        {/*  Ranking Global  */}
        <section className="conquistas-section">
          <div className="ranking-header-row">
            <h2 className="section-title">Ranking Global de Consultores</h2>
            <div className="ranking-filters">
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

          {loadingRanking && (
            <div className="conquistas-status">
              <AiOutlineLoading3Quarters size={28} className="spinner" />
              <p>A carregar ranking...</p>
            </div>
          )}

          {!loadingRanking && filteredRanking.length === 0 && (
            <div className="conquistas-status">
              <HiOutlineEmojiSad size={36} />
              <p>Sem resultados para os filtros selecionados.</p>
            </div>
          )}

          {!loadingRanking && filteredRanking.length > 0 && (
            <div className="ranking-table-wrap">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Consultor</th>
                    <th>Pontos Totais</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRanking.map((r, index) => (
                    <tr key={r.idutilizador} className={index < 3 ? "top-row" : ""}>
                      <td>
                        <div
                          className="posicao-badge"
                          style={{
                            background: index < 3 ? MEDAL_COLORS[index] : "#e5e7eb",
                            color: index < 3 ? "#fff" : "#374151",
                          }}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td>
                        <div className="consultor-cell">
                          {r.fotourl ? (
                            <img
                              src={r.fotourl.startsWith("data:") ? r.fotourl : `data:image/jpeg;base64,${r.fotourl}`}
                              alt={r.nome}
                              className="consultor-avatar"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="consultor-avatar consultor-avatar-iniciais"
                            style={{ display: r.fotourl ? "none" : "flex" }}
                          >
                            {getInitials(r.nome)}
                          </div>
                          <span>{r.nome}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`pontos-chip ${index === 0 ? "pontos-top" : ""}`}>
                          {r.pontos ?? 0} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default ConquistasTM;
