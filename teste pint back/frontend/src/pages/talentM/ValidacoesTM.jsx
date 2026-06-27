import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/Candidaturas.css";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsTrophy, BsClockHistory, BsBarChart } from "react-icons/bs";
import { MdOutlineVerified } from "react-icons/md";
import { FiUsers, FiDownload } from "react-icons/fi";
import { FaMedal } from "react-icons/fa";
import { API_BASE } from "../../api";
import { NAV_TALENT } from "../../utils/navConfig";

const toDownloadUrl = (url) => url
  ? url.replace('/image/upload/', '/image/upload/fl_attachment/')
       .replace('/video/upload/', '/video/upload/fl_attachment/')
  : url;

function estadoInfo(estado) {
  const e = (estado || "").toUpperCase();
  if (e === "SUBMITTED")    return { texto: "Aguarda validação TM", cls: "estado-submitted" };
  if (e === "EM_VALIDACAO") return { texto: "Em validação SL",      cls: "estado-em_validacao" };
  if (e === "OPEN")         return { texto: "Devolvida",            cls: "estado-open" };
  if (e === "APPROVED")     return { texto: "Aprovada",             cls: "estado-fechado-aprovado" };
  if (e === "REJECTED")     return { texto: "Rejeitada",            cls: "estado-fechado-rejeitado" };
  if (e === "FECHADO")      return { texto: "Fechada",              cls: "estado-fechado-aprovado" };
  return { texto: estado, cls: "" };
}

function ValidacoesTM() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("submitted");
  const [comentarios, setComentarios] = useState({});
  const [processando, setProcessando] = useState(null);
  const [msg, setMsg] = useState("");

  const carregar = () => {
    setLoading(true);
    fetch(`${API_BASE}/candidaturas/tm/lista`)
      .then((r) => r.json())
      .then((data) => {
        setCandidaturas(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    carregar();
  }, []);


  const agir = async (idcandidatura, acao) => {
    const comentario = comentarios[idcandidatura] || "";
    if (acao === "devolver" && !comentario.trim()) {
      setMsg("Indique o motivo de devolução.");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    setProcessando(idcandidatura);
    try {
      const res = await fetch(`${API_BASE}/candidaturas/${idcandidatura}/tm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, comentario, idtm: utilizador.idutilizador }),
      });
      if (res.ok) {
        setMsg(acao === "validar" ? "Enviado para SL." : "Devolvida ao consultor.");
        setTimeout(() => setMsg(""), 3000);
        carregar();
      }
    } finally {
      setProcessando(null);
    }
  };

  const filtradas = candidaturas.filter((c) => {
    const e = (c.estado || "").toUpperCase();
    if (filtro === "submitted") return e === "SUBMITTED";
    if (filtro === "historico") return ["EM_VALIDACAO", "OPEN", "FECHADO", "APPROVED", "REJECTED"].includes(e);
    return true;
  });

  return (
    <div className="page-wrapper">
      <Navbar navItems={NAV_TALENT} />

      <div className="val-page">
        <h1 className="val-titulo">Validações — Talent Manager</h1>
        <p className="val-sub">Valide as evidências dos consultores e envie ao Service Line Leader.</p>

        {msg && (
          <div style={{ marginBottom: "1rem", padding: ".6rem 1rem", background: "#d1fae5",
                        borderRadius: "8px", color: "#065f46", fontWeight: 600 }}>
            {msg}
          </div>
        )}

        <div className="val-filtros">
          <button
            className={`val-filtro-btn ${filtro === "submitted" ? "active" : ""}`}
            onClick={() => setFiltro("submitted")}
          >
            Aguardam validação
          </button>
          <button
            className={`val-filtro-btn ${filtro === "historico" ? "active" : ""}`}
            onClick={() => setFiltro("historico")}
          >
            Histórico
          </button>
        </div>

        {loading && <p style={{ color: "#9ca3af" }}>A carregar...</p>}

        {!loading && filtradas.length === 0 && (
          <div className="val-vazio">
            {filtro === "submitted" ? "Não há candidaturas para validar." : "Sem histórico."}
          </div>
        )}

        <div className="val-lista">
          {filtradas.map((c) => {
            const info = estadoInfo(c.estado);
            const em_historico = (c.estado || "").toUpperCase() !== "SUBMITTED";
            return (
              <div key={c.idcandidatura} className="val-card">
                <div className="val-card-top">
                  {c.badge_imagem ? (
                    <img src={c.badge_imagem} alt={c.badge_nome} className="val-card-img" />
                  ) : (
                    <div className="val-card-fallback"><FaMedal color="#6b9bc7" /></div>
                  )}
                  <div className="val-card-info">
                    <p className="val-card-nome">{c.badge_nome}</p>
                    <p className="val-card-meta">
                      {c.consultor_nome} · {c.consultor_email}
                      {c.serviceline_nome && ` · ${c.serviceline_nome}`}
                      {c.area_nome && ` / ${c.area_nome}`}
                    </p>
                    <p className="val-card-meta">
                      Submetido: {new Date(c.datacriacao).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <span className={`estado-badge ${info.cls}`}>{info.texto}</span>
                </div>

                {c.evidencias?.length > 0 && (
                  <div className="val-card-evidencias">
                    <strong style={{ fontSize: ".8rem", color: "#374151" }}>Evidências: </strong>
                    {c.evidencias.map((e) => (
                      <span key={e.idevidencia} className="val-ev-item">
                        <a href={e.fileurl} target="_blank" rel="noreferrer" className="val-ev-link">
                          {e.filename || "ficheiro"}
                        </a>
                        <a
                          href={toDownloadUrl(e.fileurl)}
                          download={e.filename || "evidencia"}
                          className="val-ev-download"
                          title="Descarregar"
                        >
                          <FiDownload size={13} />
                        </a>
                      </span>
                    ))}
                  </div>
                )}

                {c.comentario && (
                  <p className="val-card-historico">
                    <strong>Comentário anterior:</strong> {c.comentario}
                  </p>
                )}

                {!em_historico && (
                  <div className="val-card-acoes">
                    <textarea
                      placeholder="Comentário (obrigatório ao devolver)"
                      value={comentarios[c.idcandidatura] || ""}
                      onChange={(e) =>
                        setComentarios((p) => ({ ...p, [c.idcandidatura]: e.target.value }))
                      }
                    />
                    <button
                      className="btn-validar"
                      disabled={processando === c.idcandidatura}
                      onClick={() => agir(c.idcandidatura, "validar")}
                    >
                      Validar → SL
                    </button>
                    <button
                      className="btn-devolver"
                      disabled={processando === c.idcandidatura}
                      onClick={() => agir(c.idcandidatura, "devolver")}
                    >
                      Devolver
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ValidacoesTM;