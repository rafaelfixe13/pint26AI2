import { useEffect, useState } from "react";
import "../../styles/GestaoBadges.css";
import AdminNav from "./AdminNav";
import { API_BASE } from "../../api";
import { BsX, BsFileEarmarkText, BsPencil, BsTrash, BsArrowCounterclockwise } from "react-icons/bs";

const API = `${API_BASE}/admin`;

// previewUrl: URL a mostrar
// onFileSelect: (File | null) => void chama quando o utilizador escolhe/remove
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
        <button type="button" className="gb-image-upload-remover" onClick={() => onFileSelect(null)} title="Remover imagem"><BsX /></button>
      )}
    </div>
  );
}

// converte um ficehrio para base64
function fileParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Erro ao ler o ficheiro."));
    reader.readAsDataURL(file);
  });
}

//Input inline 
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

//Modal genérico
function Modal({ titulo, onFechar, children, footer, stacked }) {
  return (
    <div className={`gb-modal-overlay${stacked ? " gb-modal-overlay--stacked" : ""}`} onClick={onFechar}>
      <div className="gb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gb-modal-header">
          <h2 className="gb-modal-titulo">{titulo}</h2>
          <button className="gb-modal-fechar" onClick={onFechar}><BsX /></button>
        </div>
        <div className="gb-modal-body">{children}</div>
        {footer && <div className="gb-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

//editar nome
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

//LP
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

const letraDoNivelNome = (nome) => {
  const c = NIVEIS_FIXOS.find((n) => n.nome === nome)?.codigo;
  if (c) return c;
  const f = (nome || "").trim().charAt(0).toUpperCase();
  return ["A", "B", "C", "D", "E"].includes(f) ? f : "";
};
const ordenarNiveis = (lista) =>
  [...(lista || [])].sort((a, b) => letraDoNivelNome(a.nome).localeCompare(letraDoNivelNome(b.nome)));

//criar/editar Requisito
function ModalRequisito({ requisitoEditar, submetendo, onFechar, onGuardar, stacked }) {
  const [form, setForm] = useState(
    requisitoEditar
      ? { codigo: requisitoEditar.codigo, titulo: requisitoEditar.titulo, descricao: requisitoEditar.descricao, imagemurl: requisitoEditar.imagemurl || "" }
      : { codigo: "", titulo: "", descricao: "", imagemurl: "" }
  );
  const [erro, setErro] = useState("");
  const [convertendo, setConvertendo] = useState(false);
  const [filename, setFilename] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Ficheiro do requisito em base64
  const handleFicheiro = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setConvertendo(true);
    try {
      const base64 = await fileParaBase64(file);
      setForm((p) => ({ ...p, imagemurl: base64 }));
      setFilename(file.name);
    } catch (err) {
      setErro(err.message);
    } finally {
      setConvertendo(false);
    }
  };

  const removerFicheiro = () => { setForm((p) => ({ ...p, imagemurl: "" })); setFilename(""); };

  const ehPdf = form.imagemurl?.startsWith("data:application/pdf");
  const ehImagem = !!form.imagemurl && !ehPdf;

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
        <label>Ficheiro (imagem ou PDF) — opcional</label>
        <div className="gb-image-upload">
          {ehImagem && (
            <img src={form.imagemurl} alt="Preview" className="gb-image-upload-preview" />
          )}
          {ehPdf && (
            <span style={{ fontSize: 13, color: "#374151" }}><BsFileEarmarkText /> {filename || "documento.pdf"}</span>
          )}
          <label className="gb-image-upload-btn">
            {convertendo ? "A processar..." : form.imagemurl ? "Trocar ficheiro" : "Escolher ficheiro"}
            <input type="file" accept="image/*,application/pdf" onChange={handleFicheiro} style={{ display: "none" }} />
          </label>
          {form.imagemurl && (
            <button type="button" className="gb-image-upload-remover" onClick={removerFicheiro} title="Remover ficheiro"><BsX /></button>
          )}
        </div>
      </div>
      {erro && <p className="gb-feedback gb-feedback--erro">{erro}</p>}
    </Modal>
  );
}

function ModalNivel({ nivelEditar, submetendo, onFechar, onGuardar }) {
  const [form, setForm] = useState(
    nivelEditar
      ? { nome: nivelEditar.nome || "", descricao: nivelEditar.descricao || "" }
      : { nome: "", descricao: "" }
  );
  const [erro, setErro] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = () => {
    if (!form.nome.trim()) { setErro("O nome / código é obrigatório (ex: A)."); return; }
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
        <label>Nome / Código *</label>
        <input type="text" placeholder="Ex: A" maxLength={50} value={form.nome} onChange={f("nome")} />
      </div>
      <div className="gb-form-grupo">
        <label>Descrição</label>
        <input type="text" placeholder="Ex: Nível Júnior (opcional)" value={form.descricao} onChange={f("descricao")} />
      </div>
      <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>
        Os níveis são globais e partilhados por todas as áreas.
      </p>
      {erro && <p className="gb-feedback gb-feedback--erro">{erro}</p>}
    </Modal>
  );
}

function ModalApagarNivel({ nivel, badgesAfetados, submetendo, onFechar, onConfirmar }) {
  const bloqueado = badgesAfetados > 0;
  return (
    <Modal titulo="Apagar Nível" onFechar={onFechar} footer={
      bloqueado ? (
        <button className="gb-btn-cancelar" onClick={onFechar}>Fechar</button>
      ) : (
        <>
          <button className="gb-btn-apagar" onClick={onConfirmar} disabled={submetendo}>
            {submetendo ? "A apagar..." : "Apagar"}
          </button>
          <button className="gb-btn-cancelar" onClick={onFechar}>Cancelar</button>
        </>
      )
    }>
      {bloqueado ? (
        <p className="gb-feedback gb-feedback--erro" style={{ margin: 0 }}>
          Não é possível apagar o nível «{nivel.nome}»: <strong>{badgesAfetados} badge(s)</strong> usam este nível.
          Tens de alterar o nível desses badges antes de o poderes apagar.
        </p>
      ) : (
        <p style={{ margin: 0 }}>
          Tens a certeza que queres apagar o nível <strong>{nivel.nome}</strong>
          {nivel.descricao ? ` (${nivel.descricao})` : ""}? Esta ação é permanente.
        </p>
      )}
    </Modal>
  );
}

const CODIGO_NIVEL_LABEL = { A: "Júnior", B: "Intermédio", C: "Sénior", D: "Especialista", E: "Líder de Conhecimento" };

const LP_CORES = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#f97316","#6366f1"];
const lpCor = (idlearningpath) => LP_CORES[(idlearningpath - 1) % LP_CORES.length];

// editar Badge
function ModalEditarBadge({ badge, hierarquia, niveis, onFechar, onGuardar }) {
  const [form, setForm] = useState({
    nome: badge.nome || "",
    descricao: badge.descricao || "",
    pontos: badge.pontos ?? "",
    expiremeses: badge.expiremeses ?? "",
    linkpublicobase: badge.linkpublicobase || "",
    ispublico: badge.ispublico ?? true,
    competencias: badge.competencias || "",
    idnivel: badge.idnivel || "",
    idarea: badge.idarea || "",
  });
  const [imagemAtual] = useState(badge.imagemurl || "");
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(badge.imagemurl || "");
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleFileSelect = (file) => {
    if (!file) { setPendingFile(null); setPreviewUrl(imagemAtual); return; }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  //sl-area-nvl
  const [slSel, setSlSel] = useState(badge.idserviceline ? String(badge.idserviceline) : "");
  const [areaSel, setAreaSel] = useState(badge.idarea ? String(badge.idarea) : "");
  const areasFiltradas = slSel
    ? (hierarquia.find((sl) => sl.idserviceline == slSel)?.areas || [])
    : [];
  const niveisOrdenados = ordenarNiveis(niveis);

  const handleAreaSelect = (idareaStr) => {
    setAreaSel(idareaStr);
    setForm((p) => ({ ...p, idarea: idareaStr ? Number(idareaStr) : "" }));
  };

  const handleNivelSelect = (idnivelStr) => {
    setForm((p) => ({ ...p, idnivel: idnivelStr ? Number(idnivelStr) : "" }));
  };

  // Requisitos
  const [reqs, setReqs] = useState(badge.requisitos ? [...badge.requisitos] : []);
  const [reqEdit, setReqEdit] = useState(null);
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

  const submit = async () => {
    if (!form.nome.trim()) { setErro("O nome é obrigatório."); return; }
    if (form.pontos === "") { setErro("Os pontos são obrigatórios."); return; }
    setErro("");
    setUploading(true);
    try {
      // FIX: usa imagemAtual se não há ficheiro novo
      const imagemurl = pendingFile ? await fileParaBase64(pendingFile) : (imagemAtual || "");
      onGuardar({ ...form, imagemurl });
    } catch (e) {
      setErro(e.message);
    } finally {
      setUploading(false);
    }
  };

  const nivelSelecionadoNome = niveisOrdenados.find((n) => n.idnivel == form.idnivel)?.nome || "";

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

        {/* Associação Hierárquica */}
        <div className="gb-modal-secao">
          <div className="gb-modal-secao-titulo">Associação Hierárquica</div>
          <div className="gb-form-linha">
            <div className="gb-form-grupo gb-form-grupo--largo">
              <label>Service Line</label>
              <select value={slSel} onChange={(e) => {
                setSlSel(e.target.value);
                setAreaSel("");
                setForm((p) => ({ ...p, idarea: "", idnivel: "" }));
              }}>
                <option value="">-- Selecionar --</option>
                {hierarquia.map((sl) => (
                  <option key={sl.idserviceline} value={sl.idserviceline}>{sl.nome}</option>
                ))}
              </select>
            </div>
            <div className="gb-form-grupo gb-form-grupo--largo">
              <label>Área</label>
              <select value={areaSel} onChange={(e) => handleAreaSelect(e.target.value)} disabled={!slSel}>
                <option value="">-- Selecionar --</option>
                {areasFiltradas.map((a) => (
                  <option key={a.idarea} value={a.idarea}>{a.nome}</option>
                ))}
              </select>
            </div>
            <div className="gb-form-grupo gb-form-grupo--largo">
              <label>Nível</label>
              <select value={form.idnivel} onChange={(e) => handleNivelSelect(e.target.value)}>
                <option value="">-- Selecionar --</option>
                {niveisOrdenados.map((n) => (
                  <option key={n.idnivel} value={n.idnivel}>
                    {letraDoNivelNome(n.nome) ? `${letraDoNivelNome(n.nome)} — ${n.nome}` : n.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {form.idnivel && nivelSelecionadoNome && (
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
              Nível selecionado: <strong>{nivelSelecionadoNome}</strong>
            </p>
          )}
        </div>

        {/* Requisitos */}
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
                  <button className="gb-icon-btn" title="Editar requisito" onClick={() => setReqEdit(req)}><BsPencil /></button>
                  <button
                    className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${req.ativo ? "off" : "on"}`}
                    title={req.ativo ? "Desativar" : "Reativar"}
                    onClick={() => handleToggleReq(req.idrequisito, req.ativo)}>
                    {req.ativo ? <BsTrash /> : <BsArrowCounterclockwise />}
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

//criar Badge
function ModalCriarBadge({ hierarquia, especiais, niveis, onFechar, onGuardar }) {
  const [form, setForm] = useState({
    nome: "", descricao: "", pontos: "",
    expiremeses: "", linkpublicobase: "", ispublico: true,
    competencias: "", idnivel: "", idarea: "", idespecial: "",
  });
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState("");
  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const [slSel, setSlSel] = useState("");
  const [areaSel, setAreaSel] = useState("");
  const areasFiltradas = slSel
    ? (hierarquia.find((sl) => sl.idserviceline == slSel)?.areas || [])
    : [];
  
  const niveisOrdenados = ordenarNiveis(niveis);

  const handleAreaSelect = (idareaStr) => {
    setAreaSel(idareaStr);
    setForm((p) => ({ ...p, idarea: idareaStr ? Number(idareaStr) : "" }));
  };

  const handleNivelSelect = (idnivelStr) => {
    setForm((p) => ({ ...p, idnivel: idnivelStr ? Number(idnivelStr) : "" }));
  };

  const handleFileSelect = (file) => {
    if (!file) { setPendingFile(null); setPreviewUrl(""); return; }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Requisitos definidos localmente
  const [reqs, setReqs] = useState([]);
  const [reqEdit, setReqEdit] = useState(null);

  const guardarReqLocal = (formReq) => {
    setReqs((prev) =>
      reqEdit && reqEdit._idx != null
        ? prev.map((r, i) => (i === reqEdit._idx ? { ...formReq } : r))
        : [...prev, { ...formReq }]
    );
    setReqEdit(null);
  };
  const removerReqLocal = (idx) => setReqs((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!form.nome.trim()) { setErro("O nome é obrigatório."); return; }
    if (form.pontos === "") { setErro("Os pontos são obrigatórios."); return; }
    setErro("");
    setUploading(true);
    try {
      const imagemurl = pendingFile ? await fileParaBase64(pendingFile) : "";
      onGuardar({ ...form, imagemurl, requisitos: reqs });
    } catch (e) {
      setErro(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
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
            <select value={slSel} onChange={(e) => {
              setSlSel(e.target.value);
              setAreaSel("");
              setForm((p) => ({ ...p, idarea: "", idnivel: "" }));
            }}>
              <option value="">-- Selecionar --</option>
              {hierarquia.map((sl) => (
                <option key={sl.idserviceline} value={sl.idserviceline}>{sl.nome}</option>
              ))}
            </select>
          </div>
          <div className="gb-form-grupo gb-form-grupo--largo">
            <label>Área</label>
            <select value={areaSel} onChange={(e) => handleAreaSelect(e.target.value)} disabled={!slSel}>
              <option value="">-- Selecionar --</option>
              {areasFiltradas.map((a) => (
                <option key={a.idarea} value={a.idarea}>{a.nome}</option>
              ))}
            </select>
          </div>
          <div className="gb-form-grupo gb-form-grupo--largo">
            <label>Nível</label>
            <select value={form.idnivel} onChange={(e) => handleNivelSelect(e.target.value)}>
              <option value="">-- Selecionar --</option>
              {niveisOrdenados.map((n) => (
                <option key={n.idnivel} value={n.idnivel}>
                  {letraDoNivelNome(n.nome) ? `${letraDoNivelNome(n.nome)} — ${n.nome}` : n.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="gb-modal-secao">
        <div className="gb-modal-secao-titulo">Badge Especial</div>
        <div className="gb-form-grupo">
          <label>Tipo especial</label>
          <select
            value={form.idespecial}
            onChange={(e) => setForm((p) => ({ ...p, idespecial: e.target.value ? Number(e.target.value) : "" }))}
          >
            <option value="">Nenhum (badge normal)</option>
            {especiais.map((esp) => (
              <option key={esp.idespecial} value={esp.idespecial}>{esp.nome}</option>
            ))}
          </select>
          {form.idespecial !== "" && (
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
              {especiais.find((esp) => esp.idespecial === form.idespecial)?.descricao}
            </p>
          )}
        </div>
      </div>

      {/* Requisitos*/}
      <div className="gb-modal-secao">
        <div className="gb-modal-secao-titulo">
          Requisitos
          <span className="gb-secao-count" style={{ marginLeft: "0.5rem" }}>{reqs.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {reqs.length === 0 && <p className="gb-vazio-inner">Sem requisitos ainda.</p>}
          {reqs.map((req, idx) => (
            <div key={idx} className="gb-req-item">
              <span className="gb-req-codigo">{req.codigo}</span>
              <span className="gb-req-titulo" style={{ flex: 1 }}>{req.titulo}</span>
              <div className="gb-req-acoes">
                <button className="gb-icon-btn" title="Editar requisito" onClick={() => setReqEdit({ ...req, _idx: idx })}><BsPencil /></button>
                <button className="gb-btn-toggle-ativo gb-btn-toggle-ativo--off" title="Remover" onClick={() => removerReqLocal(idx)}><BsTrash /></button>
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

    {reqEdit && (
      <ModalRequisito
        stacked
        requisitoEditar={reqEdit.codigo ? reqEdit : null}
        submetendo={false}
        onFechar={() => setReqEdit(null)}
        onGuardar={guardarReqLocal}
      />
    )}
    </>
  );
}


//Página principal
function GestaoBadges() {
  const [hierarquia, setHierarquia] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [badges, setBadges] = useState([]);
  const [especiais, setEspeciais] = useState([]);
  const [niveis, setNiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [lpExp, setLpExp] = useState(true);
  const [nivExp, setNivExp] = useState(true);
  const [slExp, setSlExp] = useState({});
  const [areaExp, setAreaExp] = useState({});
  const [modalLP, setModalLP] = useState(null);
  const [modalNivel, setModalNivel] = useState(null);
  const [modalApagarNivel, setModalApagarNivel] = useState(null);
  const [modalEditSL, setModalEditSL] = useState(null);
  const [modalEditArea, setModalEditArea] = useState(null);
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
      const [resH, resLP, resB, resE, resN] = await Promise.all([
        fetch(`${API}/hierarquia`),
        fetch(`${API}/learningpaths`),
        fetch(`${API}/badges-com-requisitos`),
        fetch(`${API}/especiais`),
        fetch(`${API}/niveis`),
      ]);
      const h = await resH.json();
      const lps = await resLP.json();
      const bs = await resB.json();
      const es = await resE.json();
      const ns = await resN.json();
      setHierarquia(Array.isArray(h) ? h : []);
      setLearningPaths(Array.isArray(lps) ? lps : []);
      setBadges(Array.isArray(bs) ? bs : []);
      setEspeciais(Array.isArray(es) ? es : []);
      setNiveis(Array.isArray(ns) ? ns : []);

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

  //soft delete
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

  // lp
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

  //sl
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

  //areas
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

  const handleGuardarNivel = async (form) => {
    setSubmetendo(true);
    const isEdit = !!modalNivel.nivel;
    const url = isEdit ? `${API}/niveis/${modalNivel.nivel.idnivel}` : `${API}/niveis`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: form.nome.trim(), descricao: form.descricao?.trim() || null }),
    });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); return; }
    toast(isEdit ? "Nível atualizado." : "Nível criado.");
    setModalNivel(null);
    carregar();
  };

  const handleApagarNivel = async () => {
    setSubmetendo(true);
    const res = await fetch(`${API}/niveis/${modalApagarNivel.nivel.idnivel}`, { method: "DELETE" });
    const data = await res.json();
    setSubmetendo(false);
    if (!res.ok) { toast(data.error, "erro"); setModalApagarNivel(null); return; }
    toast("Nível apagado.");
    setModalApagarNivel(null);
    carregar();
  };

  //badges
  const handleCriarBadge = async (form) => {
    setSubmetendo(true);
    try {
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
          idarea: form.idarea || null,
          idespecial: form.idespecial || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error, "erro"); return; }

      // Cria os requisitos definidos no modal (precisam do idbadge devolvido)
      const novoId = data.idbadge;
      const requisitos = form.requisitos || [];
      let falhas = 0;
      for (const r of requisitos) {
        if (!novoId) break;
        const rr = await fetch(`${API}/requisitos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idbadge: novoId,
            codigo: r.codigo,
            titulo: r.titulo,
            descricao: r.descricao,
            imagemurl: r.imagemurl || null,
          }),
        });
        if (!rr.ok) falhas++;
      }

      toast(falhas ? `Badge criado, mas ${falhas} requisito(s) falharam.` : "Badge criado.", falhas ? "erro" : "sucesso");
      setModalCriarBadge(false);
      carregar();
    } catch (e) {
      toast(e.message, "erro");
    } finally {
      setSubmetendo(false);
    }
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
        idarea: form.idarea || null,
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

        {/*Lp*/}
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
                    <button className="gb-icon-btn" onClick={() => setModalLP({ lp })}><BsPencil /></button>
                    <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${lp.ativo ? "off" : "on"}`}
                      title={lp.ativo ? "Desativar" : "Reativar"}
                      onClick={() => handleToggle("lp", lp.idlearningpath, lp.ativo)}>
                      {lp.ativo ? <BsTrash /> : <BsArrowCounterclockwise />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="gb-secao">
          <div className="gb-secao-header" onClick={() => setNivExp((v) => !v)}>
            <span className="gb-secao-chevron">{nivExp ? "∨" : "›"}</span>
            <h2 className="gb-secao-titulo">Níveis</h2>
            <span className="gb-secao-count">{niveis.length}</span>
          </div>

          {nivExp && (
            <div className="gb-secao-body">
              <p className="gb-nivel-legenda">Níveis globais, partilhados por todas as áreas e usados ao criar badges.</p>
              <div className="gb-area-add">
                <button className="gb-btn-add-nivel" onClick={() => setModalNivel({})}>+ Adicionar Nível</button>
              </div>

              {niveis.length === 0 && <p className="gb-vazio-inner">Nenhum nível criado ainda.</p>}

              {niveis.map((nivel) => (
                <div key={nivel.idnivel} className="gb-lp-item">
                  <div className="gb-lp-info">
                    <span className="gb-nivel-codigo-badge" style={{ backgroundColor: `${lpCor(nivel.idnivel)}18`, color: lpCor(nivel.idnivel) }}>
                      {nivel.nome}
                    </span>
                    {nivel.descricao && <span className="gb-lp-desc">{nivel.descricao}</span>}
                  </div>
                  <div className="gb-sl-acoes">
                    <button className="gb-icon-btn" title="Editar nível" onClick={() => setModalNivel({ nivel })}><BsPencil /></button>
                    <button
                      className="gb-icon-btn gb-icon-btn--danger"
                      title="Apagar nível"
                      onClick={() => setModalApagarNivel({ nivel, badgesAfetados: badges.filter((b) => Number(b.idnivel) === Number(nivel.idnivel)).length })}
                    ><BsTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/*SL */}
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
                    <button className="gb-icon-btn" onClick={() => setModalEditSL({ id: sl.idserviceline, nome: sl.nome })}><BsPencil /></button>
                    <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${sl.ativo ? "off" : "on"}`}
                      title={sl.ativo ? "Desativar" : "Reativar"}
                      onClick={() => handleToggle("sl", sl.idserviceline, sl.ativo)}>
                      {sl.ativo ? <BsTrash /> : <BsArrowCounterclockwise />}
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
                          <span className="gb-area-nome">
                            {area.nome}
                          </span>
                          {!area.ativo && <span className="gb-tag-inativo">Inativo</span>}
                          <div className="gb-sl-acoes">
                            <button className="gb-icon-btn" onClick={() => setModalEditArea({ id: area.idarea, nome: area.nome })}><BsPencil /></button>
                            <button className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${area.ativo ? "off" : "on"}`}
                              title={area.ativo ? "Desativar" : "Reativar"}
                              onClick={() => handleToggle("area", area.idarea, area.ativo)}>
                              {area.ativo ? <BsTrash /> : <BsArrowCounterclockwise />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* badges */}
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
                      onClick={() => setModalEditBadge(badge)}><BsPencil /></button>
                    <button
                      className={`gb-btn-toggle-ativo gb-btn-toggle-ativo--${badge.ativo ? "off" : "on"}`}
                      title={badge.ativo ? "Desativar" : "Reativar"}
                      onClick={() => handleToggle("badge", badge.idbadge, badge.ativo)}>
                      {badge.ativo ? <BsTrash /> : <BsArrowCounterclockwise />}
                    </button>
                  </div>
                </div>
                {badge.descricao && <p style={{ margin: "4px 8px 0", fontSize: 13, color: "#6b7280" }}>{badge.descricao}</p>}
                {badge.requisitos?.length > 0 && (
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
      {modalNivel !== null && (
        <ModalNivel
          nivelEditar={modalNivel.nivel || null}
          submetendo={submetendo}
          onFechar={() => setModalNivel(null)}
          onGuardar={handleGuardarNivel}
        />
      )}
      {modalApagarNivel && (
        <ModalApagarNivel
          nivel={modalApagarNivel.nivel}
          badgesAfetados={modalApagarNivel.badgesAfetados}
          submetendo={submetendo}
          onFechar={() => setModalApagarNivel(null)}
          onConfirmar={handleApagarNivel}
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
      {modalCriarBadge && (
        <ModalCriarBadge
          hierarquia={hierarquia}
          especiais={especiais}
          niveis={niveis}
          onFechar={() => setModalCriarBadge(false)}
          onGuardar={handleCriarBadge}
        />
      )}
      {modalEditBadge && (
        <ModalEditarBadge
          badge={modalEditBadge}
          hierarquia={hierarquia}
          niveis={niveis}
          onFechar={() => setModalEditBadge(null)}
          onGuardar={handleEditarBadge}
        />
      )}
    </>
  );
}

export default GestaoBadges;
