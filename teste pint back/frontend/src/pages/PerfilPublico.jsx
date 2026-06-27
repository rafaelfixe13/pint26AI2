import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/PerfilPublico.css";
import { API_BASE } from "../api";
import Navbar from "./NavBar";
import { getNavItems } from "../utils/navConfig";
import { BsAward, BsStarFill, BsPatchCheckFill } from "react-icons/bs";
import { FaMedal } from "react-icons/fa";
import { IoArrowBackOutline } from "react-icons/io5";
import { HiOutlineEmojiSad } from "react-icons/hi";

const getPointsColor = (pontos) => {
  if (pontos >= 100) return "#7c3aed";
  if (pontos >= 75)  return "#0369a1";
  if (pontos >= 50)  return "#059669";
  return "#d97706";
};

function PerfilPublico() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/publico/consultor/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setPerfil(data); setLoading(false); })
      .catch(() => { setErro(true); setLoading(false); });
  }, [id]);

  const getInitials = (nome) =>
    nome ? nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";

  const foto = perfil?.fotourl
    ? (perfil.fotourl.startsWith("data:") ? perfil.fotourl : `data:image/jpeg;base64,${perfil.fotourl}`)
    : null;

  const temSessao = !!localStorage.getItem("utilizador");
  const perfilAtivo = localStorage.getItem("perfilAtivo") || "1";
  const totalPontos = (perfil?.badges || []).reduce((s, b) => s + (b.pontos || 0), 0);

  return (
    <div className="pp-container">
      {temSessao ? (
        <Navbar navItems={getNavItems(perfilAtivo)} />
      ) : (
        /* Topo simples para visitantes sem sessão */
        <header className="pp-topbar">
          <span className="pp-logo">Softinsa</span>
          <button className="pp-back" onClick={() => navigate("/login")}>
            <IoArrowBackOutline size={15} /> Entrar
          </button>
        </header>
      )}

      {loading && <div className="pp-status">A carregar perfil…</div>}
      {!loading && erro && (
        <div className="pp-status">
          <HiOutlineEmojiSad size={44} color="#cbd5e1" />
          <p>Perfil não encontrado ou indisponível.</p>
        </div>
      )}

      {!loading && !erro && perfil && (
        <main className="pp-content">
          {/* Cartão de cabeçalho */}
          <section className="pp-hero">
            <div className="pp-hero-cover" />
            <div className="pp-hero-body">
              {foto ? (
                <img src={foto} alt={perfil.nome} className="pp-avatar" />
              ) : (
                <div className="pp-avatar pp-avatar-ini">{getInitials(perfil.nome)}</div>
              )}
              <div className="pp-hero-info">
                <h1 className="pp-name">
                  {perfil.nome}
                  <BsPatchCheckFill size={18} className="pp-verified" title="Perfil verificado pela Softinsa" />
                </h1>
                <div className="pp-chips">
                  <span className="pp-chip pp-chip-role">Consultor</span>
                  {perfil.area && <span className="pp-chip">{perfil.area}</span>}
                  {perfil.serviceline && <span className="pp-chip pp-chip-soft">{perfil.serviceline}</span>}
                </div>
              </div>
              <div className="pp-hero-stats">
                <div className="pp-stat">
                  <span className="pp-stat-num">{perfil.badges?.length || 0}</span>
                  <span className="pp-stat-label">Badges</span>
                </div>
                <div className="pp-stat-divider" />
                <div className="pp-stat">
                  <span className="pp-stat-num">{totalPontos}</span>
                  <span className="pp-stat-label">Pontos</span>
                </div>
              </div>
            </div>
          </section>

          {/* Badges públicos */}
          <h2 className="pp-section-title">
            <BsAward size={18} /> Badges públicos
          </h2>

          {(!perfil.badges || perfil.badges.length === 0) ? (
            <div className="pp-empty">
              <HiOutlineEmojiSad size={40} color="#cbd5e1" />
              <p>Este consultor ainda não tornou nenhum badge público.</p>
            </div>
          ) : (
            <div className="pp-grid">
              {perfil.badges.map((b) => (
                <div
                  key={b.idcandidatura || b.idbadge}
                  className="pp-card pp-card-link"
                  onClick={() => b.idcandidatura && navigate(`/verificar/${b.idcandidatura}`)}
                  title="Ver verificação da credencial"
                >
                  <div className="pp-card-icon">
                    {b.imagemurl ? (
                      <img src={b.imagemurl} alt={b.nome} />
                    ) : (
                      <FaMedal size={32} color="#d97706" />
                    )}
                  </div>
                  <h3 className="pp-card-name">{b.nome}</h3>
                  {b.nivel && <span className="pp-card-meta">{b.nivel}</span>}
                  <div className="pp-card-tags">
                    {b.serviceline && <span className="pp-tag">{b.serviceline}</span>}
                    {b.area && <span className="pp-tag">{b.area}</span>}
                  </div>
                  <span className="pp-card-points" style={{ backgroundColor: getPointsColor(b.pontos) }}>
                    <BsStarFill size={11} /> {b.pontos} pontos
                  </span>
                  {b.dataconquista && (
                    <span className="pp-card-date">
                      {new Date(b.dataconquista).toLocaleDateString("pt-PT")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default PerfilPublico;
