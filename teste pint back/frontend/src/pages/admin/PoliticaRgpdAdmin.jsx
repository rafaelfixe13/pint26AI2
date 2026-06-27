import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import "../../styles/AdminRelatorios.css";
import "../../styles/InformacoesAdmin.css";
import { API_BASE } from "../../api";
import { BsShieldCheck, BsExclamationTriangle, BsCheck2 } from "react-icons/bs";

export default function PoliticaRgpdAdmin() {
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [meta, setMeta] = useState(null); // { versao, dataatualizacao }
  const [loading, setLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/politica-rgpd`)
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setTitulo(d.titulo || "");
          setConteudo(d.conteudo || "");
          setMeta({ versao: d.versao, dataatualizacao: d.dataatualizacao });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const guardar = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      setFeedback({ tipo: "erro", texto: "Título e conteúdo são obrigatórios." });
      setConfirmar(false);
      return;
    }
    setAGuardar(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/politica-rgpd`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), conteudo: conteudo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Falha ao guardar.");
      setMeta({ versao: data.politica?.versao, dataatualizacao: data.politica?.dataatualizacao });
      setFeedback({ tipo: "ok", texto: data.message });
    } catch (err) {
      setFeedback({ tipo: "erro", texto: err.message });
    } finally {
      setAGuardar(false);
      setConfirmar(false);
    }
  };

  const fmtData = (v) =>
    v ? new Date(v).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <>
      <AdminNav />
      <div className="adm-rel-page">
        <div className="adm-rel-header">
          <h1>Política RGPD</h1>
          <p>Edite o texto da política de proteção de dados apresentada aos utilizadores.</p>
        </div>

        {feedback && (
          <div className={`inf-feedback ${feedback.tipo === "ok" ? "ok" : "erro"}`}>
            {feedback.texto}
          </div>
        )}

        <div className="adm-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <BsShieldCheck size={20} color="#4f6ef7" />
            <h3 style={{ margin: 0 }}>Conteúdo da política</h3>
          </div>

          {meta && (
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 0 }}>
              Versão {meta.versao} · Atualizada em {fmtData(meta.dataatualizacao)}
            </p>
          )}

          {loading ? (
            <p>A carregar...</p>
          ) : (
            <div className="inf-form">
              <div className="adm-campo">
                <label>Título</label>
                <input
                  type="text"
                  value={titulo}
                  maxLength={200}
                  placeholder="Ex.: Termos de proteção de dados (RGPD)"
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div className="adm-campo">
                <label>Conteúdo</label>
                <textarea
                  rows={12}
                  value={conteudo}
                  placeholder="Escreva o texto da política..."
                  onChange={(e) => setConteudo(e.target.value)}
                />
              </div>

              <p className="inf-nota">
                <BsExclamationTriangle size={13} /> Ao guardar, o consentimento de <strong>todos os utilizadores</strong> é reposto: terão de voltar a aceitar a política.
              </p>

              {!confirmar ? (
                <div className="inf-form-acoes">
                  <button className="inf-btn-primario" onClick={() => setConfirmar(true)} disabled={aGuardar}>
                    <BsCheck2 size={15} /> Guardar política
                  </button>
                </div>
              ) : (
                <div className="inf-form-acoes">
                  <button className="inf-btn-toggle desativar" onClick={guardar} disabled={aGuardar}>
                    {aGuardar ? "A guardar..." : "Confirmar e repor consentimentos"}
                  </button>
                  <button className="inf-btn-secundario" onClick={() => setConfirmar(false)} disabled={aGuardar}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
