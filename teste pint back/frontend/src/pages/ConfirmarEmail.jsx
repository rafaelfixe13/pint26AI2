import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/ConfirmarEmail.css";
import { API_BASE } from "../api";

function ConfirmarEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [digitos, setDigitos] = useState(["", "", "", "", "", ""]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (index, valor) => {
    if (!/^\d?$/.test(valor)) return;

    const novos = [...digitos];
    novos[index] = valor;
    setDigitos(novos);

    if (valor && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digitos[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const texto = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (texto.length === 6) {
      setDigitos(texto.split(""));
      inputs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    const codigo = digitos.join("");
    if (codigo.length < 6) {
      setErro("Introduza os 6 dígitos do código.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.message || "Código inválido.");
        return;
      }

      navigate("/login", { state: { sucesso: "Email confirmado! Pode fazer login." } });
    } catch {
      setErro("Não foi possível ligar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="confirmar-wrapper">
      <div className="confirmar-card">
        <div className="confirmar-icone">📬</div>
        <h2 className="confirmar-titulo">Confirme o seu email</h2>
        <p className="confirmar-subtitulo">
          Enviámos um código de 6 dígitos para<br />
          <strong>{email || "o seu email"}</strong>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="confirmar-digitos" onPaste={handlePaste}>
            {digitos.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="confirmar-digito"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {erro && <p className="confirmar-erro">{erro}</p>}

          <button type="submit" className="confirmar-btn" disabled={loading}>
            {loading ? "A verificar..." : "Confirmar"}
          </button>
        </form>

        <p className="confirmar-info">
          Não recebeu o email? Verifique a pasta de spam.
        </p>
      </div>
    </div>
  );
}

export default ConfirmarEmail;
