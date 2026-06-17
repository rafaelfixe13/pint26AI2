import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/VerificarBadge.css";
import { API_BASE } from "../api";
import { BsPatchCheckFill, BsStarFill, BsLinkedin } from "react-icons/bs";
import { FaMedal } from "react-icons/fa";
import { FiExternalLink, FiAlertTriangle } from "react-icons/fi";

function VerificarBadge() {
  const { idcandidatura } = useParams();
  const navigate = useNavigate();

  const [cred, setCred] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");
  const isDono = !!(utilizador && cred && Number(utilizador.idutilizador) === Number(cred.consultor_id));

  useEffect(() => {
    fetch(`${API_BASE}/publico/verificar/${idcandidatura}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setCred(data); setLoading(false); })
      .catch(() => { setErro(true); setLoading(false); });
  }, [idcandidatura]);

  const getInitials = (nome) =>
    nome ? nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";

  const foto = cred?.consultor_foto
    ? (cred.consultor_foto.startsWith("data:") ? cred.consultor_foto : `data:image/jpeg;base64,${cred.consultor_foto}`)
    : null;

  const competencias = (cred?.competencias || "")
    .split(/[;,\n]/).map((c) => c.trim()).filter(Boolean);

  const partilharLinkedin = () => {
    const url = window.location.href;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank", "noopener,noreferrer"
    );
  };

  return (
    <div className="vb-container">
      <header className="vb-topbar">
        <span className="vb-logo">Softinsa</span>
      </header>

      {loading && <div className="vb-status">A verificar credencial…</div>}

      {!loading && erro && (
        <div className="vb-status vb-status-erro">
          <FiAlertTriangle size={44} />
          <h2>Credencial não encontrada</h2>
          <p>Este badge não existe, não está aprovado ou não foi tornado público.</p>
        </div>
      )}

      {!loading && !erro && cred && (
        <main className="vb-content">
          <div className="vb-card">
            <div className="vb-verified-banner">
              <BsPatchCheckFill size={16} /> Credencial verificada pela Softinsa
            </div>

            <div className="vb-badge-icon">
              {cred.badge_imagem ? (
                <img src={cred.badge_imagem} alt={cred.badge_nome} />
              ) : (
                <FaMedal size={54} color="#d97706" />
              )}
            </div>

            <h1 className="vb-badge-nome">{cred.badge_nome}</h1>
            {cred.nivel && <span className="vb-badge-nivel">{cred.nivel}</span>}

            <div className="vb-pontos">
              <BsStarFill size={12} /> {cred.pontos} pontos
            </div>

            {/* Atribuído a */}
            <div className="vb-atribuido">
              {foto ? (
                <img src={foto} alt={cred.consultor_nome} className="vb-consultor-foto" />
              ) : (
                <div className="vb-consultor-foto vb-consultor-ini">{getInitials(cred.consultor_nome)}</div>
              )}
              <div className="vb-atribuido-info">
                <span className="vb-atribuido-label">Atribuído a</span>
                <button className="vb-consultor-nome" onClick={() => navigate(`/publico/consultor/${cred.consultor_id}`)}>
                  {cred.consultor_nome}
                </button>
                {cred.dataconquista && (
                  <span className="vb-data">
                    Conquistado em {new Date(cred.dataconquista).toLocaleDateString("pt-PT")}
                  </span>
                )}
              </div>
            </div>

            {/* Detalhes */}
            <div className="vb-detalhes">
              {cred.serviceline && (
                <div className="vb-detalhe"><span>Service Line</span><strong>{cred.serviceline}</strong></div>
              )}
              {cred.area && (
                <div className="vb-detalhe"><span>Área</span><strong>{cred.area}</strong></div>
              )}
            </div>

            {cred.descricao && <p className="vb-descricao">{cred.descricao}</p>}

            {competencias.length > 0 && (
              <div className="vb-competencias">
                <h3>Competências certificadas</h3>
                <div className="vb-comp-tags">
                  {competencias.map((c, i) => <span key={i} className="vb-comp-tag">{c}</span>)}
                </div>
              </div>
            )}

            <div className="vb-acoes">
              <button className="vb-btn vb-btn-perfil" onClick={() => navigate(`/publico/consultor/${cred.consultor_id}`)}>
                <FiExternalLink size={15} /> Ver perfil do consultor
              </button>
              {isDono && (
                <button className="vb-btn vb-btn-linkedin" onClick={partilharLinkedin}>
                  <BsLinkedin size={15} /> Partilhar
                </button>
              )}
            </div>

            <p className="vb-link-nota">
              Esta página é o comprovativo público e verificável desta certificação.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

export default VerificarBadge;
