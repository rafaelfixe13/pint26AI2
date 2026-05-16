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

  // Modal criar utilizador
  const [modalAberto, setModalAberto] = useState(false);
  const [novoUtilizador, setNovoUtilizador] = useState({ nome: "", email: "", idrole: "1" });
  const [erroModal, setErroModal] = useState("");
  const [loadingModal, setLoadingModal] = useState(false);
  const [sucessoModal, setSucessoModal] = useState("");

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

  const abrirModal = () => {
    setNovoUtilizador({ nome: "", email: "", idrole: "1" });
    setErroModal("");
    setSucessoModal("");
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setErroModal("");
    setSucessoModal("");
  };

  const handleCriarUtilizador = async (e) => {
    e.preventDefault();
    setErroModal("");
    setSucessoModal("");

    if (!novoUtilizador.nome || !novoUtilizador.email) {
      setErroModal("Nome e email são obrigatórios.");
      return;
    }

    setLoadingModal(true);

    try {
      const res = await fetch(`${API_BASE}/admin/utilizadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoUtilizador.nome,
          email: novoUtilizador.email,
          idrole: Number(novoUtilizador.idrole),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErroModal(data.message || "Erro ao criar conta.");
        return;
      }

      setSucessoModal("Conta criada. O utilizador receberá o código de ativação no primeiro login.");
      carregarDados();
      setNovoUtilizador({ nome: "", email: "", idrole: "1" });
    } catch {
      setErroModal("Não foi possível ligar ao servidor.");
    } finally {
      setLoadingModal(false);
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
          <button className="gu-btn-criar" onClick={abrirModal}>
            + Criar utilizador
          </button>
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
                    <td className="gu-nome gu-nome-link" onClick={() => navigate(`/admin/utilizadores/${u.idutilizador}`)}>{u.nome}</td>
                    <td className="gu-email">{u.email}</td>
                    <td>
                      <span className={`gu-estado gu-estado--${u.estadoconta.toLowerCase()}`}>
                        {u.estadoconta}
                      </span>
                    </td>
                    <td className="gu-center">
                      {u.emailconfirmado ? "✅" : "⏳"}
                    </td>
                    <td>
                      <div className="gu-roles">
                        {u.roles?.length > 0
                          ? u.roles.map((r) => (
                              <span key={r.idrole} className="gu-role-tag">{r.nome}</span>
                            ))
                          : <span className="gu-sem-role">Sem roles</span>
                        }
                      </div>
                    </td>
                    <td>
                      <div className="gu-acoes">
                        <button
                          className="gu-btn-editar"
                          onClick={() => setExpandido(expandido === u.idutilizador ? null : u.idutilizador)}
                        >
                          {expandido === u.idutilizador ? "Fechar" : "Editar"}
                        </button>
                      </div>
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

      {/* Modal criar utilizador */}
      {modalAberto && (
        <div className="gu-modal-overlay" onClick={fecharModal}>
          <div className="gu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gu-modal-header">
              <h2>Criar utilizador</h2>
              <button className="gu-modal-fechar" onClick={fecharModal}>✕</button>
            </div>

            <p className="gu-modal-desc">
              O utilizador receberá um código de ativação no email no primeiro login.
            </p>

            <form onSubmit={handleCriarUtilizador} noValidate>
              <div className="gu-modal-field">
                <label htmlFor="novo-nome">Nome completo</label>
                <input
                  id="novo-nome"
                  type="text"
                  placeholder="João Silva"
                  value={novoUtilizador.nome}
                  onChange={(e) => setNovoUtilizador({ ...novoUtilizador, nome: e.target.value })}
                  required
                />
              </div>

              <div className="gu-modal-field">
                <label htmlFor="novo-email">Email</label>
                <input
                  id="novo-email"
                  type="email"
                  placeholder="joao@empresa.com"
                  value={novoUtilizador.email}
                  onChange={(e) => setNovoUtilizador({ ...novoUtilizador, email: e.target.value })}
                  required
                />
              </div>

              <div className="gu-modal-field">
                <label htmlFor="novo-role">Role inicial</label>
                <select
                  id="novo-role"
                  value={novoUtilizador.idrole}
                  onChange={(e) => setNovoUtilizador({ ...novoUtilizador, idrole: e.target.value })}
                >
                  {todasRoles.map((r) => (
                    <option key={r.idrole} value={r.idrole}>{r.nome}</option>
                  ))}
                </select>
              </div>

              {erroModal && <p className="gu-modal-erro">{erroModal}</p>}
              {sucessoModal && <p className="gu-modal-sucesso">{sucessoModal}</p>}

              <div className="gu-modal-acoes">
                <button type="button" className="gu-modal-btn-cancelar" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="gu-modal-btn-criar" disabled={loadingModal}>
                  {loadingModal ? "A criar..." : "Criar conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default GestaoUtilizadores;
