import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { API_BASE } from "../api";

function AlterarPassword() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [form, setForm] = useState({ passwordAtual: "", novaPassword: "", confirmar: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  if (!utilizador) {
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
      setErro("A nova password deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/alterar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: utilizador.id,
          passwordAtual: form.passwordAtual,
          novaPassword: form.novaPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.message || "Erro ao alterar password.");
        return;
      }

      // Atualizar primeirologin no localStorage
      localStorage.setItem("utilizador", JSON.stringify({ ...utilizador, primeirologin: false }));
      navigate("/perfil");
    } catch {
      setErro("Não foi possível ligar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
        <h2 className="auth-title">Alterar password</h2>
        <p className="auth-subtitle">
          É obrigatório definir uma nova password na primeira entrada.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="passwordAtual">Password atual</label>
            <input
              id="passwordAtual"
              name="passwordAtual"
              type="password"
              placeholder="••••••••"
              value={form.passwordAtual}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="novaPassword">Nova password</label>
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
            <label htmlFor="confirmar">Confirmar nova password</label>
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
            {loading ? "A guardar..." : "Guardar nova password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AlterarPassword;
