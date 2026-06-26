import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import "../../styles/AdminRelatorios.css";
import "../../styles/InformacoesAdmin.css";
import { API_BASE } from "../../api";
import { BsBell, BsInfoCircle, BsBook, BsPlusLg, BsPencil, BsXLg } from "react-icons/bs";

// Tipo limitado por dropdown
const TIPOS = [
  { valor: "aviso", label: "Aviso" },
  { valor: "sobre", label: "Sobre" },
  { valor: "ajuda", label: "Ajuda" },
];

const TIPO_INFO = {
  aviso: { label: "Aviso", icon: <BsBell size={14} />, cls: "inf-tag-aviso" },
  sobre: { label: "Sobre", icon: <BsInfoCircle size={14} />, cls: "inf-tag-sobre" },
  ajuda: { label: "Ajuda", icon: <BsBook size={14} />, cls: "inf-tag-ajuda" },
};

const FORM_VAZIO = { tipo: "aviso", titulo: "", conteudo: "", ordem: 0, ativo: true };

export default function InformacoesAdmin() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [feedback, setFeedback] = useState(null);
  const [aGuardar, setAGuardar] = useState(false);

  const carregar = () => {
    setLoading(true);
    fetch(`${API_BASE}/informacoes`)
      .then((r) => r.json())
      .then((d) => setLista(Array.isArray(d) ? d : []))
      .catch(() => setLista([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const cancelarEdicao = () => {
    setEditId(null);
    setForm(FORM_VAZIO);
  };

  const guardar = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      setFeedback({ tipo: "erro", texto: "Título e conteúdo são obrigatórios." });
      return;
    }
    setAGuardar(true);
    setFeedback(null);

    const body = {
      tipo: form.tipo,
      titulo: form.titulo.trim(),
      conteudo: form.conteudo.trim(),
      ordem: Number(form.ordem) || 0,
    };
    if (!editId) body.ativo = form.ativo;

    try {
      const url = editId ? `${API_BASE}/informacoes/${editId}` : `${API_BASE}/informacoes`;
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Falha ao guardar.");

      const eraAvisoNovo = !editId && body.tipo === "aviso" && form.ativo;
      setFeedback({
        tipo: "ok",
        texto: editId
          ? "Informação atualizada."
          : eraAvisoNovo
          ? "Aviso criado e notificação enviada a todos os utilizadores."
          : "Informação criada.",
      });
      cancelarEdicao();
      carregar();
    } catch (err) {
      setFeedback({ tipo: "erro", texto: err.message });
    } finally {
      setAGuardar(false);
    }
  };

  const editar = (info) => {
    setEditId(info.idinformacao);
    setForm({
      tipo: info.tipo,
      titulo: info.titulo,
      conteudo: info.conteudo,
      ordem: info.ordem ?? 0,
      ativo: info.ativo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const alternarAtivo = async (info) => {
    try {
      const res = await fetch(`${API_BASE}/informacoes/${info.idinformacao}/ativo`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Falha ao alterar estado.");
      setLista((prev) =>
        prev.map((x) => (x.idinformacao === info.idinformacao ? { ...x, ativo: data.ativo } : x))
      );
    } catch (err) {
      setFeedback({ tipo: "erro", texto: err.message });
    }
  };

  const visiveis = filtro === "todos" ? lista : lista.filter((i) => i.tipo === filtro);

  return (
    <>
      <AdminNav />
      <div className="adm-rel-page">
        <div className="adm-rel-header">
          <h1>Informações e Avisos</h1>
          <p>Gere conteúdos genéricos (Sobre / Ajuda) e avisos. Avisos novos notificam todos os utilizadores.</p>
        </div>

        {feedback && (
          <div className={`inf-feedback ${feedback.tipo === "ok" ? "ok" : "erro"}`}>
            {feedback.texto}
          </div>
        )}

        {/* ── Formulário ── */}
        <div className="adm-card">
          <h3>{editId ? "Editar informação" : "Nova informação"}</h3>
          <div className="inf-form">
            <div className="adm-campo">
              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setCampo("tipo", e.target.value)} style={{ maxWidth: 220 }}>
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="adm-campo">
              <label>Título</label>
              <input
                type="text"
                value={form.titulo}
                maxLength={200}
                placeholder="Ex.: Manutenção programada"
                onChange={(e) => setCampo("titulo", e.target.value)}
              />
            </div>
            <div className="adm-campo">
              <label>Conteúdo</label>
              <textarea
                rows={4}
                value={form.conteudo}
                placeholder="Escreva o conteúdo..."
                onChange={(e) => setCampo("conteudo", e.target.value)}
              />
            </div>
            <div className="inf-form-linha">
              <div className="adm-campo" style={{ maxWidth: 120 }}>
                <label>Ordem</label>
                <input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setCampo("ordem", e.target.value)}
                />
              </div>
              {!editId && (
                <label className="inf-check">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setCampo("ativo", e.target.checked)}
                  />
                  Ativo
                </label>
              )}
            </div>

            {!editId && form.tipo === "aviso" && form.ativo && (
              <p className="inf-nota">
                <BsBell size={13} /> Este aviso será enviado como notificação a todos os utilizadores.
              </p>
            )}

            <div className="inf-form-acoes">
              <button className="inf-btn-primario" onClick={guardar} disabled={aGuardar}>
                {editId ? <BsPencil size={14} /> : <BsPlusLg size={14} />}
                {aGuardar ? "A guardar..." : editId ? "Guardar alterações" : "Adicionar"}
              </button>
              {editId && (
                <button className="inf-btn-secundario" onClick={cancelarEdicao}>
                  <BsXLg size={14} /> Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Filtro ── */}
        <div className="inf-filtros">
          {["todos", "aviso", "sobre", "ajuda"].map((f) => (
            <button
              key={f}
              className={`inf-filtro ${filtro === f ? "ativo" : ""}`}
              onClick={() => setFiltro(f)}
            >
              {f === "todos" ? "Todos" : TIPO_INFO[f].label}
            </button>
          ))}
        </div>

        {/* ── Lista ── */}
        {loading ? (
          <div className="adm-card"><p>A carregar...</p></div>
        ) : visiveis.length === 0 ? (
          <div className="adm-card"><p>Sem informações para mostrar.</p></div>
        ) : (
          <div className="inf-lista">
            {visiveis.map((info) => {
              const ti = TIPO_INFO[info.tipo] || TIPO_INFO.aviso;
              return (
                <div key={info.idinformacao} className={`inf-item ${info.ativo ? "" : "inativo"}`}>
                  <div className="inf-item-topo">
                    <span className={`inf-tag ${ti.cls}`}>{ti.icon} {ti.label}</span>
                    <span className={`inf-estado ${info.ativo ? "on" : "off"}`}>
                      {info.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <h4 className="inf-item-titulo">{info.titulo}</h4>
                  <p className="inf-item-conteudo">{info.conteudo}</p>
                  <div className="inf-item-acoes">
                    <button className="inf-btn-secundario" onClick={() => editar(info)}>
                      <BsPencil size={13} /> Editar
                    </button>
                    <button
                      className={`inf-btn-toggle ${info.ativo ? "desativar" : "ativar"}`}
                      onClick={() => alternarAtivo(info)}
                    >
                      {info.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
