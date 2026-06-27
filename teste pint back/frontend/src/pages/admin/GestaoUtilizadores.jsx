import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/GestaoUtilizadores.css";
import AdminNav from "./AdminNav";
import { API_BASE } from "../../api";
import { BsCheckCircleFill, BsHourglassSplit, BsX } from "react-icons/bs";

const ROLE_NOMES = {
  1: "Consultor", 2: "Talent Manager", 3: "Service Line", 4: "Administrador",
  6: "Consultor + SL", 7: "Consultor + TM", 8: "Consultor + Admin",
};

// Perfis extra que se podem juntar ao Consultor
const PERFIS_EXTRA = [
  { id: 2, nome: "Talent Manager" },
  { id: 3, nome: "Service Line" },
  { id: 4, nome: "Administrador" },
];

// Combinação de perfis
function combinarPerfis(perfis) {
  if (!perfis.includes(1)) return null;            // Consultor obrigatório
  const extras = perfis.filter((p) => p !== 1);
  if (extras.length === 0) return 1;               // só Consultor
  if (extras.length > 1) return null;              // mais do que um extra -> inválido
  return { 3: 6, 2: 7, 4: 8 }[extras[0]] ?? null;  // SL=6, TM=7, Admin=8
}

//perfis base
const PERFIS_DO_ROLE = { 1: [1], 2: [2], 3: [3], 4: [4], 5: [1, 2, 3, 4], 6: [1, 3], 7: [1, 2], 8: [1, 4] };
function perfisDoRole(idrole) {
  const extras = (PERFIS_DO_ROLE[idrole] ?? [idrole]).filter((p) => p !== 1);
  return [1, ...extras];
}

function GestaoUtilizadores() {
  const navigate = useNavigate();
  const [utilizadores, setUtilizadores] = useState([]);
  const [perfisEdit, setPerfisEdit] = useState([1]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [feedback, setFeedback] = useState({ id: null, msg: "", tipo: "" });

  //criar utilizador
  const [modalAberto, setModalAberto] = useState(false);
  const [novoUtilizador, setNovoUtilizador] = useState({ nome: "", email: "", perfis: [1] });
  const [erroModal, setErroModal] = useState("");
  const [loadingModal, setLoadingModal] = useState(false);
  const [sucessoModal, setSucessoModal] = useState("");

  const mostrarFeedback = (id, msg, tipo) => {
    setFeedback({ id, msg, tipo });
    setTimeout(() => setFeedback({ id: null, msg: "", tipo: "" }), 3000);
  };

  const carregarDados = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/utilizadores`);
      setUtilizadores(await res.json());
    } catch {
      setErro("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  // Abre o editor de um utilizador
  const abrirEditor = (u) => {
    if (expandido === u.idutilizador) { setExpandido(null); return; }
    setExpandido(u.idutilizador);
    setPerfisEdit(perfisDoRole(u.idrole));
  };

  const togglePerfilEdit = (id) => {
    setPerfisEdit((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  // Grava a combinação de perfis
  const guardarPerfis = async (u) => {
    const idrole = combinarPerfis(perfisEdit);
    if (idrole === null) {
      mostrarFeedback(u.idutilizador, "Combinação inválida - Consultor + no máximo um perfil.", "erro");
      return;
    }
    if (idrole === u.idrole) {
      mostrarFeedback(u.idutilizador, "Sem alterações nos perfis.", "sucesso");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/utilizadores/roles/adicionar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idutilizador: u.idutilizador, idrole }),
      });
      const data = await res.json();
      if (!res.ok) { mostrarFeedback(u.idutilizador, data.message, "erro"); return; }
      mostrarFeedback(u.idutilizador, `Perfil atualizado: ${ROLE_NOMES[idrole]}.`, "sucesso");
      carregarDados();
    } catch {
      mostrarFeedback(u.idutilizador, "Erro de ligação.", "erro");
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
    setNovoUtilizador({ nome: "", email: "", perfis: [1] });
    setErroModal("");
    setSucessoModal("");
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setErroModal("");
    setSucessoModal("");
  };

  const togglePerfil = (id) => {
    setErroModal("");
    setNovoUtilizador((prev) => {
      const tem = prev.perfis.includes(id);
      return { ...prev, perfis: tem ? prev.perfis.filter((p) => p !== id) : [...prev.perfis, id] };
    });
  };

  const handleCriarUtilizador = async (e) => {
    e.preventDefault();
    setErroModal("");
    setSucessoModal("");

    if (!novoUtilizador.nome || !novoUtilizador.email) {
      setErroModal("Nome e email são obrigatórios.");
      return;
    }

    const idrole = combinarPerfis(novoUtilizador.perfis);
    if (idrole === null) {
      setErroModal("Combinação de perfis inválida. O Consultor é a base e só pode juntar UM de: Talent Manager, Service Line ou Administrador.");
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
          idrole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErroModal(data.message || "Erro ao criar conta.");
        return;
      }

      setSucessoModal(
        data.passwordTemp
          ? `${data.message} Palavra-passe temporária: ${data.passwordTemp}`
          : (data.message || "Conta criada. A palavra-passe temporária foi enviada por email.")
      );
      carregarDados();
      setNovoUtilizador({ nome: "", email: "", perfis: [1] });
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
                      {u.emailconfirmado ? <BsCheckCircleFill color="#16a34a" /> : <BsHourglassSplit color="#ca8a04" />}
                    </td>
                    <td>
                      <div className="gu-roles">
                        {u.roles?.length > 0
                          ? u.roles.map((r) => (
                              <span key={r.idrole} className="gu-role-tag">{ROLE_NOMES[r.idrole] || r.nome}</span>
                            ))
                          : <span className="gu-sem-role">Sem roles</span>
                        }
                      </div>
                    </td>
                    <td>
                      <div className="gu-acoes">
                        <button
                          className="gu-btn-editar"
                          onClick={() => abrirEditor(u)}
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
                            <h4>Perfis</h4>
                            <div className="gu-roles-editor" style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
                              <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", opacity: 0.85 }}>
                                <input type="checkbox" checked disabled readOnly /> Consultor
                                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>(base)</span>
                              </label>
                              {PERFIS_EXTRA.map((p) => (
                                <label key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                                  <input
                                    type="checkbox"
                                    checked={perfisEdit.includes(p.id)}
                                    onChange={() => togglePerfilEdit(p.id)}
                                  />
                                  {p.nome}
                                </label>
                              ))}
                              <button
                                className="gu-btn-criar"
                                style={{ marginLeft: "auto" }}
                                disabled={combinarPerfis(perfisEdit) === null || combinarPerfis(perfisEdit) === u.idrole}
                                onClick={() => guardarPerfis(u)}
                              >
                                Guardar perfis
                              </button>
                            </div>
                            {combinarPerfis(perfisEdit) === null ? (
                              <p className="gu-feedback gu-feedback--erro" style={{ marginTop: "0.5rem" }}>
                                Combinação inválida - o Consultor só pode juntar UM perfil (TM, Service Line ou Admin).
                              </p>
                            ) : (
                              <p style={{ fontSize: "0.85rem", color: "#475569", marginTop: "0.5rem" }}>
                                Perfil: <strong>{ROLE_NOMES[combinarPerfis(perfisEdit)]}</strong>
                              </p>
                            )}
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
              <button className="gu-modal-fechar" onClick={fecharModal}><BsX /></button>
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
                <label>Perfis</label>
                <div className="gu-perfis-check" style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                  <label className="gu-perfil-item" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", opacity: 0.85 }}>
                    <input type="checkbox" checked disabled readOnly />
                    Consultor <span style={{ fontSize: "0.7rem", color: "#64748b" }}>(base)</span>
                  </label>
                  {PERFIS_EXTRA.map((p) => (
                    <label key={p.id} className="gu-perfil-item" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={novoUtilizador.perfis.includes(p.id)}
                        onChange={() => togglePerfil(p.id)}
                      />
                      {p.nome}
                    </label>
                  ))}
                </div>
                {combinarPerfis(novoUtilizador.perfis) === null ? (
                  <p className="gu-modal-erro">
                    Combinação inválida - o Consultor só pode juntar UM perfil (TM, Service Line ou Admin).
                  </p>
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "#475569", marginTop: "0.4rem" }}>
                    Perfil: <strong>{ROLE_NOMES[combinarPerfis(novoUtilizador.perfis)]}</strong>
                  </p>
                )}
              </div>

              {erroModal && <p className="gu-modal-erro">{erroModal}</p>}
              {sucessoModal && <p className="gu-modal-sucesso">{sucessoModal}</p>}

              <div className="gu-modal-acoes">
                <button type="button" className="gu-modal-btn-cancelar" onClick={fecharModal}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="gu-modal-btn-criar"
                  disabled={loadingModal || combinarPerfis(novoUtilizador.perfis) === null}
                >
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
