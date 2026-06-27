import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/DirConsultoresTM.css";
import { API_BASE } from "../../api";
import { Container, Row, Col } from "react-bootstrap";
import { BsSearch, BsStarFill } from "react-icons/bs";
import { FiUsers } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { HiOutlineEmojiSad } from "react-icons/hi";
import { NAV_TALENT } from "../../utils/navConfig";

const getInitials = (nome) =>
  nome ? nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";

export default function DiretorioConsultores() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceLine, setServiceLine] = useState("");
  const [area, setArea] = useState("");
  const [serviceLinesOptions, setServiceLinesOptions] = useState([]);
  const [areasOptions, setAreasOptions] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [usersRes, rankingRes, slRes] = await Promise.all([
          fetch(`${API_BASE}/admin/utilizadores`).then((r) => r.json()),
          fetch(`${API_BASE}/talent/ranking`).then((r) => r.json()),
          utilizador?.idserviceline
            ? fetch(`${API_BASE}/sl/conquistas?idserviceline=${utilizador.idserviceline}`).then((r) => r.json())
            : Promise.resolve([]),
        ]);

        const users = Array.isArray(usersRes) ? usersRes : usersRes?.data || usersRes?.lista || [];
        const ranking = Array.isArray(rankingRes) ? rankingRes : rankingRes?.ranking || rankingRes?.data || rankingRes?.lista || [];
        const slData = Array.isArray(slRes) ? slRes : [];

        const badgeCounts = await Promise.all(
          users.map((u) =>
            fetch(`${API_BASE}/admin/utilizadores/${u.idutilizador}/badges`)
              .then((r) => r.json())
              .then((hierarquia) => {
                const h = Array.isArray(hierarquia) ? hierarquia : [];
                const total = h.reduce((acc, sl) =>
                  acc + (sl.areas || []).reduce((a2, area) =>
                    a2 + (area.badges || []).filter((b) => b.conquistado).length, 0), 0);
                return { idutilizador: u.idutilizador, totalbadges: total };
              })
              .catch(() => ({ idutilizador: u.idutilizador, totalbadges: 0 }))
          )
        );

        const merged = users.map((u) => {
          const r = ranking.find((x) =>
            String(x?.idutilizador || x?.id_utilizador || x?.id || x?.userId) === String(u.idutilizador)
          );
          const b = badgeCounts.find((x) => String(x.idutilizador) === String(u.idutilizador));
          // Get fotourl from sl/conquistas which returns it correctly
          const sl = slData.find((x) => String(x.idutilizador) === String(u.idutilizador));

          const fotourl = sl?.fotourl || u.fotourl || null;

          return {
            ...u,
            totalbadges: b?.totalbadges ?? 0,
            totalpontos: r?.totalpontos ?? r?.points ?? r?.pontos ?? u.totalpontos ?? u.points ?? u.pontos ?? 0,
            fotourl,
            serviceline: u.serviceline || u.service_line || u.ServiceLine?.nome || r?.serviceline || "",
            area: u.area || u.nomearea || u.Area?.nome || r?.area || ""
          };
        });

        setConsultores(merged);
        setServiceLinesOptions([...new Set(merged.map((c) => c.serviceline).filter(Boolean))]);
        setAreasOptions([...new Set(merged.map((c) => c.area).filter(Boolean))]);
      } catch (err) {
        console.error("Erro ao processar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const limparFiltros = () => {
    setSearch("");
    setServiceLine("");
    setArea("");
  };

  const filtered = consultores.filter((c) => {
    const matchSearch = (c.nome || "").toLowerCase().includes(search.toLowerCase());
    const matchSL = !serviceLine || c.serviceline === serviceLine;
    const matchArea = !area || c.area === area;
    return matchSearch && matchSL && matchArea;
  });

  return (
    <div className="page-wrapper">
      <Navbar navItems={NAV_TALENT} />

      <div className="diretorio-container">
        <div className="diretorio-header">
          <h1>Diretório de Consultores</h1>
        </div>

        <div className="diretorio-filters-wrapper" style={styles.filterWrapper}>
          <div className="diretorio-search" style={styles.searchBox}>
            <BsSearch size={15} style={{ color: "#6b7280", marginRight: "8px" }} />
            <input
              placeholder="Pesquisar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.inputField}
            />
          </div>

          <div className="diretorio-select-filter">
            <select
              value={serviceLine}
              onChange={(e) => setServiceLine(e.target.value)}
              className="filter-dropdown"
              style={styles.selectDropdown}
            >
              <option value="">Todas as Service Lines</option>
              {serviceLinesOptions.map((sl) => (
                <option key={sl} value={sl}>{sl}</option>
              ))}
            </select>
          </div>

          <div className="diretorio-select-filter">
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="filter-dropdown"
              style={styles.selectDropdown}
            >
              <option value="">Todas as Áreas</option>
              {areasOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {(search || serviceLine || area) && (
            <button onClick={limparFiltros} style={styles.clearButton}>
              Limpar Filtros
            </button>
          )}
        </div>

        {loading && (
          <div className="diretorio-status">
            <AiOutlineLoading3Quarters className="spinner" size={30} />
            <p>A carregar...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="diretorio-status">
            <HiOutlineEmojiSad size={35} />
            <p>Sem consultores</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <Container fluid>
            <Row xs={2} sm={3} md={4} lg={5} xl={6} className="g-3">
              {filtered.map((c) => (
                <Col key={c.idutilizador}>
                  <div
                    className="consultor-card"
                    onClick={() => navigate(`/talent/consultores/${c.idutilizador}`)}
                  >
                    <div className="consultor-foto-wrap">
                      {c.fotourl ? (
                        <img
                          className="consultor-foto"
                          src={c.fotourl.startsWith("data:") ? c.fotourl : `data:image/jpeg;base64,${c.fotourl}`}
                          alt={c.nome}
                        />
                      ) : (
                        <div className="consultor-foto-iniciais">
                          {getInitials(c.nome)}
                        </div>
                      )}
                    </div>

                    <h3 className="consultor-nome">{c.nome || "Sem Nome"}</h3>

                    {(c.serviceline || c.area) && (
                      <div className="consultor-info">
                        <p>{[c.serviceline, c.area].filter(Boolean).join(" • ")}</p>
                      </div>
                    )}

                    <div className="consultor-stats">
                      <div className="consultor-stat">
                        <FiUsers size={14} color="#3b82f6" />
                        <span>Badges: <b>{c.totalbadges ?? 0}</b></span>
                      </div>
                      <div className="consultor-stat">
                        <BsStarFill size={13} color="#f59e0b" />
                        <span>Pontos: <b>{c.totalpontos ?? 0}</b></span>
                      </div>
                    </div>
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

const styles = {
  filterWrapper: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "24px",
    padding: "8px 0"
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "6px 12px",
    minWidth: "240px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  },
  inputField: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "14px",
    color: "#374151"
  },
  selectDropdown: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#374151",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    transition: "all 0.2s"
  },
  clearButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #ef4444",
    backgroundColor: "transparent",
    color: "#ef4444",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    height: "38px"
  }
};
