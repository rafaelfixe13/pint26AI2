import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { API_BASE } from "../../api";
import "../../styles/DetalhesUtilizador.css";
import { FaMedal, FaKey } from "react-icons/fa";
import { BsFolderFill, BsBarChartFill, BsClipboard, BsEnvelopeFill, BsCalendarEvent, BsCheckLg, BsPlusLg } from "react-icons/bs";

const ROLE_NOMES = {
  1: "Consultor", 2: "Talent Manager", 3: "Service Line", 4: "Administrador",
  6: "Consultor + SL", 7: "Consultor + TM", 8: "Consultor + Admin",
};

const HIST_CFG = {
  badge:   { bg: "#fef9c3", cor: "#ca8a04", simbolo: <FaMedal /> },
  area:    { bg: "#dbeafe", cor: "#1d4ed8", simbolo: <BsFolderFill /> },
  ranking: { bg: "#fce7f3", cor: "#9d174d", simbolo: <BsBarChartFill /> },
  login:   { bg: "#dcfce7", cor: "#16a34a", simbolo: <FaKey /> },
  conta:   { bg: "#f3f4f6", cor: "#6b7280", simbolo: <BsClipboard /> },
  email:   { bg: "#ede9fe", cor: "#7c3aed", simbolo: <BsEnvelopeFill /> },
};

function HistIcone({ tipo }) {
  const c = HIST_CFG[tipo] ?? HIST_CFG.conta;
  return (
    <span className="du-hist-icone" style={{ background: c.bg, color: c.cor }}>
      {c.simbolo}
    </span>
  );
}

function DetalhesUtilizador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fotoInputRef = useRef(null);

  const [utilizador, setUtilizador] = useState(null);
  const [todasRoles, setTodasRoles] = useState([]);
  const [hierarquia, setHierarquia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState({ msg: "", tipo: "" });
  const [guardando, setGuardando] = useState(false);
  const [uploadFoto, setUploadFoto] = useState(false);

  const [estadoPendente, setEstadoPendente] = useState("");
  const [rolesPendentes, setRolesPendentes] = useState([]);
  const [alterado, setAlterado] = useState(false);

  const mostrarFeedback = (msg, tipo) => {
    setFeedback({ msg, tipo });
    setTimeout(() => setFeedback({ msg: "", tipo: "" }), 3500);
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resUsers, resRoles, resH] = await Promise.all([
        fetch(`${API_BASE}/admin/utilizadores`),
        fetch(`${API_BASE}/admin/roles`),
        fetch(`${API_BASE}/admin/hierarquia`),
      ]);
      const users = await resUsers.json();
      const roles = await resRoles.json();
      const h = await resH.json();

      const u = users.find((u) => String(u.idutilizador) === String(id));
      if (!u) { setErro("Utilizador não encontrado."); return; }

      setUtilizador(u);
      setTodasRoles(roles);
      setHierarquia(Array.isArray(h) ? h : []);
      setEstadoPendente(u.estadoconta);
      setRolesPendentes(u.roles?.map((r) => r.idrole) ?? []);
    } catch {
      setErro("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, [id]);

  useEffect(() => {
    if (!utilizador) return;
    const estadoMudou = estadoPendente !== utilizador.estadoconta;
    const rolesMudaram =
      JSON.stringify([...rolesPendentes].sort()) !==
      JSON.stringify([...(utilizador.roles?.map((r) => r.idrole) ?? [])].sort());
    setAlterado(estadoMudou || rolesMudaram);
  }, [estadoPendente, rolesPendentes, utilizador]);

  const toggleRolePendente = (idrole) => {
    setRolesPendentes((prev) =>
      prev.includes(idrole) ? prev.filter((r) => r !== idrole) : [...prev, idrole]
    );
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const rolesOriginais = utilizador.roles?.map((r) => r.idrole) ?? [];
      const adicionar = rolesPendentes.filter((r) => !rolesOriginais.includes(r));
      const remover = rolesOriginais.filter((r) => !rolesPendentes.includes(r));
      const promessas = [];

      if (estadoPendente !== utilizador.estadoconta) {
        promessas.push(fetch(`${API_BASE}/admin/utilizadores/estado`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idutilizador: utilizador.idutilizador, estadoconta: estadoPendente }),
        }));
      }
      adicionar.forEach((idrole) =>
        promessas.push(fetch(`${API_BASE}/admin/utilizadores/roles/adicionar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idutilizador: utilizador.idutilizador, idrole }),
        }))
      );
      remover.forEach((idrole) =>
        promessas.push(fetch(`${API_BASE}/admin/utilizadores/roles/remover`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idutilizador: utilizador.idutilizador, idrole }),
        }))
      );

      await Promise.all(promessas);
      await carregarDados();
      mostrarFeedback("Alterações guardadas com sucesso.", "sucesso");
    } catch {
      mostrarFeedback("Erro ao guardar alterações.", "erro");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    if (!utilizador) return;
    setEstadoPendente(utilizador.estadoconta);
    setRolesPendentes(utilizador.roles?.map((r) => r.idrole) ?? []);
  };

  const handleAlterarFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFoto(true);
    try {
      const formData = new FormData();
      formData.append("foto", file);
      const res = await fetch(`${API_BASE}/utilizadores/${id}/foto`, { method: "PUT", body: formData });
      if (!res.ok) throw new Error();
      await carregarDados();
      mostrarFeedback("Fotografia atualizada.", "sucesso");
    } catch {
      mostrarFeedback("Erro ao atualizar fotografia.", "erro");
    } finally {
      setUploadFoto(false);
      e.target.value = "";
    }
  };

  const handleRemoverFoto = async () => {
    if (!utilizador?.fotourl) return;
    setUploadFoto(true);
    try {
      const res = await fetch(`${API_BASE}/utilizadores/${id}/foto`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await carregarDados();
      mostrarFeedback("Fotografia removida.", "sucesso");
    } catch {
      mostrarFeedback("Erro ao remover fotografia.", "erro");
    } finally {
      setUploadFoto(false);
    }
  };

  const getInitials = (nome) => {
    if (!nome) return "?";
    return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const formatarData = (data) => {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-PT");
  };

  const tipoUtilizador = () => {
    if (!utilizador?.roles?.length) return "Sem role";
    return utilizador.roles.map((r) => ROLE_NOMES[r.idrole] || r.nome).join(", ");
  };

  const historicoItems = () => {
    if (!utilizador) return [];
    const items = [];
    if (utilizador.ultimadatalogin)
      items.push({ tipo: "login", texto: "Último login", data: utilizador.ultimadatalogin });
    if (utilizador.emailconfirmado)
      items.push({ tipo: "email", texto: "Email confirmado", data: utilizador.datacriacao });
    items.push({ tipo: "conta", texto: "Conta criada", data: utilizador.datacriacao });
    return items;
  };

  if (loading) return <><AdminNav /><div className="du-loading">A carregar...</div></>;
  if (erro)    return <><AdminNav /><div className="du-erro">{erro}</div></>;

  return (
    <>
      <AdminNav />
      <div className="du-wrapper">

        <h1 className="du-titulo">Detalhes de utilizador</h1>

        {/* Grid principal */}
        <div className="du-grid-principal">

          {/* Coluna esquerda */}
          <div className="du-col-esq">

            {/* Card: foto + campos */}
            <div className="du-card du-card-info">
              <div className="du-foto-col">
                {utilizador.fotourl ? (
                  <img src={utilizador.fotourl.startsWith("data:") ? utilizador.fotourl : `data:image/jpeg;base64,${utilizador.fotourl}`} alt={utilizador.nome} className="du-foto" />
                ) : (
                  <div className="du-foto du-foto-iniciais">{getInitials(utilizador.nome)}</div>
                )}
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAlterarFoto}
                />
                <button
                  className="du-foto-link"
                  onClick={() => fotoInputRef.current?.click()}
                  disabled={uploadFoto}
                >
                  {uploadFoto ? "A carregar..." : "Alterar fotografia de perfil"}
                </button>
                {utilizador.fotourl && (
                  <button className="du-foto-link du-foto-link--remover" onClick={handleRemoverFoto} disabled={uploadFoto}>
                    Remover
                  </button>
                )}
              </div>

              <div className="du-info-campos">
                <div className="du-campo">
                  <label>Nome <span className="du-obrigatorio">*</span></label>
                  <div className="du-campo-input">{utilizador.nome}</div>
                </div>
                <div className="du-campo">
                  <label>Email <span className="du-obrigatorio">*</span></label>
                  <div className="du-campo-input">{utilizador.email}</div>
                </div>
                <div className="du-campo">
                  <label>Tipo</label>
                  <div className="du-campo-input">{tipoUtilizador()}</div>
                </div>
              </div>
            </div>

            {/* Card: histórico */}
            <div className="du-card">
              <h3 className="du-card-titulo">Histórico de Atividades</h3>
              <div className="du-hist-lista">
                {historicoItems().map((item, i) => (
                  <div key={i} className="du-hist-item">
                    <HistIcone tipo={item.tipo} />
                    <span className="du-hist-texto">{item.texto}</span>
                    <span className="du-hist-data">{formatarData(item.data)}</span>
                  </div>
                ))}
                {historicoItems().length === 0 && (
                  <p className="du-vazio">Sem histórico disponível.</p>
                )}
              </div>
            </div>

          </div>

          {/* Coluna direita */}
          <div className="du-col-dir">

            {/* Card: estado + data */}
            <div className="du-card du-card-estado">
              <p className="du-secao-label">Estado</p>
              <label className="du-toggle-wrap">
                <input
                  type="checkbox"
                  className="du-toggle-input"
                  checked={estadoPendente === "ATIVA"}
                  onChange={(e) => setEstadoPendente(e.target.checked ? "ATIVA" : "INATIVA")}
                />
                <span className="du-toggle-slider" />
                <span className="du-toggle-texto">{estadoPendente === "ATIVA" ? "Ativo" : "Inativo"}</span>
              </label>

              <div className="du-divider" />

              <p className="du-secao-label">Data de inscrição</p>
              <div className="du-campo-data-row">
                <span>{formatarData(utilizador.datacriacao)}</span>
                <span className="du-cal-icone"><BsCalendarEvent /></span>
              </div>
            </div>

            {/* Card: service lines */}
            <div className="du-card">
              <h3 className="du-card-titulo">Service Lines</h3>
              <div className="du-sl-lista">
                {hierarquia.length === 0 && (
                  <p className="du-vazio">Nenhuma service line disponível.</p>
                )}
                {hierarquia.map((sl) => (
                  <div key={sl.idserviceline} className="du-sl-item">
                    <div className="du-sl-cabecalho">
                      <span className="du-sl-nome">{sl.nome}</span>
                      <span className={`du-sl-badge ${sl.ativo ? "du-sl-badge--ativo" : "du-sl-badge--inativo"}`}>
                        {sl.ativo ? "Ativa" : "Desativo"}
                      </span>
                    </div>
                    <div className="du-areas">
                      {sl.areas?.map((area) => (
                        <span
                          key={area.idarea}
                          className={`du-area-tag ${utilizador.idarea === area.idarea ? "du-area-tag--ativa" : ""}`}
                        >
                          {area.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* roles */}
        <div className="du-card du-card-roles">
          <h3 className="du-card-titulo">Roles</h3>
          <div className="du-roles-editor">
            {todasRoles.map((role) => {
              const ativa = rolesPendentes.includes(role.idrole);
              return (
                <button
                  key={role.idrole}
                  className={`du-role-toggle ${ativa ? "du-role-toggle--ativa" : ""}`}
                  onClick={() => toggleRolePendente(role.idrole)}
                >
                  {ativa ? <BsCheckLg /> : <BsPlusLg />} {role.nome}
                </button>
              );
            })}
          </div>
        </div>

        {/* cards de estatistica */}
        <div className="du-stats-row">
          <div className="du-stat-card">
            <span className="du-stat-label">Badges</span>
            <div className="du-stat-corpo">
              <span className="du-stat-num">-</span>
              <button className="du-btn-inspecionar" onClick={() => navigate(`/admin/utilizadores/${id}/badges`)}>
                Inspecionar
              </button>
            </div>
          </div>
          <div className="du-stat-card">
            <span className="du-stat-label">Pontos</span>
            <span className="du-stat-num">-</span>
          </div>
          <div className="du-stat-card">
            <span className="du-stat-label">Ranking</span>
            <span className="du-stat-num">-</span>
          </div>
          <div className="du-stat-card">
            <span className="du-stat-label">Badges em processo</span>
            <span className="du-stat-num">-</span>
          </div>
        </div>

        {/* Feedback */}
        {feedback.msg && (
          <div className={`du-feedback du-feedback--${feedback.tipo}`}>{feedback.msg}</div>
        )}

        {/* Botões */}
        <div className="du-acoes-bar">
          <button className="du-btn-guardar" onClick={handleGuardar} disabled={!alterado || guardando}>
            {guardando ? "A guardar..." : "Guardar alterações"}
          </button>
          <button className="du-btn-cancelar" onClick={handleCancelar} disabled={!alterado}>
            Cancelar
          </button>
        </div>

      </div>
    </>
  );
}

export default DetalhesUtilizador;
