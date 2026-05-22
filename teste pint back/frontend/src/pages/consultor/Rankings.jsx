import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/Rankings.css";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsTrophy, BsClockHistory } from "react-icons/bs";
import { FiAward } from "react-icons/fi";
import { API_BASE } from "../../api";
import { MdLeaderboard } from "react-icons/md";
import { BsAward } from "react-icons/bs";
import { MdFilterList, MdOutlineAssignment } from "react-icons/md";

  const navItems = [
    { label: "Início",             icon: <GoHome size={16} /> },
    { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
    { label: "Os meus badges",     icon: <BsAward size={16} /> },
    { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
    { label: "Rankings",           icon: <MdLeaderboard size={16} /> },
  ];

function Avatar({ foto, nome, className }) {
  if (foto) {
    const src = foto.startsWith("data:") ? foto : `data:image/jpeg;base64,${foto}`;
    return <img src={src} alt={nome} className={className} />;
  }
  const iniciais = nome
    ? nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
    : "?";
  const placeholderClass = className
    .replace("podio-foto", "podio-foto-placeholder")
    .replace("ranking-foto", "ranking-foto-placeholder");
  return <div className={placeholderClass}>{iniciais}</div>;
}

function Podio({ utilizadores }) {
  const [primeiro, segundo, terceiro] = utilizadores;

  const PodioItem = ({ user, posicao, cls }) => {
    if (!user) return <div className={`podio-item ${cls}`} />;
    const primeiroNome = user.nome.split(" ")[0];
    const segundoNome  = user.nome.split(" ")[1] || "";
    return (
      <div className={`podio-item ${cls}`}>
        <div className="podio-foto-wrap">
          {posicao === 1 && <span className="podio-coroa">👑</span>}
          <Avatar foto={user.fotourl} nome={user.nome} className="podio-foto" />
          <span className="podio-pos-badge">{posicao}</span>
        </div>
        <p className="podio-nome">{primeiroNome}<br />{segundoNome}</p>
        <p className="podio-pontos">{user.pontos}</p>
      </div>
    );
  };

  return (
    <div className="rankings-podio">
      <PodioItem user={segundo}  posicao={2} cls="segundo"  />
      <PodioItem user={primeiro} posicao={1} cls="primeiro" />
      <PodioItem user={terceiro} posicao={3} cls="terceiro" />
    </div>
  );
}

function Rankings() {
  const navigate  = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [ranking,  setRanking]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    fetch(`${API_BASE}/utilizadores/ranking`)
      .then((r) => r.json())
      .then((data) => { setRanking(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleTabChange = (label) => {
    if (label === "Início" || label === "Catálogo de Badges") navigate("/consultor/catalogo");
    if (label === "Os meus badges") navigate("/consultor/badges");
    if (label === "Candidaturas")   navigate("/consultor/candidaturas");
  };

  const top3     = ranking.slice(0, 3);
  const restante = ranking.slice(3);

  return (
    <div className="page-wrapper">
      <Navbar activeTab="Rankings" onTabChange={handleTabChange} navItems={navItems} />

      <div className="rankings-page">
        <div className="rankings-header">
          <h1>🏆 Ranking</h1>
        </div>

        {loading && <p className="rankings-loading">A carregar ranking...</p>}

        {!loading && ranking.length === 0 && (
          <p className="rankings-vazio">Ainda não há dados de ranking.</p>
        )}

        {!loading && ranking.length > 0 && (
          <>
            <Podio utilizadores={top3} />

            <div className="rankings-lista">
              {restante.map((u, i) => {
                const pos   = i + 4;
                const isYou = u.idutilizador === utilizador?.idutilizador;
                return (
                  <div key={u.idutilizador} className={`ranking-row${isYou ? " you" : ""}`}>
                    <div className="ranking-pos">{pos}</div>
                    <Avatar foto={u.fotourl} nome={u.nome} className="ranking-foto" />
                    <span className="ranking-nome">{isYou ? "You" : u.nome}</span>
                    <span className="ranking-pontos">{u.pontos}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Rankings;