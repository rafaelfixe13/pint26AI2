import "../styles/Celebracao.css";

const CORES = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

export default function CelebracaoModal({ marco, onClose }) {
  let mensagem;
  if (marco.tipo === "badges") {
    mensagem = `Conquistaste ${marco.valor} ${marco.valor === 1 ? "badge" : "badges"}!`;
  } else if (marco.tipo === "pontos") {
    mensagem = `Atingiste ${marco.valor} pontos!`;
  } else {
    mensagem = "Estás em 1º lugar no ranking! 🏆";
  }

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
        <div className="cel-emoji">🎉</div>
        <h2 className="cel-titulo">Parabéns!</h2>
        <p className="cel-msg">{mensagem}</p>
        <p className="cel-sub">Continua assim — cada badge conta para o teu percurso.</p>
        <button className="cel-btn" onClick={onClose}>Continuar</button>
      </div>
    </div>
  );
}
