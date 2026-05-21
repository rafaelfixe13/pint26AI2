import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles/Candidaturas.css";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsBarChart } from "react-icons/bs";
import { MdOutlineVerified } from "react-icons/md";
import { FiUsers, FiDownload } from "react-icons/fi";
import { FaMedal } from "react-icons/fa";

const toDownloadUrl = (url) => url
  ? url.replace('/image/upload/', '/image/upload/fl_attachment/')
       .replace('/video/upload/', '/video/upload/fl_attachment/')
  : url;
import { API_BASE } from "../api";

function estadoInfo(estado, resultado) {
  if (estado === "em_validacao") return { texto: "Aguarda validação SL", cls: "estado-em_validacao" };
  if (estado === "fechado" && resultado === "aprovado")  return { texto: "Aprovado",  cls: "estado-fechado-aprovado" };
  if (estado === "fechado" && resultado === "rejeitado") return { texto: "Rejeitado", cls: "estado-fechado-rejeitado" };
  if (estado === "open")        return { texto: "Devolvida",             cls: "estado-open" };
  return { texto: estado, cls: "" };
}

function ValidacoesSL() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("EM_VALIDACAO");
  const [comentarios, setComentarios] = useState({});
  const [processando, setProcessando] = useState(null);
  const [msg, setMsg] = useState("");

  const navItems = [
    { label: "Início",      icon: <GoHome size={16} /> },
    { label: "Validações",  icon: <MdOutlineVerified size={16} /> },
    { label: "Catálogo",    icon: <AiOutlineAppstore size={16} /> },
    { label: "Relatórios",  icon: <BsBarChart size={16} /> },
    { label: "Consultores", icon: <FiUsers size={16} /> },
  ];

  const carregar = () => {
    if (!utilizador?.idserviceline) return;
    setLoading(true);
    fetch(`${API_BASE}/candidaturas/sl/lista?idserviceline=${utilizador.idserviceline}`)
      .then((r) => r.json())
      .then((data) => { setCandidaturas(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    if (!utilizador.idserviceline) {
      navigate("/perfil");
      return;
    }
    carregar();
  }, []);

  const handleTabChange = (label) => {
    if (label === "Início")      navigate("/sl/validacoes");
    if (label === "Validações")  navigate("/sl/validacoes");
    if (label === "Catálogo")    navigate("/consultor");
  };

  const agir = async (idcandidatura, acao) => {
    const comentario = comentarios[idcandidatura] || "";
    if ((acao === "rejeitar" || acao === "sendback") && !comentario.trim()) {
      setMsg("Indique o motivo/comentário.");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    setProcessando(idcandidatura);
    try {
      const res = await fetch(`${API_BASE}/candidaturas/${idcandidatura}/sl`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, comentario, idsl: utilizador.idutilizador }),
      });
      if (res.ok) {
        const textos = { aprovar: "Badge aprovado!", rejeitar: "Candidatura rejeitada.", sendback: "Devolvida ao consultor." };
        setMsg(textos[acao] || "Atualizado.");
        setTimeout(() => setMsg(""), 3000);
        carregar();
      }
    } finally {
      setProcessando(null);
    }
  };

  const filtradas = candidaturas.filter((c) => {
    if (filtro === "EM_VALIDACAO") return c.estado === "em_validacao";
    if (filtro === "historico")    return c.estado === "fechado" || c.estado === "open";
    return true;
  });

  return (
    <div className="page-wrapper">
      <Navbar activeTab="Validações" onTabChange={handleTabChange} navItems={navItems} />

      <div className="val-page">
        <h1 className="val-titulo">Validações — Service Line Leader</h1>
        <p className="val-sub">Realize a validação final das candidaturas da sua Service Line.</p>

        {msg && (
          <div style={{ marginBottom: "1rem", padding: ".6rem 1rem", background: "#d1fae5",
                        borderRadius: "8px", color: "#065f46", fontWeight: 600 }}>
            {msg}
          </div>
        )}

        <div className="val-filtros">
          <button className={`val-filtro-btn ${filtro === "EM_VALIDACAO" ? "active" : ""}`}
                  onClick={() => setFiltro("EM_VALIDACAO")}>
            Aguardam validação
          </button>
          <button className={`val-filtro-btn ${filtro === "historico" ? "active" : ""}`}
                  onClick={() => setFiltro("historico")}>
            Histórico
          </button>
        </div>

        {loading && <p style={{ color: "#9ca3af" }}>A carregar...</p>}

        {!loading && filtradas.length === 0 && (
          <div className="val-vazio">
            {filtro === "EM_VALIDACAO" ? "Não há candidaturas para validar." : "Sem histórico."}
          </div>
        )}

        <div className="val-lista">
          {filtradas.map((c) => {
            const info = estadoInfo(c.estado, c.resultado);
            const em_historico = c.estado !== "EM_VALIDACAO";
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
                      {c.area_nome && ` · Área: ${c.area_nome}`}
                      {c.nivel_nome && ` · Nível: ${c.nivel_nome}`}
                    </p>
                    <p className="val-card-meta">
                      Submetido: {new Date(c.datacriacao).toLocaleDateString("pt-PT")}
                      {c.tm_nome && ` · Validado por TM: ${c.tm_nome}`}
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
                        <a href={toDownloadUrl(e.fileurl)} download={e.filename || "evidencia"}
                           className="val-ev-download" title="Descarregar">
                          <FiDownload size={13} />
                        </a>
                      </span>
                    ))}
                  </div>
                )}

                {c.comentario && (
                  <p className="val-card-historico"><strong>Comentário TM:</strong> {c.comentario}</p>
                )}

                {!em_historico && (
                  <div className="val-card-acoes">
                    <textarea
                      placeholder="Comentário (obrigatório ao rejeitar ou devolver)"
                      value={comentarios[c.idcandidatura] || ""}
                      onChange={(e) => setComentarios((p) => ({ ...p, [c.idcandidatura]: e.target.value }))}
                    />
                    <button className="btn-aprovar"
                            disabled={processando === c.idcandidatura}
                            onClick={() => agir(c.idcandidatura, "aprovar")}>
                      Aprovar
                    </button>
                    <button className="btn-rejeitar"
                            disabled={processando === c.idcandidatura}
                            onClick={() => agir(c.idcandidatura, "rejeitar")}>
                      Rejeitar
                    </button>
                    <button className="btn-sendback"
                            disabled={processando === c.idcandidatura}
                            onClick={() => agir(c.idcandidatura, "sendback")}>
                      Send Back
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

export default ValidacoesSL;
