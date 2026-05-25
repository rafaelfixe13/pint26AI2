import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles/PagBadge.css";
import "../styles/Candidaturas.css";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsAward } from "react-icons/bs";
import { MdOutlineAssignment } from "react-icons/md";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaMedal } from "react-icons/fa";
import { FiPaperclip, FiX } from "react-icons/fi";
import { API_BASE } from "../api";
import { MdLeaderboard } from "react-icons/md";


function estadoLabel(estado) {
  const e = estado?.toUpperCase();
  if (e === "OPEN")         return { texto: "Por corrigir",    cls: "estado-open" };
  if (e === "SUBMITTED")    return { texto: "Em validação TM", cls: "estado-submitted" };
  if (e === "EM_VALIDACAO") return { texto: "Em validação SL", cls: "estado-em_validacao" };
  if (e === "APPROVED")     return { texto: "Aprovado",        cls: "estado-fechado-aprovado" };
  if (e === "REJECTED")     return { texto: "Rejeitado",       cls: "estado-fechado-rejeitado" };
  return { texto: estado, cls: "" };
}


// Lê um File e devolve { filename, mimetype, base64 }
function lerFicheiroBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      filename: file.name,
      mimetype: file.type || "application/octet-stream",
      base64: reader.result.split(",")[1],
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


// ── Modal de candidatura com upload por requisito ─────────────────
function ModalCandidatura({ badge, utilizador, onFechar, onSubmetido }) {
  // ficheirosReqs: { [idrequisito]: File | null }
  const [ficheirosReqs, setFicheirosReqs] = useState(() =>
    Object.fromEntries((badge.requisitos || []).map((r) => [r.idrequisito, null]))
  );
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const inputRefs = useRef({});

  const temRequisitos = badge.requisitos?.length > 0;

  const handleFileChange = (idrequisito, file) => {
    setFicheirosReqs((prev) => ({ ...prev, [idrequisito]: file || null }));
  };

  const submeter = async () => {
    setErro("");

    // Validação: pelo menos um ficheiro se houver requisitos
    if (temRequisitos) {
      const algumFicheiro = Object.values(ficheirosReqs).some((f) => f !== null);
      if (!algumFicheiro) {
        setErro("Adiciona pelo menos um ficheiro de evidência.");
        return;
      }
    }

    setEnviando(true);
    try {
      // Constrói array de evidências por requisito
      const evidencias = [];
      for (const [idrequisito, file] of Object.entries(ficheirosReqs)) {
        if (!file) continue;
        const b64 = await lerFicheiroBase64(file);
        evidencias.push({ idrequisito: Number(idrequisito), ...b64 });
      }

      const res = await fetch(`${API_BASE}/candidaturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idbadge: badge.idbadge,
          idutilizador: utilizador.idutilizador,
          evidencias,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setErro(data.message || "Erro ao submeter."); return; }
      onSubmetido();
    } catch (err) {
      console.error("Erro no submeter:", err);
      setErro("Não foi possível ligar ao servidor.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-cand-overlay" onClick={onFechar}>
      <div className="modal-cand-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-cand-titulo">Candidatar-me ao badge</h2>
        <p className="modal-cand-sub">
          <strong>{badge.nome}</strong> — Carregue uma evidência por cada requisito.
        </p>

        {temRequisitos ? (
          <div className="modal-cand-requisitos">
            {badge.requisitos.map((req) => {
              const file = ficheirosReqs[req.idrequisito];
              return (
                <div key={req.idrequisito} className="modal-cand-req-row">
                  <div className="modal-cand-req-info">
                    <span className="modal-cand-req-codigo">{req.codigo}</span>
                    <span className="modal-cand-req-titulo">{req.titulo}</span>
                  </div>
                  <div className="modal-cand-req-upload">
                    {file ? (
                      <div className="modal-cand-file">
                        <FiPaperclip size={13} />
                        <span className="modal-cand-file-nome">{file.name}</span>
                        <button
                          className="modal-cand-file-remover"
                          title="Remover"
                          onClick={() => handleFileChange(req.idrequisito, null)}
                        >
                          <FiX size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={(el) => (inputRefs.current[req.idrequisito] = el)}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            handleFileChange(req.idrequisito, e.target.files[0] || null);
                            e.target.value = "";
                          }}
                        />
                        <button
                          className="modal-cand-btn-anexar"
                          onClick={() => inputRefs.current[req.idrequisito]?.click()}
                        >
                          <FiPaperclip size={13} /> Anexar ficheiro
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Badge sem requisitos definidos — upload livre
          <UploadLivre onChange={(files) => {
            // sem requisitos, envia evidências sem idrequisito
            setFicheirosReqs({ _livre: files });
          }} />
        )}

        {erro && <p className="modal-cand-erro">{erro}</p>}

        <div className="modal-cand-acoes">
          <button className="btn-cancelar" onClick={onFechar}>Cancelar</button>
          <button className="btn-submeter" onClick={submeter} disabled={enviando}>
            {enviando ? "A submeter..." : "Submeter candidatura"}
          </button>
        </div>
      </div>
    </div>
  );
}


// Upload livre para badges sem requisitos
function UploadLivre({ onChange }) {
  const [files, setFiles] = useState([]);
  const inputRef = useRef();

  const adicionar = (novos) => {
    setFiles((prev) => {
      const nomes = new Set(prev.map((f) => f.name));
      const merged = [...prev, ...Array.from(novos).filter((f) => !nomes.has(f.name))];
      onChange(merged);
      return merged;
    });
  };

  const remover = (idx) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      onChange(updated);
      return updated;
    });
  };

  return (
    <>
      <div className="modal-cand-dropzone" onClick={() => inputRef.current.click()}>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={(e) => { adicionar(e.target.files); e.target.value = ""; }}
        />
        <p>Clique ou arraste ficheiros aqui (PDF, imagens, documentos)</p>
      </div>
      {files.length > 0 && (
        <div className="modal-cand-files">
          {files.map((f, i) => (
            <div key={i} className="modal-cand-file">
              <FiPaperclip size={13} />
              <span>{f.name}</span>
              <button onClick={() => remover(i)}><FiX size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}


// ── BadgeDetalhe (sem alterações à lógica) ───────────────────────
function BadgeDetalhe() {
  const navigate = useNavigate();
  const { id } = useParams();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");
  const perfilAtivo = Number(localStorage.getItem("perfilAtivo") || "0");
  const isConsultor = perfilAtivo === 1;

  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Catálogo de Badges");
  const [candidatura, setCandidatura] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  const navItems = [
    { label: "Início",             icon: <GoHome size={16} /> },
    { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
    { label: "Os meus badges",     icon: <BsAward size={16} /> },
    { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
    { label: "Rankings",           icon: <MdLeaderboard size={16} /> },
  ];

  useEffect(() => {
    fetch(`${API_BASE}/badges/${id}`)
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => { setBadge(data); setLoading(false); })
      .catch(() => { setError("Erro ao carregar os detalhes do badge."); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!isConsultor || !utilizador) return;
    fetch(`${API_BASE}/candidaturas/badge-estado?idutilizador=${utilizador.idutilizador}&idbadge=${id}`)
      .then((r) => r.json())
      .then((data) => setCandidatura(data || null))
      .catch(() => {});
  }, [id, isConsultor]);

  const voltarParaCatalogo = () => {
    if (perfilAtivo === 1) navigate("/consultor/catalogo");
    else if (perfilAtivo === 2) navigate("/talent/catalogo");
    else if (perfilAtivo === 4) navigate("/admin/utilizadores");
    else navigate("/perfil");
  };

  const handleTabChange = (label) => {
    setActiveTab(label);
    if (label === "Início" || label === "Catálogo de Badges") voltarParaCatalogo();
    if (label === "Candidaturas")   navigate("/consultor/candidaturas");
    if (label === "Os meus badges") navigate("/consultor/OsMeusBadges");
    if (label === "Rankings")       navigate("/consultor/rankings");
  };

  const handleSubmetido = () => {
    setModalAberto(false);
    fetch(`${API_BASE}/candidaturas/badge-estado?idutilizador=${utilizador.idutilizador}&idbadge=${id}`)
      .then((r) => r.json())
      .then((data) => setCandidatura(data || null))
      .catch(() => {});
  };

  const getPointsColor = (pontos) => {
    if (pontos >= 100) return "#7c3aed";
    if (pontos >= 75)  return "#0369a1";
    if (pontos >= 50)  return "#059669";
    return "#d97706";
  };

  const podeCandidar = isConsultor && (
    !candidatura ||
    ["OPEN", "APPROVED", "REJECTED"].includes(candidatura.estado?.toUpperCase())
  );
  const estadoInfo = candidatura ? estadoLabel(candidatura.estado) : null;

  return (
    <div className="page-wrapper">
      {modalAberto && badge && (
        <ModalCandidatura
          badge={badge}
          utilizador={utilizador}
          onFechar={() => setModalAberto(false)}
          onSubmetido={handleSubmetido}
        />
      )}

      <Navbar activeTab={activeTab} onTabChange={handleTabChange} navItems={navItems} />

      <div className="badge-detail-page">
        <button className="back-link" onClick={voltarParaCatalogo}>
          <IoArrowBackOutline size={16} />
          Voltar ao Catálogo
        </button>

        {loading && <div className="badge-detail-status"><p>A carregar detalhes do badge...</p></div>}
        {error   && <div className="badge-detail-status error"><p>{error}</p></div>}

        {!loading && !error && badge && (
          <div className="badge-detail-card">
            <div className="badge-detail-left">
              <div className="badge-detail-icon-wrap">
                {badge.imagemurl ? (
                  <img src={badge.imagemurl} alt={badge.nome} className="badge-detail-img"
                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                ) : null}
                <div className="badge-detail-fallback" style={{ display: badge.imagemurl ? "none" : "flex" }}>
                  <FaMedal size={56} color="#6b9bc7" />
                </div>
              </div>
            </div>

            <div className="badge-detail-center">
              <h1 className="badge-detail-title">{badge.nome}</h1>
              <p className="badge-detail-description">{badge.descricao}</p>

              <div className="badge-detail-info-grid">
                <div className="badge-detail-info-column">
                  {badge.learningpath && <p><span>Learning Path:</span> {badge.learningpath}</p>}
                  {badge.area        && <p><span>Área:</span> {badge.area}</p>}
                </div>
                <div className="badge-detail-info-column">
                  {badge.serviceline && <p><span>Service Line:</span> {badge.serviceline}</p>}
                  {badge.nivel       && <p><span>Nível:</span> {badge.nivel}</p>}
                </div>
              </div>

              {badge.requisitos?.length > 0 && (
                <div className="badge-requisitos-section">
                  <h3 className="badge-requisitos-titulo">
                    Requisitos <span className="badge-requisitos-count">{badge.requisitos.length}</span>
                  </h3>
                  <div className="badge-requisitos-lista">
                    {badge.requisitos.map((req) => (
                      <div key={req.idrequisito} className="badge-req-card">
                        <span className="badge-req-codigo">{req.codigo}</span>
                        <div className="badge-req-info">
                          <p className="badge-req-titulo">{req.titulo}</p>
                          <p className="badge-req-descricao">{req.descricao}</p>
                        </div>
                        {req.imagemurl && (
                          <img src={req.imagemurl} alt={req.titulo} className="badge-req-img" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isConsultor && (
                <div className="badge-cand-section">
                  {estadoInfo && (
                    <div className="badge-cand-estado-wrap">
                      <span>Estado da candidatura:</span>
                      <span className={`estado-badge ${estadoInfo.cls}`}>{estadoInfo.texto}</span>
                    </div>
                  )}
                  {candidatura?.comentario && (
                    <p className="badge-cand-comentario">
                      <strong>Feedback:</strong> {candidatura.comentario}
                    </p>
                  )}
                  {podeCandidar && (
                    <button className="btn-candidatar" onClick={() => setModalAberto(true)}>
                      {candidatura?.estado?.toUpperCase() === "OPEN"
                        ? "Resubmeter candidatura"
                        : "Candidatar-me"}
                    </button>
                  )}
                  {candidatura && !podeCandidar && (
                    <p style={{ fontSize: ".85rem", color: "#6b7280" }}>
                      Candidatura em curso — aguarda validação.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="badge-detail-right">
              {badge.ispublic === false && (
                <span className="badge-tag-special">⭐ Conquista Especial</span>
              )}
              <div className="badge-detail-points" style={{ backgroundColor: getPointsColor(badge.pontos) }}>
                {badge.pontos} Pontos
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BadgeDetalhe;