import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { API_BASE } from "../api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", idarea: "" });
  const [areas, setAreas] = useState([]);
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/auth/areas`)
      .then((r) => r.json())
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch(() => setAreas([]));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!form.idarea) {
      setErro("Selecione a sua área.");
      return;
    }

    setLoading(true);

    try {
      const areaSel = areas.find((a) => String(a.idarea) === String(form.idarea));
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          idarea: Number(form.idarea),
          idserviceline: areaSel?.idserviceline ?? null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.message || "Erro ao criar conta.");
        return;
      }

      localStorage.setItem("lembrar", lembrar ? "true" : "false");
      navigate("/confirmar-email", { state: { email: form.email, primeiroLogin: true } });
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
            <label htmlFor="idarea">Área</label>
            <select
              id="idarea"
              name="idarea"
              value={form.idarea}
              onChange={handleChange}
              required
            >
              <option value="">Selecione a sua área</option>
              {areas.map((a) => (
                <option key={a.idarea} value={a.idarea}>
                  {a.serviceline ? `${a.serviceline} — ${a.nome}` : a.nome}
                </option>
              ))}
            </select>
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

          <p className="auth-nota">
            Após o registo, irá receber um código por email para confirmar a conta e definir a palavra-passe.
          </p>

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
