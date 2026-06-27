import "../styles/Celebracao.css";
import { BsStarFill } from "react-icons/bs";
import { marcoIcone } from "../utils/marcoIcone";

const CORES = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

export default function CelebracaoModal({ marco, onClose }) {
  return (
    <div className="cel-overlay" onClick={onClose}>
      <div className="cel-confetti" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="cel-piece"
            style={{
              left: `${(i / 40) * 100}%`,
              background: CORES[i % CORES.length],
              animationDelay: `${(i % 10) * 0.15}s`,
              animationDuration: `${2.5 + (i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="cel-card" onClick={(e) => e.stopPropagation()}>
        <div className="cel-emoji">{marcoIcone(marco.icon)}</div>
        <span className="cel-kicker">Marco Alcançado!</span>
        <h2 className="cel-titulo">{marco.titulo}</h2>
        <p className="cel-sub">{marco.descricao}</p>
        <div className="cel-stars" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}><BsStarFill /></span>
          ))}
        </div>
        <button className="cel-btn" onClick={onClose}>Continuar</button>
      </div>
    </div>
  );
}
