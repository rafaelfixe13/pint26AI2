import { useEffect, useState } from "react";
import "../App.css";
import { API_BASE } from "../api";

function Badges() {
  const [badges, setBadges] = useState([]); // aqui guardamos os dados

  useEffect(() => {
    fetch(`${API_BASE}/badges`)
      .then((res) => res.json())
      .then((data) => setBadges(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <div className="sei_la2">
        <h1>Meus Badges</h1>
      </div>

      <div className="badge-card">
        {badges.map((badge) => (
          <div  key={badge.id} className="badgeunico">
            <img className="iconebadge" src={badge.imagemurl} alt={badge.nome} />
            <h3>{badge.nome}</h3>
            <p>{badge.descricao}</p>
            <p>Pontos: {badge.pontos}</p>
          </div>
        ))}
      </div>

      
    </div>
  );
}

export default Badges;
