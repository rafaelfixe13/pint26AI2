import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/Rankings.css";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsTrophy, BsTrophyFill, BsAward, BsStarFill } from "react-icons/bs";
import { MdLeaderboard, MdOutlineAssignment } from "react-icons/md";
import { FiClock } from "react-icons/fi";
import { API_BASE } from "../../api";

const NAV_ITEMS = [
  { label: "Início",             icon: <GoHome size={16} /> },
  { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
  { label: "Os meus badges",     icon: <BsAward size={16} /> },
  { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
  { label: "Conquistas",         icon: <BsTrophy size={16} /> },
  { label: "Rankings",           icon: <MdLeaderboard size={16} /> },
  { label: "Lembretes",          icon: <FiClock size={16} /> },
];

function Avatar({ foto, nome, className, phClassName }) {
  if (foto) {
    const src = foto.startsWith("data:") ? foto : `data:image/jpeg;base64,${foto}`;
    return <img src={src} alt={nome} className={className} />;
  }
  const iniciais = nome
    ? nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
    : "?";
  return <div className={phClassName || className}>{iniciais}</div>;
}

function PodioCard({ user, posicao }) {
  if (!user) return <div className={`rk-pod rk-pod-${posicao} rk-pod-vazio`} />;
  return (
    <div className={`rk-pod rk-pod-${posicao}`}>
      <div className="rk-pod-info">
        {posicao === 1 && <span className="rk-crown">👑</span>}
        <Avatar
          foto={user.fotourl}
          nome={user.nome}
          className="rk-pod-avatar"
          phClassName="rk-pod-avatar rk-pod-avatar-ph"
        />
        <span className="rk-pod-nome">{user.nome}</span>
        <span className="rk-pod-pts"><BsStarFill size={11} /> {user.pontos} pts</span>
      </div>
      <div className="rk-pod-base">
        <span className="rk-pod-rank">{posicao}</span>
      </div>
    </div>
  );
}

function Rankings() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [activeTab, setActiveTab] = useState("Rankings");
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    fetch(`${API_BASE}/utilizadores/ranking`)
      .then((r) => r.json())
      .then((data) => { setRanking(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleTabChange = (label) => {
    setActiveTab(label);
    if (label === "Início")             navigate("/consultor");
    if (label === "Catálogo de Badges") navigate("/consultor/catalogo");
    if (label === "Os meus badges")     navigate("/consultor/badges");
    if (label === "Candidaturas")       navigate("/consultor/candidaturas");
    if (label === "Conquistas")         navigate("/consultor/conquistas");
    if (label === "Rankings")           navigate("/consultor/rankings");
    if (label === "Lembretes")          navigate("/consultor/lembretes");
  };

  const [primeiro, segundo, terceiro] = ranking;
  const restante = ranking.slice(3);
  const minhaPos = ranking.findIndex((u) => u.idutilizador === utilizador?.idutilizador) + 1;

  return (
    <div className="rk-container">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} navItems={NAV_ITEMS} />

      <main className="rk-wrap">
        {/* Hero */}
        <section className="rk-hero">
          <div className="rk-hero-cover" />
          <div className="rk-hero-body">
            <div className="rk-hero-text">
              <span className="rk-hero-icon"><BsTrophyFill size={22} /></span>
              <div>
                <h1>Ranking de Consultores</h1>
                <p>Os consultores com mais pontos na plataforma.</p>
              </div>
            </div>
            {minhaPos > 0 && (
              <div className="rk-minha-pos">
                <span className="rk-minha-pos-label">A tua posição</span>
                <span className="rk-minha-pos-num">#{minhaPos}</span>
              </div>
            )}
          </div>
        </section>

        {loading && <p className="rk-status">A carregar ranking…</p>}
        {!loading && ranking.length === 0 && (
          <p className="rk-status">Ainda não há dados de ranking.</p>
        )}

        {!loading && ranking.length > 0 && (
          <>
            {/* Pódio top 3 */}
            <section className="rk-podium">
              <PodioCard user={segundo}  posicao={2} />
              <PodioCard user={primeiro} posicao={1} />
              <PodioCard user={terceiro} posicao={3} />
            </section>

            {/* Restante lista */}
            {restante.length > 0 && (
              <section className="rk-list">
                {restante.map((u, i) => {
                  const pos = i + 4;
                  const isYou = u.idutilizador === utilizador?.idutilizador;
                  return (
                    <div key={u.idutilizador} className={`rk-row${isYou ? " you" : ""}`}>
                      <span className="rk-row-pos">{pos}</span>
                      <Avatar
                        foto={u.fotourl}
                        nome={u.nome}
                        className="rk-row-avatar"
                        phClassName="rk-row-avatar rk-row-avatar-ph"
                      />
                      <span className="rk-row-nome">{u.nome}{isYou && <span className="rk-tu">Tu</span>}</span>
                      <span className="rk-row-pts">{u.pontos} pts</span>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Rankings;
