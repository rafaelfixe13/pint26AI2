import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { API_BASE } from "../api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", password: "", confirmar: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (form.password !== form.confirmar) {
      setErro("As passwords não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.message || "Erro ao criar conta.");
        return;
      }

      navigate("/confirmar-email", { state: { email: form.email } });
    } catch {
      setErro("Não foi possível ligar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Criar conta</h2>
        <p className="auth-subtitle">Registe-se para aceder à plataforma</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              name="nome"
              type="text"
              placeholder="João Silva"
              value={form.nome}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="exemplo@empresa.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmar">Confirmar password</label>
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
            {loading ? "A criar conta..." : "Criar conta"}
          </button>
        </form>

        <p className="auth-link-texto">
          Já tem conta?{" "}
          <Link to="/login" className="auth-link">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
