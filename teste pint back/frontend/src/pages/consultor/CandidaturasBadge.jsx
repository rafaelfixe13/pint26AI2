import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/Candidaturas.css";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsAward } from "react-icons/bs";
import { MdOutlineAssignment } from "react-icons/md";
import { FaMedal } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { API_BASE } from "../../api";
import { MdLeaderboard } from "react-icons/md";

const toDownloadUrl = (url) => url
  ? url.replace('/image/upload/', '/image/upload/fl_attachment/')
       .replace('/video/upload/', '/video/upload/fl_attachment/')
  : url;

function estadoInfo(estado, resultado) {
  if (estado === "open")         return { texto: "Por corrigir",    cls: "estado-open" };
  if (estado === "submitted")    return { texto: "Em validação TM", cls: "estado-submitted" };
  if (estado === "em_validacao") return { texto: "Em validação SL", cls: "estado-em_validacao" };
  if (estado === "fechado" && resultado === "aprovado")  return { texto: "Aprovado",  cls: "estado-fechado-aprovado" };
  if (estado === "fechado" && resultado === "rejeitado") return { texto: "Rejeitado", cls: "estado-fechado-rejeitado" };
  return { texto: estado, cls: "" };
}

function CandidaturasBadge() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  const navItems = [
    { label: "Início",             icon: <GoHome size={16} /> },
    { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
    { label: "Os meus badges",     icon: <BsAward size={16} /> },
    { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
    { label: "Rankings",           icon: <MdLeaderboard size={16} /> },
  ];

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    fetch(`${API_BASE}/candidaturas/minhas?idutilizador=${utilizador.idutilizador}`)
      .then((r) => r.json())
      .then((data) => { setCandidaturas(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleTabChange = (label) => {
    if (label === "Início" || label === "Catálogo de Badges") navigate("/consultor/catalogo");
    if (label === "Os meus badges") navigate("/consultor");
    if (label === "Rankings")       navigate("/consultor/rankings");
  };

  const filtradas = candidaturas.filter((c) => {
    if (filtro === "todos") return true;
    if (filtro === "ativas") return ["open", "submitted", "em_validacao"].includes(c.estado);
    if (filtro === "concluidas") return c.estado === "fechado";
    return true;
  });

  return (
    <div className="page-wrapper">
      <Navbar activeTab="Candidaturas" onTabChange={handleTabChange} navItems={navItems} />

      <div className="cand-page">
        <h1 className="cand-titulo">As minhas candidaturas</h1>

        <div className="val-filtros">
          {[
            { key: "todos",     label: "Todas" },
            { key: "ativas",    label: "Em curso" },
            { key: "concluidas",label: "Concluídas" },
          ].map((f) => (
            <button
              key={f.key}
              className={`val-filtro-btn ${filtro === f.key ? "active" : ""}`}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: "#9ca3af" }}>A carregar...</p>}

        {!loading && filtradas.length === 0 && (
          <div className="val-vazio">Nenhuma candidatura encontrada.</div>
        )}

        <div className="cand-lista">
          {filtradas.map((c) => {
            const info = estadoInfo(c.estado, c.resultado);
            return (
              <div key={c.idcandidatura} className="cand-card">
                {c.badge_imagem ? (
                  <img src={c.badge_imagem} alt={c.badge_nome} className="cand-card-img" />
                ) : (
                  <div className="cand-card-fallback"><FaMedal color="#6b9bc7" /></div>
                )}
                <div className="cand-card-info">
                  <p className="cand-card-nome"
                     style={{ cursor: "pointer" }}
                     onClick={() => navigate(`/badges/${c.idbadge}`)}>
                    {c.badge_nome}
                  </p>
                  <p className="cand-card-data">
                    Submetido em {new Date(c.datacriacao).toLocaleDateString("pt-PT")}
                    {c.badge_pontos != null && ` · ${c.badge_pontos} pts`}
                  </p>
                  {c.comentario && (
                    <p className="cand-card-comentario">
                      <strong>Feedback:</strong> {c.comentario}
                    </p>
                  )}
                  {c.evidencias?.length > 0 && (
                    <div style={{ marginTop: ".4rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                      {c.evidencias.map((e) => (
                        <span key={e.idevidencia} className="val-ev-item">
                          <a href={e.fileurl} target="_blank" rel="noreferrer" className="val-ev-link">
                            {e.filename || "Evidência"}
                          </a>
                          <a href={toDownloadUrl(e.fileurl)} download={e.filename || "evidencia"}
                             className="val-ev-download" title="Descarregar">
                            <FiDownload size={13} />
                          </a>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`estado-badge ${info.cls}`}>{info.texto}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CandidaturasBadge;
