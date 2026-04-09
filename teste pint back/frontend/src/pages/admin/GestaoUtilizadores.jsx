import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/GestaoUtilizadores.css";
import AdminNav from "./AdminNav";
import { API_BASE } from "../../api";

const ROLE_NOMES = { 1: "Consultor", 2: "Talent Manager", 3: "Service Line", 4: "Administrador" };

function GestaoUtilizadores() {
  const navigate = useNavigate();
  const [utilizadores, setUtilizadores] = useState([]);
  const [todasRoles, setTodasRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [feedback, setFeedback] = useState({ id: null, msg: "", tipo: "" });

  const mostrarFeedback = (id, msg, tipo) => {
    setFeedback({ id, msg, tipo });
    setTimeout(() => setFeedback({ id: null, msg: "", tipo: "" }), 3000);
  };

  const carregarDados = async () => {
    try {
      const [resUsers, resRoles] = await Promise.all([
        fetch(`${API_BASE}/admin/utilizadores`),
        fetch(`${API_BASE}/admin/roles`),
      ]);
      const users = await resUsers.json();
      const roles = await resRoles.json();
      setUtilizadores(users);
      setTodasRoles(roles);
    } catch {
      setErro("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const temRole = (utilizador, idrole) =>
    utilizador.roles?.some((r) => r.idrole === idrole);

  const toggleRole = async (utilizador, idrole) => {
    const jatem = temRole(utilizador, idrole);
    const endpoint = jatem
      ? `${API_BASE}/admin/utilizadores/roles/remover`
      : `${API_BASE}/admin/utilizadores/roles/adicionar`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idutilizador: utilizador.idutilizador, idrole }),
      });
      const data = await res.json();

      if (!res.ok) {
        mostrarFeedback(utilizador.idutilizador, data.message, "erro");
        return;
      }

      mostrarFeedback(
        utilizador.idutilizador,
        jatem ? `Role "${ROLE_NOMES[idrole]}" removida.` : `Role "${ROLE_NOMES[idrole]}" adicionada.`,
        "sucesso"
      );
      carregarDados();
    } catch {
      mostrarFeedback(utilizador.idutilizador, "Erro de ligação.", "erro");
    }
  };

  const toggleEstado = async (utilizador) => {
    const novoEstado = utilizador.estadoconta === "ATIVA" ? "INATIVA" : "ATIVA";
    try {
      const res = await fetch(`${API_BASE}/admin/utilizadores/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idutilizador: utilizador.idutilizador, estadoconta: novoEstado }),
      });
      const data = await res.json();
      if (!res.ok) {
        mostrarFeedback(utilizador.idutilizador, data.message, "erro");
        return;
      }
      mostrarFeedback(utilizador.idutilizador, `Conta ${novoEstado.toLowerCase()}.`, "sucesso");
      carregarDados();
    } catch {
      mostrarFeedback(utilizador.idutilizador, "Erro de ligação.", "erro");
    }
  };

  if (loading) return <div className="gu-loading">A carregar...</div>;
  if (erro) return <div className="gu-erro">{erro}</div>;

  return (
    <>
      <AdminNav />
    <div className="gu-wrapper">
      <div className="gu-header">
        <div>
          <h1 className="gu-titulo">Gestão de Utilizadores</h1>
          <p className="gu-subtitulo">{utilizadores.length} utilizadores registados</p>
        </div>
      </div>

      <div className="gu-tabela-wrapper">
        <table className="gu-tabela">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Confirmado</th>
              <th>Roles</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {utilizadores.map((u) => (
              <>
                <tr key={u.idutilizador} className={expandido === u.idutilizador ? "gu-row-ativa" : ""}>
                  <td className="gu-id">#{u.idutilizador}</td>
                  <td className="gu-nome">{u.nome}</td>
                  <td className="gu-email">{u.email}</td>
                  <td>
                    <span className={`gu-estado gu-estado--${u.estadoconta.toLowerCase()}`}>
                      {u.estadoconta}
                    </span>
                  </td>
                  <td className="gu-center">
                    {u.emailconfirmado ? "✅" : "⏳"}
                  </td>
                  <td className="gu-roles">
                    {u.roles?.length > 0
                      ? u.roles.map((r) => (
                          <span key={r.idrole} className="gu-role-tag">{r.nome}</span>
                        ))
                      : <span className="gu-sem-role">Sem roles</span>
                    }
                  </td>
                  <td className="gu-acoes">
                    <button
                      className="gu-btn-editar"
                      onClick={() => setExpandido(expandido === u.idutilizador ? null : u.idutilizador)}
                    >
                      {expandido === u.idutilizador ? "Fechar" : "Editar"}
                    </button>
                  </td>
                </tr>

                {expandido === u.idutilizador && (
                  <tr key={`edit-${u.idutilizador}`} className="gu-row-editor">
                    <td colSpan={7}>
                      <div className="gu-editor">
                        <div className="gu-editor-secao">
                          <h4>Roles</h4>
                          <div className="gu-roles-editor">
                            {todasRoles.map((role) => {
                              const ativa = temRole(u, role.idrole);
                              return (
                                <button
                                  key={role.idrole}
                                  className={`gu-role-toggle ${ativa ? "gu-role-toggle--ativa" : ""}`}
                                  onClick={() => toggleRole(u, role.idrole)}
                                >
                                  {ativa ? "✓ " : "+ "}{role.nome}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="gu-editor-secao">
                          <h4>Estado da conta</h4>
                          <button
                            className={`gu-btn-estado ${u.estadoconta === "ATIVA" ? "gu-btn-estado--desativar" : "gu-btn-estado--ativar"}`}
                            onClick={() => toggleEstado(u)}
                          >
                            {u.estadoconta === "ATIVA" ? "Desativar conta" : "Ativar conta"}
                          </button>
                        </div>

                        {feedback.id === u.idutilizador && (
                          <p className={`gu-feedback gu-feedback--${feedback.tipo}`}>
                            {feedback.msg}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

export default GestaoUtilizadores;
