import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import "../../styles/TalentMDashboard.css";
import "../../styles/AdminRelatorios.css";
import { API_BASE } from "../../api";
import { BsPeopleFill, BsAwardFill, BsClockHistory, BsPatchCheckFill, BsTrophy } from "react-icons/bs";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const rotuloMes = (ym) => {
  const [ano, mes] = (ym || "").split("-");
  const idx = Number(mes) - 1;
  return idx >= 0 && idx < 12 ? `${MESES[idx]}/${ano.slice(2)}` : ym;
};

const getInitials = (nome) =>
  nome ? nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "C";

function estadoAtividade(estado) {
  const e = (estado || "").toUpperCase();
  if (e === "APPROVED")     return { cls: "bg-green",  label: "Aprovado" };
  if (e === "REJECTED")     return { cls: "bg-red",    label: "Rejeitado" };
  if (e === "UNDER_REVIEW") return { cls: "bg-purple", label: "Em validação SL" };
  if (e === "SUBMITTED")    return { cls: "bg-orange", label: "Em validação TM" };
  if (e === "OPEN")         return { cls: "bg-blue",   label: "Devolvida" };
  return { cls: "bg-blue", label: estado };
}

// Visão geral do Administrador — métricas globais da plataforma.
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recente, setRecente] = useState([]);
  const [topConsultores, setTopConsultores] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/admin/estatisticas`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats(null));

    fetch(`${API_BASE}/candidaturas/tm/lista`)
      .then((r) => r.json())
      .then((d) => setRecente(Array.isArray(d) ? d.slice(0, 6) : []))
      .catch(() => {});

    fetch(`${API_BASE}/talent/ranking`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setTopConsultores(d.slice(0, 5)); })
      .catch(() => {});
  }, []);

  const t = stats?.totais;
  const totalAtribuidos = t?.badgesAtribuidos || 0;
  const maxMes = useMemo(
    () => Math.max(1, ...(stats?.badgesPorMes || []).map((m) => m.total)),
    [stats]
  );
  const maxNivel = useMemo(
    () => Math.max(1, ...(stats?.badgesPorNivel || []).map((n) => n.total)),
    [stats]
  );

  const v = (x) => (stats ? x ?? 0 : "...");

  const CARDS = [
    { label: "Utilizadores", valor: v(t?.utilizadores), icon: <BsPeopleFill size={24} />, cls: "bg-blue" },
    { label: "Badges no catálogo", valor: v(t?.badgesCatalogo), icon: <BsAwardFill size={24} />, cls: "bg-orange" },
    { label: "Pedidos em curso", valor: v(t?.pedidosEmCurso), icon: <BsClockHistory size={24} />, cls: "bg-purple", onClick: () => navigate("/admin/pedidos") },
    { label: "Badges atribuídos", valor: v(t?.badgesAtribuidos), icon: <BsPatchCheckFill size={24} />, cls: "bg-green" },
  ];

  return (
    <>
      <AdminNav />
      <div className="tm-dashboard-container">
        <main className="tm-dashboard-content">
          <div className="tm-dashboard-header">
            <h1>Visão Geral</h1>
            <p>Resumo da atividade da plataforma.</p>
          </div>

          <div className="tm-dashboard-cards">
            {CARDS.map((c) => (
              <div
                key={c.label}
                className="tm-card"
                style={c.onClick ? { cursor: "pointer" } : undefined}
                onClick={c.onClick}
              >
                <div className={`tm-card-icon ${c.cls}`}>{c.icon}</div>
                <div className="tm-card-info">
                  <h3>{c.label}</h3>
                  <p className="tm-card-value">{c.valor}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gráficos das estatísticas principais */}
          <div className="adm-charts-grid">
            <div className="adm-card">
              <h3>Badges atribuídos por mês</h3>
              {!stats ? (
                <p className="adm-empty">A carregar...</p>
              ) : (stats.badgesPorMes || []).length === 0 ? (
                <p className="adm-empty">Sem badges atribuídos.</p>
              ) : (
                <div className="adm-bars">
                  {stats.badgesPorMes.map((m) => {
                    const pct = totalAtribuidos ? Math.round((m.total / totalAtribuidos) * 100) : 0;
                    return (
                      <div key={m.mes} className="adm-bar-col" title={`${m.total} badges (${pct}%)`}>
                        <span className="adm-bar-val">{m.total}</span>
                        <div className="adm-bar" style={{ height: `${(m.total / maxMes) * 100}%` }} />
                        <span className="adm-bar-label">{rotuloMes(m.mes)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="adm-card">
              <h3>Badges por nível</h3>
              {!stats ? (
                <p className="adm-empty">A carregar...</p>
              ) : (stats.badgesPorNivel || []).length === 0 ? (
                <p className="adm-empty">Sem dados.</p>
              ) : (
                stats.badgesPorNivel.map((n) => (
                  <div key={n.nivel} className="adm-dist-row">
                    <span className="adm-dist-label" title={n.nivel}>{n.nivel}</span>
                    <div className="adm-dist-track">
                      <div className="adm-dist-fill" style={{ width: `${(n.total / maxNivel) * 100}%` }} />
                    </div>
                    <span className="adm-dist-val">{n.total}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="tm-dashboard-grid">
            {/* Top consultores */}
            <div className="tm-dashboard-sections">
              <div className="tm-section">
                <h2><BsTrophy /> Top Consultores</h2>
                <div className="tm-ranking-list">
                  {topConsultores.length > 0 ? (
                    topConsultores.map((c, i) => (
                      <div key={c.idutilizador} className="tm-ranking-row">
                        <span className={`tm-rank-badge rank-${i + 1}`}>{i + 1}</span>
                        {c.fotourl ? (
                          <img
                            src={c.fotourl.startsWith("data:") ? c.fotourl : `data:image/jpeg;base64,${c.fotourl}`}
                            alt={c.nome}
                            className="tm-rank-avatar"
                          />
                        ) : (
                          <div className="tm-rank-avatar-placeholder">{getInitials(c.nome)}</div>
                        )}
                        <div className="tm-rank-info">
                          <span className="tm-rank-name">{c.nome}</span>
                          <span className="tm-rank-meta">{c.serviceline || "Sem Service Line"} • {c.area || "Sem Área"}</span>
                        </div>
                        <span className="tm-rank-points">{c.pontos} pts</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Nenhum consultor encontrado.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Atividade recente */}
            <div className="tm-dashboard-sections">
              <div className="tm-section">
                <h2><BsClockHistory /> Pedidos recentes</h2>
                <div className="tm-activity-list">
                  {recente.length > 0 ? (
                    recente.map((act) => {
                      const info = estadoAtividade(act.estado);
                      const dateStr = new Date(act.ultimaatualizacao || act.datacriacao).toLocaleDateString("pt-PT");
                      return (
                        <div key={act.idcandidatura} className="tm-activity-item">
                          <div className={`tm-activity-dot ${info.cls}`} />
                          <div className="tm-activity-text">
                            <strong>{act.consultor_nome}</strong> — <strong>{act.badge_nome}</strong>
                            <br />
                            <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{info.label} · {dateStr}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: "#64748b", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>
                      Sem pedidos recentes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
