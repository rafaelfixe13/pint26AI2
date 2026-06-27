import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/Lembretes.css";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsAward, BsTrophy, BsExclamationTriangleFill } from "react-icons/bs";
import { FaMedal } from "react-icons/fa";
import { MdOutlineAssignment, MdLeaderboard } from "react-icons/md";
import { FiClock, FiTrash2, FiCheck, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiList, FiCalendar } from "react-icons/fi";
import { API_BASE } from "../../api";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Chave de dia (ano-mes-dia) em hora local
function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
}

// Hora local (HH:mm)
function fmtHora(d) {
  return new Date(d).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

import { NAV_CONSULTOR } from "../../utils/navConfig";

// Estado visual de um lembrete a partir do prazo + concluído
function estadoLembrete(l) {
  if (l.concluido) return { texto: "Concluído", cls: "lemb-estado-ok", expirado: false };
  const agora = new Date();
  const prazo = new Date(l.prazo);
  if (prazo <= agora) return { texto: "Prazo expirado", cls: "lemb-estado-atrasado", expirado: true };
  const dias = Math.ceil((prazo - agora) / (1000 * 60 * 60 * 24));
  if (dias <= 1) return { texto: "Termina hoje", cls: "lemb-estado-aviso", expirado: false };
  if (dias <= 7) return { texto: `Faltam ${dias} dia(s)`, cls: "lemb-estado-aviso", expirado: false };
  return { texto: `Faltam ${dias} dia(s)`, cls: "lemb-estado-pendente", expirado: false };
}

function ModalNovoLembrete({ badges, onFechar, onCriar, submetendo }) {
  const [form, setForm] = useState({ titulo: "", descricao: "", prazo: "", badge_id: "" });
  const [erro, setErro] = useState("");

  const submit = () => {
    if (!form.titulo.trim()) { setErro("O título é obrigatório."); return; }
    if (!form.prazo) { setErro("O prazo é obrigatório."); return; }
    setErro("");
    const badge = badges.find((b) => String(b.idbadge) === String(form.badge_id));
    onCriar({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      prazo: new Date(form.prazo).toISOString(),
      badge_id: form.badge_id ? Number(form.badge_id) : null,
      badge_nome: badge ? badge.nome : null,
    });
  };

  return (
    <div className="lemb-modal-overlay" onClick={onFechar}>
      <div className="lemb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lemb-modal-head">
          <h2>Novo lembrete</h2>
          <button className="lemb-modal-close" onClick={onFechar}><FiX size={18} /></button>
        </div>

        <div className="lemb-form-grupo">
          <label>Título *</label>
          <input type="text" placeholder="Ex: Cumprir requisitos até final do ano"
            value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        </div>

        <div className="lemb-form-grupo">
          <label>Descrição</label>
          <textarea rows={3} placeholder="Detalhes (opcional)"
            value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </div>

        <div className="lemb-form-linha">
          <div className="lemb-form-grupo">
            <label>Prazo (data e hora) *</label>
            <input type="datetime-local" value={form.prazo}
              onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
          </div>
          <div className="lemb-form-grupo">
            <label>Badge associado (em que estás inscrito/candidatado)</label>
            <select value={form.badge_id} onChange={(e) => setForm({ ...form, badge_id: e.target.value })}>
              <option value="">-- Nenhum --</option>
              {badges.map((b) => (
                <option key={b.idbadge} value={b.idbadge}>{b.nome}</option>
              ))}
            </select>
            {badges.length === 0 && (
              <span className="lemb-hint">Ainda não tens candidaturas a badges para associar.</span>
            )}
          </div>
        </div>

        {erro && <p className="lemb-erro">{erro}</p>}

        <div className="lemb-modal-acoes">
          <button className="lemb-btn-cancelar" onClick={onFechar}>Cancelar</button>
          <button className="lemb-btn-criar" onClick={submit} disabled={submetendo}>
            {submetendo ? "A criar..." : "Criar lembrete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Calendário mensal que marca cada lembrete no respetivo dia
function Calendario({ lembretes }) {
  const hoje = new Date();
  const [ref, setRef] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));

  const ano = ref.getFullYear();
  const mes = ref.getMonth();

  const porDia = {};
  lembretes.forEach((l) => {
    const k = dateKey(l.prazo);
    (porDia[k] = porDia[k] || []).push(l);
  });

  const primeiro = new Date(ano, mes, 1);
  const offset = (primeiro.getDay() + 6) % 7;
  const inicio = new Date(ano, mes, 1 - offset);

  const dias = Array.from({ length: 42 }, (_, i) =>
    new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i)
  );
  const hojeKey = dateKey(hoje);

  return (
    <div className="lemb-cal">
      <div className="lemb-cal-head">
        <button onClick={() => setRef(new Date(ano, mes - 1, 1))} title="Mês anterior"><FiChevronLeft size={18} /></button>
        <span className="lemb-cal-titulo">{MESES[mes]} {ano}</span>
        <button onClick={() => setRef(new Date(ano, mes + 1, 1))} title="Mês seguinte"><FiChevronRight size={18} /></button>
      </div>
      <div className="lemb-cal-grid lemb-cal-weekdays">
        {WEEKDAYS.map((w) => <div key={w} className="lemb-cal-weekday">{w}</div>)}
      </div>
      <div className="lemb-cal-grid">
        {dias.map((d, i) => {
          const k = dateKey(d);
          const itens = porDia[k] || [];
          return (
            <div key={i} className={`lemb-cal-cel ${d.getMonth() === mes ? "" : "fora"} ${k === hojeKey ? "hoje" : ""}`}>
              <span className="lemb-cal-num">{d.getDate()}</span>
              {itens.slice(0, 3).map((l) => {
                const est = estadoLembrete(l);
                return (
                  <span key={l.id} className={`lemb-cal-chip ${est.cls}`} title={`${fmtHora(l.prazo)} — ${l.titulo}`}>
                    {fmtHora(l.prazo)} {l.titulo}
                  </span>
                );
              })}
              {itens.length > 3 && <span className="lemb-cal-mais">+{itens.length - 3}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Lembretes() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [lembretes, setLembretes] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);
  const [vista, setVista] = useState("lista");

  const carregar = () => {
    if (!utilizador) return;
    fetch(`${API_BASE}/lembretes?utilizador_id=${utilizador.idutilizador}`)
      .then((r) => r.json())
      .then((data) => { setLembretes(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    carregar();
    // Badges associáveis
    fetch(`${API_BASE}/candidaturas/minhas?idutilizador=${utilizador.idutilizador}`)
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        const mapa = new Map();
        lista.forEach((c) => {
          if (c.idbadge && !mapa.has(c.idbadge)) {
            mapa.set(c.idbadge, { idbadge: c.idbadge, nome: c.badge_nome });
          }
        });
        setBadges([...mapa.values()]);
      })
      .catch(() => {});
  }, []);


  const criarLembrete = async (dados) => {
    setSubmetendo(true);
    try {
      const res = await fetch(`${API_BASE}/lembretes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dados, utilizador_id: utilizador.idutilizador }),
      });
      if (!res.ok) return;
      setModalAberto(false);
      carregar();
    } finally {
      setSubmetendo(false);
    }
  };

  const toggleConcluido = async (id) => {
    const res = await fetch(`${API_BASE}/lembretes/${id}/concluido`, { method: "PATCH" });
    if (res.ok) carregar();
  };

  const eliminar = async (id) => {
    const res = await fetch(`${API_BASE}/lembretes/${id}`, { method: "DELETE" });
    if (res.ok) carregar();
  };

  const fmtData = (d) => new Date(d).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="page-wrapper">
      <Navbar navItems={NAV_CONSULTOR} />

      {modalAberto && (
        <ModalNovoLembrete
          badges={badges}
          submetendo={submetendo}
          onFechar={() => setModalAberto(false)}
          onCriar={criarLembrete}
        />
      )}

      <div className="lemb-container">
        <div className="lemb-header">
          <div>
            <h1>Lembretes</h1>
            <p>Defina prazos e objetivos (ex: cumprir certos requisitos até uma data) e receba avisos.</p>
          </div>
          <button className="lemb-btn-novo" onClick={() => setModalAberto(true)}>
            <FiPlus size={16} /> Novo lembrete
          </button>
        </div>

        <div className="lemb-vista-toggle">
          <button className={vista === "lista" ? "ativo" : ""} onClick={() => setVista("lista")}>
            <FiList size={15} /> Lista
          </button>
          <button className={vista === "calendario" ? "ativo" : ""} onClick={() => setVista("calendario")}>
            <FiCalendar size={15} /> Calendário
          </button>
        </div>

        {loading ? (
          <div className="lemb-status">A carregar...</div>
        ) : vista === "calendario" ? (
          <Calendario lembretes={lembretes} />
        ) : lembretes.length === 0 ? (
          <div className="lemb-status">Ainda não tens lembretes. Cria o primeiro!</div>
        ) : (
          <div className="lemb-lista">
            {lembretes.map((l) => {
              const est = estadoLembrete(l);
              return (
                <div key={l.id} className={`lemb-card ${l.concluido ? "lemb-card-concluido" : ""} ${est.expirado ? "lemb-card-expirado" : ""}`}>
                  <div className="lemb-card-main">
                    <div className="lemb-card-top">
                      <span className="lemb-card-titulo">{l.titulo}</span>
                      <span className={`lemb-estado ${est.cls}`}>{est.texto}</span>
                    </div>
                    {est.expirado && (
                      <div className="lemb-card-aviso"><BsExclamationTriangleFill /> Este lembrete já passou do prazo ({fmtData(l.prazo)}).</div>
                    )}
                    {l.descricao && <p className="lemb-card-desc">{l.descricao}</p>}
                    <div className="lemb-card-meta">
                      <span><FiClock size={13} /> {fmtData(l.prazo)}</span>
                      {l.badge_nome && <span className="lemb-card-badge"><FaMedal /> {l.badge_nome}</span>}
                    </div>
                  </div>
                  <div className="lemb-card-acoes">
                    <button
                      className="lemb-acao lemb-acao-check"
                      title={l.concluido ? "Marcar como pendente" : "Marcar como concluído"}
                      onClick={() => toggleConcluido(l.id)}
                    >
                      <FiCheck size={15} />
                    </button>
                    <button className="lemb-acao lemb-acao-del" title="Eliminar" onClick={() => eliminar(l.id)}>
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lembretes;
