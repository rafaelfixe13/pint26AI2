import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles/Candidaturas.css";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsBarChart } from "react-icons/bs";
import { MdOutlineVerified, MdLeaderboard } from "react-icons/md";
import { FiUsers, FiDownload } from "react-icons/fi";
import { FaMedal, FaAward } from "react-icons/fa";
import { BsClockHistory, BsChevronDown, BsChevronUp } from "react-icons/bs";
import { gerarCertificadoPDF } from "../utils/certificado";
import { NAV_SL } from "../utils/navConfig";

const fmtDataHora = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// Constrói a linha-do-tempo de um processo de candidatura a partir dos campos existentes.
function construirTimeline(c) {
  const estado = (c.estado || "").toUpperCase();
  const eventos = [];
  eventos.push({ titulo: "Candidatura criada", data: c.datacriacao, cor: "#64748b" });
  if (c.datasubmissao) eventos.push({ titulo: "Evidências submetidas pelo consultor", data: c.datasubmissao, cor: "#2563eb" });
  if (c.tm_nome) eventos.push({ titulo: `Validada pelo Talent Manager (${c.tm_nome})`, data: null, cor: "#0891b2", nota: "Encaminhada para o Service Line" });
  if (estado === "UNDER_REVIEW") eventos.push({ titulo: "A aguardar validação do Service Line", data: null, cor: "#d97706", pendente: true });
  if (estado === "APPROVED") eventos.push({ titulo: "Aprovada pelo Service Line", data: c.dataaprovacao || c.ultimaatualizacao, cor: "#059669", nota: c.comentario });
  if (estado === "REJECTED") eventos.push({ titulo: "Rejeitada pelo Service Line", data: c.datarejeicao || c.ultimaatualizacao, cor: "#dc2626", nota: c.comentario });
  if (estado === "OPEN") eventos.push({ titulo: "Devolvida para revisão", data: c.ultimaatualizacao, cor: "#7c3aed", nota: c.comentario });
  return eventos;
}

const toDownloadUrl = (url) => url
  ? url.replace('/image/upload/', '/image/upload/fl_attachment/')
       .replace('/video/upload/', '/video/upload/fl_attachment/')
  : url;
import { API_BASE } from "../api";

function estadoInfo(estado, resultado) {
  const e = (estado || "").toUpperCase();
  if (e === "UNDER_REVIEW") return { texto: "Aguarda validação SL", cls: "estado-em_validacao" };
  if (e === "APPROVED") return { texto: "Aprovado",  cls: "estado-fechado-aprovado" };
  if (e === "REJECTED") return { texto: "Rejeitado", cls: "estado-fechado-rejeitado" };
  if (e === "OPEN")     return { texto: "Devolvida", cls: "estado-open" };
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
  const [historicoAberto, setHistoricoAberto] = useState({});

  const toggleHistorico = (id) =>
    setHistoricoAberto((p) => ({ ...p, [id]: !p[id] }));

  const carregar = (silencioso = false) => {
    if (!utilizador?.idserviceline) return;
    if (!silencioso) setLoading(true);
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
    const intervalo = setInterval(() => carregar(true), 20000); // status ~tempo real
    return () => clearInterval(intervalo);
  }, []);


  // Gera o certificado em PDF do badge atribuído ao consultor (novo separador)
  const baixarCertificado = (c) => {
    gerarCertificadoPDF({
      nome: c.consultor_nome,
      badgeNome: c.badge_nome,
      nivel: c.nivel_nome,
      area: c.area_nome,
      serviceline: c.serviceline_nome,
      pontos: c.pontos,
      data: c.dataaprovacao || c.ultimaatualizacao,
      idcandidatura: c.idcandidatura,
      imagemurl: c.badge_imagem,
    });
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
    const e = (c.estado || "").toUpperCase();
    if (filtro === "EM_VALIDACAO") return e === "UNDER_REVIEW";
    if (filtro === "historico")    return e === "APPROVED" || e === "REJECTED" || e === "OPEN";
    return true;
  });

  return (
    <div className="page-wrapper">
      <Navbar navItems={NAV_SL} />

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
            const em_historico = (c.estado || "").toUpperCase() !== "UNDER_REVIEW";
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

                {(() => {
                  const aprovado = (c.estado || "").toUpperCase() === "APPROVED";
                  const aberto = !!historicoAberto[c.idcandidatura];
                  return (
                    <div className="val-card-cert">
                      <button
                        className="btn-certificado"
                        disabled={!aprovado}
                        title={aprovado ? "Gerar certificado em PDF" : "Disponível após aprovação"}
                        onClick={() => baixarCertificado(c)}
                      >
                        <FaAward size={14} /> Certificado (PDF)
                      </button>
                      <button
                        className="btn-historico"
                        onClick={() => toggleHistorico(c.idcandidatura)}
                        title="Ver histórico do processo"
                      >
                        <BsClockHistory size={14} /> Histórico
                        {aberto ? <BsChevronUp size={12} /> : <BsChevronDown size={12} />}
                      </button>
                    </div>
                  );
                })()}

                {historicoAberto[c.idcandidatura] && (
                  <div className="val-timeline">
                    {construirTimeline(c).map((ev, i) => (
                      <div key={i} className={`val-tl-item ${ev.pendente ? "pendente" : ""}`}>
                        <span className="val-tl-dot" style={{ background: ev.cor }} />
                        <div className="val-tl-conteudo">
                          <p className="val-tl-titulo">{ev.titulo}</p>
                          {ev.data && <span className="val-tl-data">{fmtDataHora(ev.data)}</span>}
                          {ev.nota && <p className="val-tl-nota">{ev.nota}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
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
