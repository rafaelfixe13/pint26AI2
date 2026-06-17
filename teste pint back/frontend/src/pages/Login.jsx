import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { API_BASE } from "../api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const mensagemSucesso = location.state?.sucesso || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(localStorage.getItem("lembrar") !== "false");
  const [erro, setErro] = useState("");
  const [emailNaoConfirmado, setEmailNaoConfirmado] = useState(false);
  const [emailPorConfirmar, setEmailPorConfirmar] = useState("");
  const [loading, setLoading] = useState(false);

  // Sessão guardada: salta o login
  useEffect(() => {
    if (localStorage.getItem("utilizador") && localStorage.getItem("lembrar") === "true") {
      navigate("/perfil");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setEmailNaoConfirmado(false);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.emailNaoConfirmado) {
          setEmailNaoConfirmado(true);
          setEmailPorConfirmar(data.email || email);
        } else {
          setErro(data.message || "Erro ao fazer login.");
        }
        return;
      }

      // Primeiro login: redirecionar para confirmar o código enviado por email
      if (data.primeiroLogin) {
        navigate("/confirmar-email", { state: { email: data.email, primeiroLogin: true } });
        return;
      }

      const utilizadorParaGuardar = data.utilizador || data;

      if (!utilizadorParaGuardar.roles || utilizadorParaGuardar.roles.length === 0) {
        utilizadorParaGuardar.roles = utilizadorParaGuardar.idrole
          ? [utilizadorParaGuardar.idrole]
          : [];
      }

      localStorage.setItem("utilizador", JSON.stringify(utilizadorParaGuardar));
      localStorage.setItem("lembrar", lembrar ? "true" : "false");
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
        <h2 className="auth-title">Entrar</h2>
        <p className="auth-subtitle">Aceda à sua conta</p>

        {mensagemSucesso && <p className="auth-sucesso">{mensagemSucesso}</p>}

        <form onSubmit={handleSubmit} noValidate>
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

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <span className="auth-hint">
              Se é o seu primeiro acesso, deixe este campo em branco.
            </span>
          </div>

          <label className="auth-remember">
            <input
              type="checkbox"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
            />
            Manter sessão iniciada
          </label>

          {erro && <p className="auth-erro">{erro}</p>}

          {emailNaoConfirmado && (
            <div className="auth-aviso">
              <p>O seu email ainda não foi confirmado.</p>
              <Link
                to="/confirmar-email"
                state={{ email: emailPorConfirmar }}
                className="auth-link"
              >
                Inserir código de confirmação
              </Link>
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="auth-link-texto">
          <Link to="/recuperar-password" className="auth-link">
            Esqueceu-se da palavra-passe?
          </Link>
        </p>

        <p className="auth-link-texto">
          Não tem conta?{" "}
          <Link to="/register" className="auth-link">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;