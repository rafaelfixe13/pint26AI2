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

  // Mudança de password obrigatória no primeiro acesso (password temporária)
  const [mudarPwd, setMudarPwd] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [novaPwd, setNovaPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdErro, setPwdErro] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

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

      // Password temporária: obrigar a definir nova password antes de entrar
      if (data.mudarPassword) {
        setPendingUser(utilizadorParaGuardar);
        setMudarPwd(true);
        return;
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

  const handleMudarPassword = async (e) => {
    e.preventDefault();
    setPwdErro("");
    if (novaPwd.length < 6) { setPwdErro("A palavra-passe deve ter pelo menos 6 caracteres."); return; }
    if (novaPwd !== confirmPwd) { setPwdErro("As palavras-passe não coincidem."); return; }

    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/alterar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pendingUser.idutilizador || pendingUser.id,
          passwordAtual: password,   // a password temporária usada no login
          novaPassword: novaPwd,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPwdErro(data.message || "Erro ao alterar a palavra-passe."); return; }

      localStorage.setItem("utilizador", JSON.stringify({ ...pendingUser, primeirologin: false }));
      localStorage.setItem("lembrar", lembrar ? "true" : "false");
      navigate("/perfil");
    } catch {
      setPwdErro("Não foi possível ligar ao servidor.");
    } finally {
      setPwdLoading(false);
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

      {mudarPwd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="auth-card" style={{ maxWidth: "420px", width: "100%", margin: 0 }}>
            <h2 className="auth-title">Definir nova palavra-passe</h2>
            <p className="auth-subtitle">É o seu primeiro acesso. Defina uma palavra-passe para continuar.</p>
            <form onSubmit={handleMudarPassword} noValidate>
              <div className="auth-field">
                <label htmlFor="nova-pwd">Nova palavra-passe</label>
                <input id="nova-pwd" type="password" placeholder="••••••••" value={novaPwd}
                       onChange={(e) => setNovaPwd(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="auth-field">
                <label htmlFor="conf-pwd">Confirmar palavra-passe</label>
                <input id="conf-pwd" type="password" placeholder="••••••••" value={confirmPwd}
                       onChange={(e) => setConfirmPwd(e.target.value)} autoComplete="new-password" />
              </div>
              {pwdErro && <p className="auth-erro">{pwdErro}</p>}
              <button type="submit" className="auth-btn" disabled={pwdLoading}>
                {pwdLoading ? "A guardar..." : "Guardar e entrar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;