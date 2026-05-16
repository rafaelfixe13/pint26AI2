import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { API_BASE } from "../api";

function DefinirPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [form, setForm] = useState({ novaPassword: "", confirmar: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) {
    navigate("/login");
    return null;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (form.novaPassword !== form.confirmar) {
      setErro("As passwords não coincidem.");
      return;
    }

    if (form.novaPassword.length < 6) {
      setErro("A password deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/definir-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, novaPassword: form.novaPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.message || "Erro ao definir password.");
        return;
      }

      navigate("/login", { state: { sucesso: "Palavra-passe definida! Pode agora fazer login." } });
    } catch {
      setErro("Não foi possível ligar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔑</div>
        <h2 className="auth-title">Definir palavra-passe</h2>
        <p className="auth-subtitle">
          Escolha a sua palavra-passe para ativar a conta.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="novaPassword">Nova palavra-passe</label>
            <input
              id="novaPassword"
              name="novaPassword"
              type="password"
              placeholder="••••••••"
              value={form.novaPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmar">Confirmar palavra-passe</label>
            <input
              id="confirmar"
              name="confirmar"
              type="password"
              placeholder="••••••••"
              value={form.confirmar}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          {erro && <p className="auth-erro">{erro}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "A guardar..." : "Ativar conta"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DefinirPassword;
