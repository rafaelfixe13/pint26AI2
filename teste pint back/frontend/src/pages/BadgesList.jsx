import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/BadgesList.css";
import { API_BASE } from "../api";

function BadgesList() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/badges`)
      .then((res) => res.json())
      .then((data) => {
        setBadges(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar badges");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Carregando badges...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="badges-container">
      <div className="badges-header">
        <h1>Meus Badges</h1>
        <button
          className="badges-logout"
          onClick={() => {
            localStorage.removeItem("utilizador");
            localStorage.removeItem("perfilAtivo");
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>

      <div className="badges-grid">
        {badges.map((badge) => (
          <div key={badge.idbadge} className="badge-item">
            <img className="badge-icon" src={badge.imagemurl} alt={badge.nome} />
            <h3>{badge.nome}</h3>
            <p className="badge-description">{badge.descricao}</p>
            <p className="badge-points">Pontos: {badge.pontos}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BadgesList;
