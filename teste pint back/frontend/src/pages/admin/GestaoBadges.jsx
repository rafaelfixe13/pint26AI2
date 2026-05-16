import { useEffect, useState } from "react";
import "../../styles/GestaoBadges.css";
import AdminNav from "./AdminNav";
import { API_BASE } from "../../api";

const API = `${API_BASE}/admin`;

// ── Seletor de imagem (preview local, sem upload imediato) ───────
// previewUrl: URL a mostrar (Cloudinary URL existente ou blob local)
// onFileSelect: (File | null) => void  — chamado quando o utilizador escolhe/remove
function ImageUpload({ previewUrl, onFileSelect }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    onFileSelect(file);
  };

  return (
    <div className="gb-image-upload">
      {previewUrl && (
        <img src={previewUrl} alt="Preview" className="gb-image-upload-preview" />
      )}
      <label className="gb-image-upload-btn">
        {previewUrl ? "Trocar imagem" : "Escolher imagem"}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      </label>
      {previewUrl && (
        <button type="button" className="gb-image-upload-remover" onClick={() => onFileSelect(null)} title="Remover imagem">✕</button>
      )}
    </div>
  );
}

// Função utilitária: faz upload de um File para o Cloudinary e devolve a URL
async function uploadParaCloudinary(file) {
  const formData = new FormData();
  formData.append("imagem", file);
  const res = await fetch(`${API}/upload-imagem`, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro no upload da imagem.");
  return data.url;
}

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
function Modal({ titulo, onFechar, children, footer, stacked }) {
  return (
    <div className={`gb-modal-overlay${stacked ? " gb-modal-overlay--stacked" : ""}`} onClick={onFechar}>
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

const NIVEIS_FIXOS = [
  { codigo: "A", nome: "Júnior" },
  { codigo: "B", nome: "Intermédio" },
  { codigo: "C", nome: "Sénior" },
  { codigo: "D", nome: "Especialista" },
  { codigo: "E", nome: "Líder de Conhecimento" },
];

// ── Modal criar / editar Nível ────────────────────────────────────
function ModalNivel({ nivelEditar, learningPaths, submetendo, onFechar, onGuardar }) {
  const [form, setForm] = useState(
    nivelEditar
      ? { idlearningpath: nivelEditar.idlearningpath || "", codigo: nivelEditar.codigo, descricao: nivelEditar.descricao || "" }
      : { idlearningpath: "", codigo: "", descricao: "" }
  );
  const [erro, setErro] = useState("");

  const nomeDerivado = NIVEIS_FIXOS.find((n) => n.codigo === form.codigo)?.nome || "";

  const submit = () => {
    if (!form.idlearningpath) { setErro("Seleciona um Learning Path."); return; }
    if (!form.codigo) { setErro("Seleciona um nível."); return; }
    setErro("");
    onGuardar({ ...form, nome: nomeDerivado });
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
        <select value={form.idlearningpath} onChange={(e) => setForm({ ...form, idlearningpath: e.target.value })}>
          <option value="">-- Selecionar --</option>
          {learningPaths.map((lp) => (
            <option key={lp.idlearningpath} value={lp.idlearningpath}>{lp.nome}</option>
          ))}
        </select>
      </div>
      <div className="gb-form-linha">
        <div className="gb-form-grupo" style={{ flex: "0 0 140px" }}>
          <label>Nível *</label>
          <select value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })}>
            <option value="">-- Selecionar --</option>
            {NIVEIS_FIXOS.map((n) => (
              <option key={n.codigo} value={n.codigo}>{n.codigo} — {n.nome}</option>
            ))}
          </select>
        </div>
        <div className="gb-form-grupo gb-form-grupo--largo">
          <label>Nome</label>
          <input type="text" value={nomeDerivado} disabled style={{ background: "#f3f4f6", color: "#6b7280" }} />
        </div>
      </div>
      <div className="gb-form-grupo">
        <label>Descrição</label>
        <input type="text" placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </div>
      {erro && <p className="gb-feedback gb-feedback--erro">{erro}</p>}
    </Modal>
  );
}

// ── Modal criar / editar Requisito ────────────────────────────────
function ModalRequisito({ requisitoEditar, submetendo, onFechar, onGuardar, stacked }) {
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
    <Modal titulo={requisitoEditar ? "Editar Requisito" : "Novo Requisito"} onFechar={onFechar} stacked={stacked} footer={
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

const CODIGO_NIVEL_LABEL = { A: "Júnior", B: "Intermédio", C: "Sénior", D: "Especialista", E: "Líder de Conhecimento" };

const LP_CORES = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#f97316","#6366f1"];
const lpCor = (idlearningpath) => LP_CORES[(idlearningpath - 1) % LP_CORES.length];

// ── Modal editar Badge ────────────────────────────────────────────
function ModalEditarBadge({ badge, hierarquia, onFechar, onGuardar }) {
  // ── Detalhes ─────────────────────────────────────────────────
  const [form, setForm] = useState({
    nome: badge.nome || "",
    descricao: badge.descricao || "",
    pontos: badge.pontos ?? "",
    expiremeses: badge.expiremeses ?? "",
    linkpublicobase: badge.linkpublicobase || "",
    ispublico: badge.ispublico ?? true,
    competencias: badge.competencias || "",
    idnivel: badge.idnivel || "",
  });
  // imagemurl existente (URL do Cloudinary) vs ficheiro novo por carregar
  const [imagemAtual, setImagemAtual] = useState(badge.imagemurl || "");
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(badge.imagemurl || "");
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleFileSelect = (file) => {
    if (!file) {
      setPendingFile(null);
      setPreviewUrl(imagemAtual);
      return;
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ── Cascata SL → Área → Nível (pré-seleciona o atual) ─────────
  const [slSel, setSlSel] = useState(badge.idserviceline ? String(badge.idserviceline) : "");
  const [areaSel, setAreaSel] = useState(badge.idarea ? String(badge.idarea) : "");
  const areasFiltradas = slSel ? (hierarquia.find((sl) => sl.idserviceline == slSel)?.areas || []) : [];
  const niveisFiltrados = areaSel ? (areasFiltradas.find((a) => a.idarea == areaSel)?.niveis || []) : [];

  const handleNivelSelect = (idnivelStr) => {
    if (!idnivelStr) {
      setForm((p) => ({ ...p, idnivel: "" }));
      return;
    }
    const n = niveisFiltrados.find((n) => n.idnivel == idnivelStr);
    if (n) setForm((p) => ({ ...p, idnivel: n.idnivel }));
  };

  // ── Requisitos locais ─────────────────────────────────────────
  const [reqs, setReqs] = useState(badge.requisitos ? [...badge.requisitos] : []);
  const [reqEdit, setReqEdit] = useState(null); // null | requisito (sem idrequisito = novo)
  const [subReq, setSubReq] = useState(false);
  const [feedReq, setFeedReq] = useState("");
  const toastReq = (msg) => { setFeedReq(msg); setTimeout(() => setFeedReq(""), 3000); };

  const handleGuardarReq = async (formReq) => {
    setSubReq(true);
    const isEdit = !!reqEdit?.idrequisito;
    const url = isEdit ? `${API}/requisitos/${reqEdit.idrequisito}` : `${API}/requisitos`;
    const body = isEdit
      ? { codigo: formReq.codigo, titulo: formReq.titulo, descricao: formReq.descricao, imagemurl: formReq.imagemurl || null }
      : { idbadge: badge.idbadge, codigo: formReq.codigo, titulo: formReq.titulo, descricao: formReq.descricao, imagemurl: formReq.imagemurl || null };
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubReq(false);
    if (!res.ok) { toastReq(`Erro: ${data.error}`); return; }
    if (isEdit) {
      setReqs((prev) => prev.map((r) => r.idrequisito === reqEdit.idrequisito
        ? { ...r, ...formReq, imagemurl: formReq.imagemurl || null }
        : r));
      toastReq("Requisito atualizado.");
    } else {
      setReqs((prev) => [...prev, {
        idrequisito: data.idrequisito, idbadge: badge.idbadge,
        codigo: formReq.codigo, titulo: formReq.titulo,
        descricao: formReq.descricao, imagemurl: formReq.imagemurl || null, ativo: true,
      }]);
      toastReq("Requisito criado.");
    }
    setReqEdit(null);
  };

  const handleToggleReq = async (idrequisito, ativoAtual) => {
    const res = await fetch(`${API}/requisitos/${idrequisito}/ativo`, { method: "PATCH" });
    if (!res.ok) return;
    setReqs((prev) => prev.map((r) => r.idrequisito === idrequisito ? { ...r, ativo: !ativoAtual } : r));
    toastReq(ativoAtual ? "Requisito desativado." : "Requisito reativado.");
  };

  // ── Submit detalhes ───────────────────────────────────────────
  const submit = async () => {
    if (!form.nome.trim()) { setErro("O nome é obrigatório."); return; }
    if (form.pontos === "") { setErro("Os pontos são obrigatórios."); return; }
    setErro("");
    setUploading(true);
    try {
      let imagemurl = previewUrl && !pendingFile ? imagemAtual : "";
      if (pendingFile) imagemurl = await uploadParaCloudinary(pendingFile);
      onGuardar({ ...form, imagemurl });
    } catch (e) {
      setErro(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Modal titulo={`Editar Badge — ${badge.nome}`} onFechar={onFechar} footer={
        <>
          <button className="gb-btn-confirmar" onClick={submit} disabled={uploading}>
            {uploading ? "A enviar imagem..." : "Guardar detalhes"}
          </button>
          <button className="gb-btn-cancelar" onClick={onFechar}>Fechar</button>
        </>
      }>
        {/* ── Detalhes ── */}
        <div className="gb-modal-secao-titulo">Detalhes</div>
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
            <label>Imagem</label>
            <ImageUpload previewUrl={previewUrl} onFileSelect={handleFileSelect} />
          </div>
        </div>
        <div className="gb-form-linha">
          <div className="gb-form-grupo gb-form-grupo--largo">
            <label>Link público base</label>
            <input type="text" placeholder="URL base (opcional)" value={form.linkpublicobase} onChange={f("linkpublicobase")} />
          </div>
          <div className="gb-form-grupo gb-form-grupo--largo">
            <label>Competências</label>
            <input type="text" placeholder="Ex: React, Node.js (opcional)" value={form.competencias} onChange={f("competencias")} />
          </div>
          <div className="gb-form-grupo gb-form-grupo--check">
            <label>
              <input type="checkbox" checked={form.ispublico} onChange={(e) => setForm({ ...form, ispublico: e.target.checked })} />
              Público
            </label>
          </div>
        </div>
        {erro && <p className="gb-feedback gb-feedback--erro">{erro}</p>}

        {/* ── Nível ── */}
        <div className="gb-modal-secao">
          <div className="gb-modal-secao-titulo">Associação Hierárquica</div>
          <div className="gb-form-linha">
            <div className="gb-form-grupo gb-form-grupo--largo">
              <label>Service Line</label>
              <select value={slSel} onChange={(e) => { setSlSel(e.target.value); setAreaSel(""); setForm((p) => ({ ...p, idnivel: "" })); }}>
                <option value="">-- Selecionar --</option>
                {hierarquia.map((sl) => (
                  <option key={sl.idserviceline} value={sl.idserviceline}>{sl.nome}</option>
                ))}
              </select>
            </div>
            <div className="gb-form-grupo gb-form-grupo--largo">
              <label>Área</label>
              <select value={areaSel} onChange={(e) => { setAreaSel(e.target.value); setForm((p) => ({ ...p, idnivel: "" })); }} disabled={!slSel}>
                <option value="">-- Selecionar --</option>
                {areasFiltradas.map((a) => (
                  <option key={a.idarea} value={a.idarea}>{a.nome}</option>
                ))}
              </select>
            </div>
            <div className="gb-form-grupo gb-form-grupo--largo">
              <label>Nível</label>
              <select value={form.idnivel} onChange={(e) => handleNivelSelect(e.target.value)} disabled={!areaSel}>
                <option value="">-- Selecionar --</option>
                {niveisFiltrados.map((n) => (
                  <option key={n.idnivel} value={n.idnivel}>{n.codigo} — {CODIGO_NIVEL_LABEL[n.codigo] || n.nome}</option>
                ))}
              </select>
            </div>
          </div>
          {form.idnivel && (
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
              Nível selecionado: <strong>{CODIGO_NIVEL_LABEL[niveisFiltrados.find((n) => n.idnivel == form.idnivel)?.codigo] || form.idnivel}</strong>
            </p>
          )}
        </div>

        {/* ── Requisitos ── */}
        <div className="gb-modal-secao">
          <div className="gb-modal-secao-titulo">
            Requisitos
            <span className="gb-secao-count" style={{ marginLeft: "0.5rem" }}>{reqs.length}</span>
          </div>
          {feedReq && <p className="gb-feedback gb-feedback--sucesso">{feedReq}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {reqs.length === 0 && <p className="gb-vazio-inner">Sem requisitos ainda.</p>}
            {reqs.map((req) => (
              <div key={req.idrequisito} className={`gb-req-item${req.ativo ? "" : " gb-inativo"}`}>
                <span className="gb-req-codigo">{req.codigo}</span>
                <span className="gb-req-titulo" style={{ flex: 1 }}>{req.titulo}</span>
                {!req.ativo && <span className="gb-tag-inativo">Inativo</span>}
                <div className="gb-req-acoes">
                  <button className="gb-icon-btn" title="Editar requisito" onClick={() => setReqEdit(req)}>✏</button>
                  <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${req.ativo ? "off" : "on"}`}
                    title={req.ativo ? "Desativar" : "Reativar"}
                    onClick={() => handleToggleReq(req.idrequisito, req.ativo)}>
                    {req.ativo ? "🗑" : "↩"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="gb-btn-add-req" style={{ marginTop: "0.5rem" }}
            onClick={() => setReqEdit({ codigo: "", titulo: "", descricao: "", imagemurl: "" })}>
            + Adicionar Requisito
          </button>
        </div>
      </Modal>

      {/* Modal de requisito — aparece sobre o modal do badge */}
      {reqEdit && (
        <ModalRequisito
          stacked
          requisitoEditar={reqEdit.idrequisito ? reqEdit : null}
          submetendo={subReq}
          onFechar={() => setReqEdit(null)}
          onGuardar={handleGuardarReq}
        />
      )}
    </>
  );
}

// ── Modal criar Badge ─────────────────────────────────────────────
function ModalCriarBadge({ hierarquia, onFechar, onGuardar }) {
  const [form, setForm] = useState({
    nome: "", descricao: "", pontos: "",
    expiremeses: "", linkpublicobase: "", ispublico: true,
    competencias: "", idnivel: "",
  });
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const [slSel, setSlSel] = useState("");
  const [areaSel, setAreaSel] = useState("");
  const areasFiltradas = slSel ? (hierarquia.find((sl) => sl.idserviceline == slSel)?.areas || []) : [];
  const niveisFiltrados = areaSel ? (areasFiltradas.find((a) => a.idarea == areaSel)?.niveis || []) : [];

  const handleNivelSelect = (idnivelStr) => {
    if (!idnivelStr) { setForm((p) => ({ ...p, idnivel: "" })); return; }
    const n = niveisFiltrados.find((n) => n.idnivel == idnivelStr);
    if (n) setForm((p) => ({ ...p, idnivel: n.idnivel }));
  };

  const handleFileSelect = (file) => {
    if (!file) { setPendingFile(null); setPreviewUrl(""); return; }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!form.nome.trim()) { setErro("O nome é obrigatório."); return; }
    if (form.pontos === "") { setErro("Os pontos são obrigatórios."); return; }
    setErro("");
    setUploading(true);
    try {
      let imagemurl = "";
      if (pendingFile) imagemurl = await uploadParaCloudinary(pendingFile);
      onGuardar({ ...form, imagemurl });
    } catch (e) {
      setErro(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal titulo="Novo Badge" onFechar={onFechar} footer={
      <>
        <button className="gb-btn-confirmar" onClick={submit} disabled={uploading}>
          {uploading ? "A enviar imagem..." : "Criar badge"}
        </button>
        <button className="gb-btn-cancelar" onClick={onFechar}>Cancelar</button>
      </>
    }>
      <div className="gb-modal-secao-titulo">Detalhes</div>
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
          <label>Imagem</label>
          <ImageUpload previewUrl={previewUrl} onFileSelect={handleFileSelect} />
        </div>
      </div>
      <div className="gb-form-linha">
        <div className="gb-form-grupo gb-form-grupo--largo">
          <label>Competências</label>
          <input type="text" placeholder="Ex: React, Node.js (opcional)" value={form.competencias} onChange={f("competencias")} />
        </div>
        <div className="gb-form-grupo gb-form-grupo--check">
          <label>
            <input type="checkbox" checked={form.ispublico} onChange={(e) => setForm({ ...form, ispublico: e.target.checked })} />
            Público
          </label>
        </div>
      </div>
      {erro && <p className="gb-feedback gb-feedback--erro">{erro}</p>}

      <div className="gb-modal-secao">
        <div className="gb-modal-secao-titulo">Associação Hierárquica</div>
        <div className="gb-form-linha">
          <div className="gb-form-grupo gb-form-grupo--largo">
            <label>Service Line</label>
            <select value={slSel} onChange={(e) => { setSlSel(e.target.value); setAreaSel(""); setForm((p) => ({ ...p, idnivel: "" })); }}>
              <option value="">-- Selecionar --</option>
              {hierarquia.map((sl) => (
                <option key={sl.idserviceline} value={sl.idserviceline}>{sl.nome}</option>
              ))}
            </select>
          </div>
          <div className="gb-form-grupo gb-form-grupo--largo">
            <label>Área</label>
            <select value={areaSel} onChange={(e) => { setAreaSel(e.target.value); setForm((p) => ({ ...p, idnivel: "" })); }} disabled={!slSel}>
              <option value="">-- Selecionar --</option>
              {areasFiltradas.map((a) => (
                <option key={a.idarea} value={a.idarea}>{a.nome}</option>
              ))}
            </select>
          </div>
          <div className="gb-form-grupo gb-form-grupo--largo">
            <label>Nível</label>
            <select value={form.idnivel} onChange={(e) => handleNivelSelect(e.target.value)} disabled={!areaSel}>
              <option value="">-- Selecionar --</option>
              {niveisFiltrados.map((n) => (
                <option key={n.idnivel} value={n.idnivel}>{n.codigo} — {CODIGO_NIVEL_LABEL[n.codigo] || n.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────────
function GestaoBadges() {
  const [hierarquia, setHierarquia] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [lpExp, setLpExp] = useState(true);
  const [slExp, setSlExp] = useState({});
  const [areaExp, setAreaExp] = useState({});
  const [modalLP, setModalLP] = useState(null);          // { lp? }
  const [modalEditSL, setModalEditSL] = useState(null);
  const [modalEditArea, setModalEditArea] = useState(null);
  const [modalNivel, setModalNivel] = useState(null);    // { idarea, nivel? }
  const [modalEditBadge, setModalEditBadge] = useState(null);
  const [modalCriarBadge, setModalCriarBadge] = useState(false);

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
      const [resH, resLP, resB] = await Promise.all([
        fetch(`${API}/hierarquia`),
        fetch(`${API}/learningpaths`),
        fetch(`${API}/badges-com-requisitos`),
      ]);
      const h = await resH.json();
      const lps = await resLP.json();
      const bs = await resB.json();
      setHierarquia(Array.isArray(h) ? h : []);
      setLearningPaths(Array.isArray(lps) ? lps : []);
      setBadges(Array.isArray(bs) ? bs : []);

      const sl = {}, ar = {};
      h.forEach((s) => {
        sl[s.idserviceline] = true;
        s.areas.forEach((a) => { ar[a.idarea] = true; });
      });
      setSlExp(sl); setAreaExp(ar);
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



  // ── Badges ────────────────────────────────────────────────────
  const handleCriarBadge = async (form) => {
    setSubmetendo(true);
    const res = await fetch(`${API}/badges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: form.nome,
        descricao: form.descricao || null,
        imagemurl: form.imagemurl || null,
        pontos: Number(form.pontos),
        expiremeses: form.expiremeses !== "" ? Number(form.expiremeses) : null,
        linkpublicobase: form.linkpublicobase || null,
        ispublico: form.ispublico,
        competencias: form.competencias || null,
        idnivel: form.idnivel || null,
      }),
    });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast("Badge criado.");
    setModalCriarBadge(false);
    carregar();
  };

  const handleEditarBadge = async (form) => {
    setSubmetendo(true);
    const res = await fetch(`${API}/badges/${modalEditBadge.idbadge}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: form.nome,
        descricao: form.descricao || null,
        imagemurl: form.imagemurl || null,
        pontos: Number(form.pontos),
        expiremeses: form.expiremeses !== "" ? Number(form.expiremeses) : null,
        linkpublicobase: form.linkpublicobase || null,
        ispublico: form.ispublico,
        competencias: form.competencias || null,
        idnivel: form.idnivel || null,
      }),
    });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast("Badge atualizado.");
    setModalEditBadge(null);
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

                            {/* Agrupa níveis por Learning Path */}
                            {Object.values(
                              area.niveis.reduce((acc, n) => {
                                const key = n.idlearningpath || "sem-lp";
                                if (!acc[key]) acc[key] = { idlearningpath: n.idlearningpath, lp_nome: n.lp_nome, niveis: [] };
                                acc[key].niveis.push(n);
                                return acc;
                              }, {})
                            ).map((grupo) => (
                              <div key={grupo.idlearningpath || "sem-lp"} className="gb-lp-grupo">
                                <div className="gb-lp-grupo-header" style={{ borderLeftColor: lpCor(grupo.idlearningpath) }}>
                                  <span className="gb-lp-grupo-nome" style={{ color: lpCor(grupo.idlearningpath) }}>
                                    {grupo.lp_nome || "Sem Learning Path"}
                                  </span>
                                </div>
                                <div className="gb-lp-grupo-niveis">
                                  {grupo.niveis.map((nivel) => (
                                    <div key={nivel.idnivel} className={`gb-nivel-card${nivel.ativo ? "" : " gb-inativo"}`}>
                                      <div className="gb-nivel-header">
                                        <div className="gb-nivel-esquerda">
                                          <span className="gb-nivel-codigo-badge" style={{ backgroundColor: `${lpCor(nivel.idlearningpath)}18`, color: lpCor(nivel.idlearningpath) }}>
                                            {nivel.codigo}
                                          </span>
                                          <span className="gb-nivel-nome">{nivel.nome}</span>
                                          {!nivel.ativo && <span className="gb-tag-inativo">Inativo</span>}
                                        </div>
                                        <div className="gb-nivel-acoes">
                                          <button className="gb-icon-btn" title="Editar nível"
                                            onClick={() => setModalNivel({ idarea: area.idarea, nivel })}>✏</button>
                                          <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${nivel.ativo ? "off" : "on"}`}
                                            title={nivel.ativo ? "Desativar" : "Reativar"}
                                            onClick={() => handleToggle("nivel", nivel.idnivel, nivel.ativo)}>
                                            {nivel.ativo ? "🗑" : "↩"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
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

        {/* ── SECÇÃO BADGES ── */}
        <div className="gb-secao">
          <div className="gb-secao-header">
            <h2 className="gb-secao-titulo">Badges</h2>
            <span className="gb-secao-count">{badges.length}</span>
            <button className="gb-btn-add-inline" style={{ marginLeft: "auto" }} onClick={() => setModalCriarBadge(true)}>
              + Novo Badge
            </button>
          </div>
          <div className="gb-secao-body">
            {badges.length === 0 && <div className="gb-vazio">Nenhum badge encontrado.</div>}
            {badges.map((badge) => (
              <div key={badge.idbadge} className={`gb-sl-card${badge.ativo ? "" : " gb-inativo"}`}>
                <div className="gb-sl-header">
                  {badge.imagemurl && (
                    <img src={badge.imagemurl} alt={badge.nome} style={{ width: 32, height: 32, borderRadius: 6, marginRight: 8, objectFit: "cover" }} />
                  )}
                  <span className="gb-sl-nome">{badge.nome}</span>
                  {badge.sl_nome && <span className="gb-nivel-lp">{badge.sl_nome}</span>}
                  {badge.area_nome && <span className="gb-nivel-lp">{badge.area_nome}</span>}
                  {badge.nivel_codigo && <span className="gb-nivel-lp">{CODIGO_NIVEL_LABEL[badge.nivel_codigo] || badge.nivel_codigo}</span>}
                  <span className="gb-badge-pontos" style={{ marginLeft: 8 }}>{badge.pontos} pts</span>
                  {!badge.ativo && <span className="gb-tag-inativo">Inativo</span>}
                  <div className="gb-sl-acoes">
                    <button className="gb-icon-btn" title="Editar badge"
                      onClick={() => setModalEditBadge(badge)}>✏</button>
                    <button
                      className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${badge.ativo ? "off" : "on"}`}
                      title={badge.ativo ? "Desativar" : "Reativar"}
                      onClick={() => handleToggle("badge", badge.idbadge, badge.ativo)}>
                      {badge.ativo ? "🗑" : "↩"}
                    </button>
                  </div>
                </div>
                {badge.descricao && <p style={{ margin: "4px 8px 0", fontSize: 13, color: "#6b7280" }}>{badge.descricao}</p>}
                {badge.requisitos.length > 0 && (
                  <div className="gb-requisitos" style={{ margin: "8px 12px" }}>
                    <p className="gb-requisitos-titulo">Requisitos ({badge.requisitos.length})</p>
                    {badge.requisitos.map((req) => (
                      <div key={req.idrequisito} className={`gb-req-item${req.ativo ? "" : " gb-inativo"}`}>
                        <span className="gb-req-codigo">{req.codigo}</span>
                        <span className="gb-req-titulo">{req.titulo}</span>
                        {!req.ativo && <span className="gb-tag-inativo">Inativo</span>}
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
      {modalCriarBadge && (
        <ModalCriarBadge
          hierarquia={hierarquia}
          onFechar={() => setModalCriarBadge(false)}
          onGuardar={handleCriarBadge}
        />
      )}
      {modalEditBadge && (
        <ModalEditarBadge
          badge={modalEditBadge}
          hierarquia={hierarquia}
          onFechar={() => setModalEditBadge(null)}
          onGuardar={handleEditarBadge}
        />
      )}
    </>
  );
}

export default GestaoBadges;
