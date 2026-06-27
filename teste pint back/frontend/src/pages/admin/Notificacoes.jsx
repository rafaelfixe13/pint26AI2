import { useEffect, useMemo, useState } from "react";
import AdminNav from "./AdminNav";
import "../../styles/AdminRelatorios.css";
import "../../styles/Notificacoes.css";
import { API_BASE } from "../../api";
import { BsBell, BsSend, BsPeople, BsPersonBadge, BsPerson } from "react-icons/bs";

const ROLES = [
  { idrole: 1, nome: "Consultores" },
  { idrole: 2, nome: "Talent Managers" },
  { idrole: 3, nome: "Service Line" },
  { idrole: 4, nome: "Administradores" },
];

const TIPOS = [
  { valor: "aviso", label: "Aviso" },
  { valor: "geral", label: "Geral" },
  { valor: "alerta", label: "Alerta" },
];

export default function NotificacoesAdmin() {
  const [modo, setModo] = useState("todos"); // todos | perfil | utilizador
  const [idrole, setIdrole] = useState(1);
  const [idutilizador, setIdutilizador] = useState("");
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("aviso");

  const [utilizadores, setUtilizadores] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState(null); 

  useEffect(() => {
    fetch(`${API_BASE}/admin/utilizadores`)
      .then((r) => r.json())
      .then((d) => setUtilizadores(Array.isArray(d) ? d : []))
      .catch(() => setUtilizadores([]));
  }, []);

  const podeEnviar = useMemo(() => {
    if (!titulo.trim() || !mensagem.trim()) return false;
    if (modo === "utilizador" && !idutilizador) return false;
    return true;
  }, [titulo, mensagem, modo, idutilizador]);

  const resumoDestinatario = () => {
    if (modo === "todos") return "Todos os utilizadores";
    if (modo === "perfil") return ROLES.find((r) => r.idrole === Number(idrole))?.nome || "Perfil";
    const u = utilizadores.find((x) => x.idutilizador === Number(idutilizador));
    return u ? `${u.nome} (${u.email})` : "Utilizador";
  };

  const enviar = async () => {
    if (!podeEnviar) return;
    setEnviando(true);
    setFeedback(null);

    const body = { titulo: titulo.trim(), mensagem: mensagem.trim(), tipo };
    if (modo === "todos") body.paraTodos = true;
    else if (modo === "perfil") body.idrole = Number(idrole);
    else body.idutilizador = Number(idutilizador);

    try {
      const res = await fetch(`${API_BASE}/notificacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Falha ao enviar.");
      setFeedback({ tipo: "ok", texto: data.message });
      setTitulo("");
      setMensagem("");
    } catch (err) {
      setFeedback({ tipo: "erro", texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <AdminNav />
      <div className="adm-rel-page">
        <div className="adm-rel-header">
          <h1>Notificações</h1>
          <p>Compor e enviar notificações aos utilizadores da plataforma.</p>
        </div>

        {feedback && (
          <div className={`notif-feedback ${feedback.tipo === "ok" ? "ok" : "erro"}`}>
            {feedback.texto}
          </div>
        )}

        <div className="adm-card">
          <h3>Destinatário</h3>
          <div className="notif-destino">
            <button
              className={`notif-destino-opc ${modo === "todos" ? "ativo" : ""}`}
              onClick={() => setModo("todos")}
            >
              <BsPeople size={18} /> Todos
            </button>
            <button
              className={`notif-destino-opc ${modo === "perfil" ? "ativo" : ""}`}
              onClick={() => setModo("perfil")}
            >
              <BsPersonBadge size={18} /> Por perfil
            </button>
            <button
              className={`notif-destino-opc ${modo === "utilizador" ? "ativo" : ""}`}
              onClick={() => setModo("utilizador")}
            >
              <BsPerson size={18} /> Utilizador
            </button>
          </div>

          {modo === "perfil" && (
            <div className="adm-campo" style={{ marginTop: "1rem", maxWidth: 320 }}>
              <label>Perfil</label>
              <select value={idrole} onChange={(e) => setIdrole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.idrole} value={r.idrole}>{r.nome}</option>
                ))}
              </select>
            </div>
          )}

          {modo === "utilizador" && (
            <div className="adm-campo" style={{ marginTop: "1rem", maxWidth: 420 }}>
              <label>Utilizador</label>
              <select value={idutilizador} onChange={(e) => setIdutilizador(e.target.value)}>
                <option value="">— Selecionar —</option>
                {utilizadores.map((u) => (
                  <option key={u.idutilizador} value={u.idutilizador}>
                    {u.nome} — {u.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="adm-card">
          <h3>Mensagem</h3>
          <div className="notif-form">
            <div className="adm-campo">
              <label>Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ maxWidth: 200 }}>
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="adm-campo">
              <label>Título</label>
              <input
                type="text"
                value={titulo}
                maxLength={120}
                placeholder="Ex.: Novo Learning Path disponível"
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="adm-campo">
              <label>Mensagem</label>
              <textarea
                rows={4}
                value={mensagem}
                maxLength={1000}
                placeholder="Escreva a notificação..."
                onChange={(e) => setMensagem(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="adm-card notif-preview-card">
          <div className="notif-preview">
            <div className="notif-preview-icon"><BsBell size={18} /></div>
            <div>
              <div className="notif-preview-titulo">{titulo || "Pré-visualização do título"}</div>
              <div className="notif-preview-msg">{mensagem || "A mensagem aparece aqui..."}</div>
              <div className="notif-preview-dest">Para: <strong>{resumoDestinatario()}</strong></div>
            </div>
          </div>
          <button className="notif-enviar" onClick={enviar} disabled={!podeEnviar || enviando}>
            <BsSend size={16} /> {enviando ? "A enviar..." : "Enviar notificação"}
          </button>
        </div>
      </div>
    </>
  );
}
