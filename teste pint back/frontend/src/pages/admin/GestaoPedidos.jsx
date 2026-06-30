import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import "../../styles/Candidaturas.css";
import { API_BASE } from "../../api";
import { FaMedal } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { BsSearch } from "react-icons/bs";

const toDownloadUrl = (url) => url
  ? url.replace("/image/upload/", "/image/upload/fl_attachment/")
       .replace("/video/upload/", "/video/upload/fl_attachment/")
  : url;

const EM_CURSO = ["SUBMITTED", "UNDER_REVIEW", "OPEN"];

function estadoInfo(estado) {
  const e = (estado || "").toUpperCase();
  if (e === "SUBMITTED")    return { texto: "Em validação TM", cls: "estado-submitted" };
  if (e === "UNDER_REVIEW") return { texto: "Em validação SL", cls: "estado-em_validacao" };
  if (e === "OPEN")         return { texto: "Devolvida",        cls: "estado-open" };
  if (e === "APPROVED")     return { texto: "Aprovado",         cls: "estado-fechado-aprovado" };
  if (e === "REJECTED")     return { texto: "Rejeitado",        cls: "estado-fechado-rejeitado" };
  return { texto: estado, cls: "" };
}

//consulta de todos os pedidos
export default function GestaoPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/candidaturas/tm/lista`)
      .then((r) => r.json())
      .then((d) => { setPedidos(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cont = (pred) => pedidos.filter((c) => pred((c.estado || "").toUpperCase())).length;

  const filtrados = pedidos.filter((c) => {
    const e = (c.estado || "").toUpperCase();
    if (filtro === "curso" && !EM_CURSO.includes(e)) return false;
    if (filtro === "aprovados" && e !== "APPROVED") return false;
    if (filtro === "rejeitados" && e !== "REJECTED") return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.consultor_nome?.toLowerCase().includes(q) ||
      c.consultor_email?.toLowerCase().includes(q) ||
      c.badge_nome?.toLowerCase().includes(q)
    );
  });

  const FILTROS = [
    { id: "todos",      label: `Todos (${pedidos.length})` },
    { id: "curso",      label: `Em curso (${cont((e) => EM_CURSO.includes(e))})` },
    { id: "aprovados",  label: `Atribuídos (${cont((e) => e === "APPROVED")})` },
    { id: "rejeitados", label: `Rejeitados (${cont((e) => e === "REJECTED")})` },
  ];

  return (
    <>
      <AdminNav />
      <div className="val-page">
        <h1 className="val-titulo">Gestão de Pedidos de Badges</h1>
        <p className="val-sub">Consulte todos os pedidos da plataforma - em curso e atribuídos.</p>

        <div className="val-filtros">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              className={`val-filtro-btn ${filtro === f.id ? "active" : ""}`}
              onClick={() => setFiltro(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.5rem 0.8rem", maxWidth: "360px", marginBottom: "1.2rem" }}>
          <BsSearch size={14} color="#94a3b8" />
          <input
            type="text"
            placeholder="Pesquisar por consultor ou badge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", flex: 1, fontSize: "0.9rem", background: "transparent" }}
          />
        </div>

        {loading && <p style={{ color: "#9ca3af" }}>A carregar...</p>}

        {!loading && filtrados.length === 0 && (
          <div className="val-vazio">Sem pedidos para este filtro.</div>
        )}

        <div className="val-lista">
          {filtrados.map((c) => {
            const info = estadoInfo(c.estado);
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
                    <p className="val-card-meta">{c.consultor_nome} · {c.consultor_email}</p>
                    <p className="val-card-meta">
                      Submetido: {new Date(c.datacriacao).toLocaleDateString("pt-PT")}
                      {c.ultimaatualizacao && ` · Atualizado: ${new Date(c.ultimaatualizacao).toLocaleDateString("pt-PT")}`}
                    </p>
                  </div>
                  <span className={`estado-badge ${info.cls}`}>{info.texto}</span>
                </div>

                {c.evidencias?.length > 0 && (
                  <div className="val-card-evidencias">
                    <strong style={{ fontSize: ".8rem", color: "#374151" }}>Evidências: </strong>
                    {c.evidencias.map((e) => (
                      <span key={e.idevidencia} className="val-ev-item">
                        <a href={toDownloadUrl(e.fileurl)} download={e.filename || "evidencia"} target="_blank" rel="noreferrer" className="val-ev-link">
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
                  <p className="val-card-historico"><strong>Comentário:</strong> {c.comentario}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
