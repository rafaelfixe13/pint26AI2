import { useEffect, useState } from "react";
import "../../styles/GestaoBadges.css";
import AdminNav from "./AdminNav";
import { API_BASE } from "../../api";

const API = `${API_BASE}/admin`;

// ── Input inline ─────────────────────────────────────────────────
function InlineAdd({ placeholder, btnLabel, onAdd }) {
  const [valor, setValor] = useState("");
  const submit = async () => {
    if (!valor.trim()) return;
    await onAdd(valor.trim());
    setValor("");
  };
  return (
    <div className="gb-inline-add">
      <input
        type="text"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button className="gb-btn-add-inline" onClick={submit}>+ {btnLabel}</button>
    </div>
  );
}

// ── Modal genérico ────────────────────────────────────────────────
function Modal({ titulo, onFechar, children, footer }) {
  return (
    <div className="gb-modal-overlay" onClick={onFechar}>
      <div className="gb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gb-modal-header">
          <h2 className="gb-modal-titulo">{titulo}</h2>
          <button className="gb-modal-fechar" onClick={onFechar}>✕</button>
        </div>
        <div className="gb-modal-body">{children}</div>
        {footer && <div className="gb-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Modal editar nome simples ─────────────────────────────────────
function ModalEditar({ titulo, valorAtual, onFechar, onGuardar, submetendo }) {
  const [nome, setNome] = useState(valorAtual);
  return (
    <Modal titulo={titulo} onFechar={onFechar} footer={
      <>
        <button className="gb-btn-confirmar" onClick={() => nome.trim() && onGuardar(nome.trim())} disabled={submetendo}>
          {submetendo ? "A guardar..." : "Guardar"}
        </button>
        <button className="gb-btn-cancelar" onClick={onFechar}>Cancelar</button>
      </>
    }>
      <div className="gb-form-grupo">
        <label>Nome</label>
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && nome.trim() && onGuardar(nome.trim())} />
      </div>
    </Modal>
  );
}

// ── Modal Learning Path ───────────────────────────────────────────
function ModalLP({ lpEditar, submetendo, onFechar, onGuardar }) {
  const [form, setForm] = useState(
    lpEditar
      ? { nome: lpEditar.nome, descricao: lpEditar.descricao || "", ativo: lpEditar.ativo !== false }
      : { nome: "", descricao: "", ativo: true }
  );
  const [erro, setErro] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = () => {
    if (!form.nome.trim()) { setErro("O nome é obrigatório."); return; }
    setErro("");
    onGuardar(form);
  };

  return (
    <Modal titulo={lpEditar ? "Editar Learning Path" : "Novo Learning Path"} onFechar={onFechar} footer={
      <>
        <button className="gb-btn-confirmar" onClick={submit} disabled={submetendo}>
          {submetendo ? "A guardar..." : lpEditar ? "Guardar" : "Criar"}
        </button>
        <button className="gb-btn-cancelar" onClick={onFechar}>Cancelar</button>
      </>
    }>
      <div className="gb-form-grupo">
        <label>Nome *</label>
        <input type="text" placeholder="Nome do learning path" value={form.nome} onChange={f("nome")} />
      </div>
      <div className="gb-form-grupo">
        <label>Descrição</label>
        <input type="text" placeholder="Descrição (opcional)" value={form.descricao} onChange={f("descricao")} />
      </div>
      {lpEditar && (
        <div className="gb-form-grupo gb-form-grupo--check">
          <label>
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            Ativo
          </label>
        </div>
      )}
      {erro && <p className="gb-feedback gb-feedback--erro">{erro}</p>}
    </Modal>
  );
}

// ── Modal criar / editar Nível ────────────────────────────────────
function ModalNivel({ nivelEditar, learningPaths, submetendo, onFechar, onGuardar }) {
  const [form, setForm] = useState(
    nivelEditar
      ? { idlearningpath: nivelEditar.idlearningpath || "", codigo: nivelEditar.codigo, nome: nivelEditar.nome, descricao: nivelEditar.descricao || "" }
      : { idlearningpath: "", codigo: "", nome: "", descricao: "" }
  );
  const [erro, setErro] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = () => {
    if (!form.idlearningpath) { setErro("Seleciona um Learning Path."); return; }
    if (!form.codigo.trim()) { setErro("O código é obrigatório."); return; }
    if (!form.nome.trim()) { setErro("O nome é obrigatório."); return; }
    setErro("");
    onGuardar(form);
  };

  return (
    <Modal titulo={nivelEditar ? "Editar Nível" : "Novo Nível"} onFechar={onFechar} footer={
      <>
        <button className="gb-btn-confirmar" onClick={submit} disabled={submetendo}>
          {submetendo ? "A guardar..." : nivelEditar ? "Guardar" : "Criar nível"}
        </button>
        <button className="gb-btn-cancelar" onClick={onFechar}>Cancelar</button>
      </>
    }>
      <div className="gb-form-grupo">
        <label>Learning Path *</label>
        <select value={form.idlearningpath} onChange={f("idlearningpath")}>
          <option value="">-- Selecionar --</option>
          {learningPaths.map((lp) => (
            <option key={lp.idlearningpath} value={lp.idlearningpath}>{lp.nome}</option>
          ))}
        </select>
      </div>
      <div className="gb-form-linha">
        <div className="gb-form-grupo" style={{ flex: "0 0 80px" }}>
          <label>Código *</label>
          <input type="text" placeholder="Ex: A" maxLength={5} value={form.codigo} onChange={f("codigo")} />
        </div>
        <div className="gb-form-grupo gb-form-grupo--largo">
          <label>Nome *</label>
          <input type="text" placeholder="Ex: Nível Júnior" value={form.nome} onChange={f("nome")} />
        </div>
      </div>
      <div className="gb-form-grupo">
        <label>Descrição</label>
        <input type="text" placeholder="Descrição (opcional)" value={form.descricao} onChange={f("descricao")} />
      </div>
      {erro && <p className="gb-feedback gb-feedback--erro">{erro}</p>}
    </Modal>
  );
}

// ── Modal criar / editar Requisito ────────────────────────────────
function ModalRequisito({ requisitoEditar, submetendo, onFechar, onGuardar }) {
  const [form, setForm] = useState(
    requisitoEditar
      ? { codigo: requisitoEditar.codigo, titulo: requisitoEditar.titulo, descricao: requisitoEditar.descricao, imagemurl: requisitoEditar.imagemurl || "" }
      : { codigo: "", titulo: "", descricao: "", imagemurl: "" }
  );
  const [erro, setErro] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = () => {
    if (!form.codigo.trim()) { setErro("O código é obrigatório (ex: A1)."); return; }
    if (!form.titulo.trim()) { setErro("O título é obrigatório."); return; }
    if (!form.descricao.trim()) { setErro("A descrição é obrigatória."); return; }
    setErro("");
    onGuardar(form);
  };

  return (
    <Modal titulo={requisitoEditar ? "Editar Requisito" : "Novo Requisito"} onFechar={onFechar} footer={
      <>
        <button className="gb-btn-confirmar" onClick={submit} disabled={submetendo}>
          {submetendo ? "A guardar..." : requisitoEditar ? "Guardar" : "Criar requisito"}
        </button>
        <button className="gb-btn-cancelar" onClick={onFechar}>Cancelar</button>
      </>
    }>
      <div className="gb-form-linha">
        <div className="gb-form-grupo" style={{ flex: "0 0 90px" }}>
          <label>Código *</label>
          <input type="text" placeholder="Ex: A1" maxLength={10} value={form.codigo} onChange={f("codigo")} />
        </div>
        <div className="gb-form-grupo gb-form-grupo--largo">
          <label>Título *</label>
          <input type="text" placeholder="Título do requisito" value={form.titulo} onChange={f("titulo")} />
        </div>
      </div>
      <div className="gb-form-grupo">
        <label>Descrição *</label>
        <textarea
          placeholder="Descrição detalhada do requisito"
          value={form.descricao}
          onChange={f("descricao")}
          rows={3}
          style={{ width: "100%", resize: "vertical", padding: "6px 8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
        />
      </div>
      <div className="gb-form-grupo">
        <label>URL da imagem</label>
        <input type="text" placeholder="https://... (opcional)" value={form.imagemurl} onChange={f("imagemurl")} />
      </div>
      {erro && <p className="gb-feedback gb-feedback--erro">{erro}</p>}
    </Modal>
  );
}

// ── Formulário inline de Badge ────────────────────────────────────
const FORM_BADGE_VAZIO = { nome: "", descricao: "", imagemurl: "", pontos: "", expiremeses: "", linkpublicobase: "", ispublico: true };

function FormBadge({ nivel, submetendo, onGuardar, onCancelar }) {
  const badge = nivel.badge;
  const [form, setForm] = useState(
    badge
      ? { nome: badge.nome || "", descricao: badge.descricao || "", imagemurl: badge.imagemurl || "",
          pontos: badge.pontos ?? "", expiremeses: badge.expiremeses ?? "",
          linkpublicobase: badge.linkpublicobase || "", ispublico: badge.ispublico ?? true }
      : FORM_BADGE_VAZIO
  );
  const [erro, setErro] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = () => {
    if (!form.nome.trim()) { setErro("O nome é obrigatório."); return; }
    if (form.pontos === "") { setErro("Os pontos são obrigatórios."); return; }
    setErro("");
    onGuardar(form);
  };

  return (
    <div className="gb-badge-form">
      <p className="gb-badge-form-titulo">
        {badge ? "Editar badge" : "Criar badge"} — {nivel.codigo} {nivel.nome}
      </p>
      <div className="gb-form-linha">
        <div className="gb-form-grupo gb-form-grupo--largo">
          <label>Nome *</label>
          <input type="text" placeholder="Nome do badge" value={form.nome} onChange={f("nome")} />
        </div>
        <div className="gb-form-grupo">
          <label>Pontos *</label>
          <input type="number" placeholder="0" min="0" value={form.pontos} onChange={f("pontos")} />
        </div>
        <div className="gb-form-grupo">
          <label>Expira (meses)</label>
          <input type="number" placeholder="Sem expiração" min="1" value={form.expiremeses} onChange={f("expiremeses")} />
        </div>
      </div>
      <div className="gb-form-linha">
        <div className="gb-form-grupo gb-form-grupo--largo">
          <label>Descrição</label>
          <input type="text" placeholder="Descrição (opcional)" value={form.descricao} onChange={f("descricao")} />
        </div>
        <div className="gb-form-grupo gb-form-grupo--largo">
          <label>URL da imagem</label>
          <input type="text" placeholder="https://... (opcional)" value={form.imagemurl} onChange={f("imagemurl")} />
        </div>
      </div>
      <div className="gb-form-linha">
        <div className="gb-form-grupo gb-form-grupo--largo">
          <label>Link público base</label>
          <input type="text" placeholder="URL base (opcional)" value={form.linkpublicobase} onChange={f("linkpublicobase")} />
        </div>
        <div className="gb-form-grupo gb-form-grupo--check">
          <label>
            <input type="checkbox" checked={form.ispublico} onChange={(e) => setForm({ ...form, ispublico: e.target.checked })} />
            Público
          </label>
        </div>
      </div>
      {erro && <p className="gb-feedback gb-feedback--erro">{erro}</p>}
      <div className="gb-form-acoes">
        <button className="gb-btn-confirmar" onClick={submit} disabled={submetendo}>
          {submetendo ? "A guardar..." : badge ? "Guardar alterações" : "Criar badge"}
        </button>
        <button className="gb-btn-cancelar" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
function GestaoBadges() {
  const [hierarquia, setHierarquia] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [lpExp, setLpExp] = useState(true);
  const [slExp, setSlExp] = useState({});
  const [areaExp, setAreaExp] = useState({});
  const [nivelExp, setNivelExp] = useState({});

  const [formBadgeAberto, setFormBadgeAberto] = useState(null);
  const [modalLP, setModalLP] = useState(null);          // { lp? }
  const [modalEditSL, setModalEditSL] = useState(null);
  const [modalEditArea, setModalEditArea] = useState(null);
  const [modalNivel, setModalNivel] = useState(null);    // { idarea, nivel? }
  const [modalRequisito, setModalRequisito] = useState(null); // { idnivel, requisito? }

  const [submetendo, setSubmetendo] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState("sucesso");

  const toast = (msg, tipo = "sucesso") => {
    setFeedback(msg); setFeedbackTipo(tipo);
    setTimeout(() => setFeedback(""), 3500);
  };

  const carregar = async () => {
    setLoading(true);
    try {
      const [resH, resLP] = await Promise.all([
        fetch(`${API}/hierarquia`),
        fetch(`${API}/learningpaths`),
      ]);
      const h = await resH.json();
      const lps = await resLP.json();
      setHierarquia(h);
      setLearningPaths(Array.isArray(lps) ? lps : []);

      const sl = {}, ar = {}, nv = {};
      h.forEach((s) => {
        sl[s.idserviceline] = true;
        s.areas.forEach((a) => {
          ar[a.idarea] = true;
          a.niveis.forEach((n) => { nv[n.idnivel] = false; });
        });
      });
      setSlExp(sl); setAreaExp(ar); setNivelExp(nv);
    } catch {
      setErro("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  // ── Toggle ativo (soft delete / reativar) ────────────────────
  const handleToggle = async (tipo, id, ativoAtual) => {
    const endpoints = {
      lp: `${API}/learningpaths/${id}/ativo`,
      sl: `${API}/servicelines/${id}/ativo`,
      area: `${API}/areas/${id}/ativo`,
      nivel: `${API}/niveis/${id}/ativo`,
      requisito: `${API}/requisitos/${id}/ativo`,
      badge: `${API}/badges/${id}/ativo`,
    };
    const res = await fetch(endpoints[tipo], { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast(ativoAtual ? "Desativado." : "Reativado.");
    carregar();
  };

  // ── Learning Paths ────────────────────────────────────────────
  const handleGuardarLP = async (form) => {
    setSubmetendo(true);
    const isEdit = !!modalLP?.lp;
    const url = isEdit ? `${API}/learningpaths/${modalLP.lp.idlearningpath}` : `${API}/learningpaths`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast(isEdit ? "Learning Path atualizado." : "Learning Path criado.");
    setModalLP(null);
    carregar();
  };

  // ── Service Lines ─────────────────────────────────────────────
  const handleCriarSL = async (nome) => {
    const res = await fetch(`${API}/servicelines`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const data = await res.json();
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast("Service Line criada.");
    carregar();
  };

  const handleEditarSL = async (nome) => {
    setSubmetendo(true);
    const res = await fetch(`${API}/servicelines/${modalEditSL.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast("Service Line atualizada.");
    setModalEditSL(null);
    carregar();
  };

  // ── Áreas ─────────────────────────────────────────────────────
  const handleCriarArea = async (idserviceline, nome) => {
    const res = await fetch(`${API}/areas`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idserviceline, nome }),
    });
    const data = await res.json();
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast("Área criada.");
    carregar();
  };

  const handleEditarArea = async (nome) => {
    setSubmetendo(true);
    const res = await fetch(`${API}/areas/${modalEditArea.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast("Área atualizada.");
    setModalEditArea(null);
    carregar();
  };

  // ── Níveis ────────────────────────────────────────────────────
  const handleGuardarNivel = async (form) => {
    setSubmetendo(true);
    const isEdit = !!modalNivel.nivel;
    const url = isEdit ? `${API}/niveis/${modalNivel.nivel.idnivel}` : `${API}/niveis`;
    const body = isEdit
      ? { idlearningpath: Number(form.idlearningpath), codigo: form.codigo, nome: form.nome, descricao: form.descricao || null }
      : { idlearningpath: Number(form.idlearningpath), idarea: modalNivel.idarea, codigo: form.codigo, nome: form.nome, descricao: form.descricao || null };

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast(isEdit ? "Nível atualizado." : "Nível criado.");
    setModalNivel(null);
    carregar();
  };

  // ── Requisitos ────────────────────────────────────────────────
  const handleGuardarRequisito = async (form) => {
    setSubmetendo(true);
    const isEdit = !!modalRequisito.requisito;
    const url = isEdit ? `${API}/requisitos/${modalRequisito.requisito.idrequisito}` : `${API}/requisitos`;
    const body = isEdit
      ? { codigo: form.codigo, titulo: form.titulo, descricao: form.descricao, imagemurl: form.imagemurl || null }
      : { idnivel: modalRequisito.idnivel, codigo: form.codigo, titulo: form.titulo, descricao: form.descricao, imagemurl: form.imagemurl || null };

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast(isEdit ? "Requisito atualizado." : "Requisito criado.");
    setModalRequisito(null);
    carregar();
  };

  // ── Badges ────────────────────────────────────────────────────
  const handleGuardarBadge = async (idnivel, badgeExistente, form) => {
    setSubmetendo(true);
    const body = {
      idnivel,
      nome: form.nome,
      descricao: form.descricao || null,
      imagemurl: form.imagemurl || null,
      pontos: Number(form.pontos),
      expiremeses: form.expiremeses ? Number(form.expiremeses) : null,
      linkpublicobase: form.linkpublicobase || null,
      ispublico: form.ispublico,
    };
    const isEdit = !!badgeExistente;
    const url = isEdit ? `${API}/badges/${badgeExistente.idbadge}` : `${API}/badges`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast(isEdit ? "Badge atualizado." : "Badge criado.");
    setFormBadgeAberto(null);
    carregar();
  };

  if (loading) return <><AdminNav /><div className="gb-loading">A carregar...</div></>;
  if (erro) return <><AdminNav /><div className="gb-erro">{erro}</div></>;

  return (
    <>
      <AdminNav />
      <div className="gb-wrapper">
        <div className="gb-header">
          <h1 className="gb-titulo">Gestor de Badges</h1>
        </div>

        {feedback && <div className={`gb-toast gb-toast--${feedbackTipo}`}>{feedback}</div>}

        {/* ── SECÇÃO LEARNING PATHS ── */}
        <div className="gb-secao">
          <div className="gb-secao-header" onClick={() => setLpExp((v) => !v)}>
            <span className="gb-secao-chevron">{lpExp ? "∨" : "›"}</span>
            <h2 className="gb-secao-titulo">Learning Paths</h2>
            <span className="gb-secao-count">{learningPaths.length}</span>
          </div>

          {lpExp && (
            <div className="gb-secao-body">
              <div className="gb-area-add">
                <button className="gb-btn-add-nivel" onClick={() => setModalLP({})}>+ Adicionar Learning Path</button>
              </div>

              {learningPaths.length === 0 && <p className="gb-vazio-inner">Nenhum learning path criado ainda.</p>}

              {learningPaths.map((lp) => (
                <div key={lp.idlearningpath} className={`gb-lp-item${lp.ativo ? "" : " gb-inativo"}`}>
                  <div className="gb-lp-info">
                    <span className={`gb-lp-status gb-lp-status--${lp.ativo ? "ativo" : "inativo"}`}>
                      {lp.ativo ? "Ativo" : "Inativo"}
                    </span>
                    <span className="gb-lp-nome">{lp.nome}</span>
                    {lp.descricao && <span className="gb-lp-desc">{lp.descricao}</span>}
                  </div>
                  <div className="gb-sl-acoes">
                    <button className="gb-icon-btn" onClick={() => setModalLP({ lp })}>✏</button>
                    <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${lp.ativo ? "off" : "on"}`}
                      title={lp.ativo ? "Desativar" : "Reativar"}
                      onClick={() => handleToggle("lp", lp.idlearningpath, lp.ativo)}>
                      {lp.ativo ? "🗑" : "↩"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SECÇÃO SERVICE LINES ── */}
        <div className="gb-secao">
          <div className="gb-secao-header">
            <h2 className="gb-secao-titulo">Service Lines</h2>
          </div>
          <div className="gb-secao-body">
            <div className="gb-sl-card gb-sl-card--add">
              <InlineAdd placeholder="Nome da Service Line" btnLabel="Adicionar Service Line" onAdd={handleCriarSL} />
            </div>

            {hierarquia.length === 0 && <div className="gb-vazio">Nenhuma service line criada ainda.</div>}

            {hierarquia.map((sl) => (
              <div key={sl.idserviceline} className={`gb-sl-card${sl.ativo ? "" : " gb-inativo"}`}>
                <div className="gb-sl-header">
                  <button className="gb-chevron-btn" onClick={() => setSlExp((p) => ({ ...p, [sl.idserviceline]: !p[sl.idserviceline] }))}>
                    {slExp[sl.idserviceline] ? "∨" : "›"}
                  </button>
                  <span className="gb-sl-nome" onClick={() => setSlExp((p) => ({ ...p, [sl.idserviceline]: !p[sl.idserviceline] }))}>
                    {sl.nome}
                  </span>
                  {!sl.ativo && <span className="gb-tag-inativo">Inativo</span>}
                  <div className="gb-sl-acoes">
                    <button className="gb-icon-btn" onClick={() => setModalEditSL({ id: sl.idserviceline, nome: sl.nome })}>✏</button>
                    <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${sl.ativo ? "off" : "on"}`}
                      title={sl.ativo ? "Desativar" : "Reativar"}
                      onClick={() => handleToggle("sl", sl.idserviceline, sl.ativo)}>
                      {sl.ativo ? "🗑" : "↩"}
                    </button>
                  </div>
                </div>

                {slExp[sl.idserviceline] && (
                  <div className="gb-sl-body">
                    <div className="gb-area-add">
                      <InlineAdd placeholder="Nome da Área" btnLabel="Adicionar Área" onAdd={(nome) => handleCriarArea(sl.idserviceline, nome)} />
                    </div>

                    {sl.areas.length === 0 && <p className="gb-vazio-inner">Sem áreas.</p>}

                    {sl.areas.map((area) => (
                      <div key={area.idarea} className={`gb-area-card${area.ativo ? "" : " gb-inativo"}`}>
                        <div className="gb-area-header">
                          <button className="gb-chevron-btn" onClick={() => setAreaExp((p) => ({ ...p, [area.idarea]: !p[area.idarea] }))}>
                            {areaExp[area.idarea] ? "∨" : "›"}
                          </button>
                          <span className="gb-area-nome" onClick={() => setAreaExp((p) => ({ ...p, [area.idarea]: !p[area.idarea] }))}>
                            {area.nome}
                          </span>
                          {!area.ativo && <span className="gb-tag-inativo">Inativo</span>}
                          <div className="gb-sl-acoes">
                            <button className="gb-icon-btn" onClick={() => setModalEditArea({ id: area.idarea, nome: area.nome })}>✏</button>
                            <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${area.ativo ? "off" : "on"}`}
                              title={area.ativo ? "Desativar" : "Reativar"}
                              onClick={() => handleToggle("area", area.idarea, area.ativo)}>
                              {area.ativo ? "🗑" : "↩"}
                            </button>
                          </div>
                        </div>

                        {areaExp[area.idarea] && (
                          <div className="gb-area-body">
                            <button className="gb-btn-add-nivel" onClick={() => setModalNivel({ idarea: area.idarea, nivel: null })}>
                              + Adicionar Nível
                            </button>

                            {area.niveis.length === 0 && <p className="gb-vazio-inner">Sem níveis nesta área.</p>}

                            {area.niveis.map((nivel) => (
                              <div key={nivel.idnivel} className={`gb-nivel-card${nivel.ativo ? "" : " gb-inativo"}`}>
                                <div className="gb-nivel-header">
                                  <div className="gb-nivel-esquerda">
                                    <span className={`gb-badge-icon ${nivel.badge ? "" : "gb-badge-icon--vazio"}`}>🏅</span>
                                    <span className="gb-nivel-nome">{nivel.codigo} - {nivel.nome}</span>
                                    {nivel.lp_nome && <span className="gb-nivel-lp">{nivel.lp_nome}</span>}
                                    {!nivel.ativo && <span className="gb-tag-inativo">Inativo</span>}
                                  </div>
                                  <div className="gb-nivel-acoes">
                                    <button className="gb-btn-add-req"
                                      onClick={() => setModalRequisito({ idnivel: nivel.idnivel, requisito: null })}>
                                      + Requisito
                                    </button>
                                    {!nivel.badge ? (
                                      <button className="gb-btn-badge gb-btn-badge--criar"
                                        onClick={() => setFormBadgeAberto(formBadgeAberto === nivel.idnivel ? null : nivel.idnivel)}>
                                        {formBadgeAberto === nivel.idnivel ? "✕" : "+ Badge"}
                                      </button>
                                    ) : (
                                      <>
                                        <button className="gb-btn-badge gb-btn-badge--editar"
                                          onClick={() => setFormBadgeAberto(formBadgeAberto === nivel.idnivel ? null : nivel.idnivel)}>
                                          {formBadgeAberto === nivel.idnivel ? "✕" : "✏ Badge"}
                                        </button>
                                        <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${nivel.badge.ativo ? "off" : "on"}`}
                                          title={nivel.badge.ativo ? "Desativar badge" : "Reativar badge"}
                                          onClick={() => handleToggle("badge", nivel.badge.idbadge, nivel.badge.ativo)}>
                                          {nivel.badge.ativo ? "🗑" : "↩"}
                                        </button>
                                      </>
                                    )}
                                    <button className="gb-icon-btn" title="Editar nível"
                                      onClick={() => setModalNivel({ idarea: area.idarea, nivel })}>✏</button>
                                    <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${nivel.ativo ? "off" : "on"}`}
                                      title={nivel.ativo ? "Desativar" : "Reativar"}
                                      onClick={() => handleToggle("nivel", nivel.idnivel, nivel.ativo)}>
                                      {nivel.ativo ? "🗑" : "↩"}
                                    </button>
                                    {(nivel.requisitos.length > 0 || nivel.badge) && (
                                      <button className="gb-btn-toggle"
                                        onClick={() => setNivelExp((p) => ({ ...p, [nivel.idnivel]: !p[nivel.idnivel] }))}>
                                        {nivelExp[nivel.idnivel] ? "▲" : "▼"}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {nivelExp[nivel.idnivel] && (
                                  <div className="gb-nivel-detail">
                                    {/* Badge info */}
                                    {nivel.badge && formBadgeAberto !== nivel.idnivel && (
                                      <div className={`gb-badge-info${nivel.badge.ativo ? "" : " gb-inativo"}`}>
                                        <span className="gb-badge-nome">{nivel.badge.nome}</span>
                                        {nivel.badge.descricao && <span className="gb-badge-desc">{nivel.badge.descricao}</span>}
                                        <span className="gb-badge-pontos">{nivel.badge.pontos} pts</span>
                                        <span className={`gb-badge-publico gb-badge-publico--${nivel.badge.ispublico ? "sim" : "nao"}`}>
                                          {nivel.badge.ispublico ? "Público" : "Privado"}
                                        </span>
                                        {!nivel.badge.ativo && <span className="gb-tag-inativo">Inativo</span>}
                                      </div>
                                    )}

                                    {/* Requisitos */}
                                    {nivel.requisitos.length > 0 && (
                                      <div className="gb-requisitos">
                                        <p className="gb-requisitos-titulo">Requisitos</p>
                                        {nivel.requisitos.map((req) => (
                                          <div key={req.idrequisito} className={`gb-req-item${req.ativo ? "" : " gb-inativo"}`}>
                                            <span className="gb-req-codigo">{req.codigo}</span>
                                            <span className="gb-req-titulo">{req.titulo}</span>
                                            {!req.ativo && <span className="gb-tag-inativo">Inativo</span>}
                                            <div className="gb-req-acoes">
                                              <button className="gb-icon-btn"
                                                onClick={() => setModalRequisito({ idnivel: nivel.idnivel, requisito: req })}>✏</button>
                                              <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${req.ativo ? "off" : "on"}`}
                                                title={req.ativo ? "Desativar" : "Reativar"}
                                                onClick={() => handleToggle("requisito", req.idrequisito, req.ativo)}>
                                                {req.ativo ? "🗑" : "↩"}
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {formBadgeAberto === nivel.idnivel && (
                                  <FormBadge
                                    nivel={nivel}
                                    submetendo={submetendo}
                                    onGuardar={(form) => handleGuardarBadge(nivel.idnivel, nivel.badge, form)}
                                    onCancelar={() => setFormBadgeAberto(null)}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modais */}
      {modalLP !== null && (
        <ModalLP
          lpEditar={modalLP.lp || null}
          submetendo={submetendo}
          onFechar={() => setModalLP(null)}
          onGuardar={handleGuardarLP}
        />
      )}
      {modalEditSL && (
        <ModalEditar titulo="Editar Service Line" valorAtual={modalEditSL.nome}
          submetendo={submetendo} onFechar={() => setModalEditSL(null)} onGuardar={handleEditarSL} />
      )}
      {modalEditArea && (
        <ModalEditar titulo="Editar Área" valorAtual={modalEditArea.nome}
          submetendo={submetendo} onFechar={() => setModalEditArea(null)} onGuardar={handleEditarArea} />
      )}
      {modalNivel && (
        <ModalNivel
          nivelEditar={modalNivel.nivel}
          idarea={modalNivel.idarea}
          learningPaths={learningPaths}
          submetendo={submetendo}
          onFechar={() => setModalNivel(null)}
          onGuardar={handleGuardarNivel}
        />
      )}
      {modalRequisito && (
        <ModalRequisito
          requisitoEditar={modalRequisito.requisito}
          submetendo={submetendo}
          onFechar={() => setModalRequisito(null)}
          onGuardar={handleGuardarRequisito}
        />
      )}
    </>
  );
}

export default GestaoBadges;
