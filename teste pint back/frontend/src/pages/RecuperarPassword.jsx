import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { API_BASE } from "../api";

function RecuperarPassword() {
  const navigate = useNavigate();
  const [passo, setPasso] = useState(1); // 1 = email, 2 = código + nova password
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaPassword, setNovaPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const pedirCodigo = async (e) => {
    e.preventDefault();
    setErro("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/recuperar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.message || "Erro ao pedir o código."); return; }
      setInfo(data.message || "Código enviado para o seu email.");
      setPasso(2);
    } catch {
      setErro("Não foi possível ligar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const redefinir = async (e) => {
    e.preventDefault();
    setErro("");
    if (novaPassword !== confirmar) { setErro("As passwords não coincidem."); return; }
    if (novaPassword.length < 6) { setErro("A password deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/redefinir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, novaPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.message || "Erro ao redefinir a password."); return; }
      navigate("/login", { state: { sucesso: "A sua password foi redefinida com sucesso." } });
    } catch {
      setErro("Não foi possível ligar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Recuperar palavra-passe</h2>
        <p className="auth-subtitle">
          {passo === 1
            ? "Indique o seu email para receber um código."
            : "Introduza o código recebido e a nova palavra-passe."}
        </p>

        {info && <p className="auth-sucesso">{info}</p>}

        {passo === 1 ? (
          <form onSubmit={pedirCodigo} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="exemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {erro && <p className="auth-erro">{erro}</p>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "A enviar..." : "Enviar código"}
            </button>
          </form>
        ) : (
          <form onSubmit={redefinir} noValidate>
            <div className="auth-field">
              <label htmlFor="codigo">Código</label>
              <input
                id="codigo"
                type="text"
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="novaPassword">Nova palavra-passe</label>
              <input
                id="novaPassword"
                type="password"
                placeholder="••••••••"
                value={novaPassword}
                onChange={(e) => setNovaPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirmar">Confirmar palavra-passe</label>
              <input
                id="confirmar"
                type="password"
                placeholder="••••••••"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {erro && <p className="auth-erro">{erro}</p>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "A redefinir..." : "Redefinir palavra-passe"}
            </button>

            <button
              type="button"
              className="auth-link"
              style={{ background: "none", border: "none", marginTop: "0.75rem", cursor: "pointer" }}
              onClick={() => { setPasso(1); setErro(""); }}
            >
              ← Usar outro email
            </button>
          </form>
        )}

        <p className="auth-link-texto">
          Lembrou-se?{" "}
          <Link to="/login" className="auth-link">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}

export default RecuperarPassword;
