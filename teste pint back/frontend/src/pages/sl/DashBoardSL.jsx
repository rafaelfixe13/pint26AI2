import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/TalentMDashboard.css";
import { API_BASE } from "../../api";

import { GoHome } from "react-icons/go";
import { MdOutlineVerified, MdLeaderboard } from "react-icons/md";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsPeopleFill, BsAwardFill, BsClockHistory, BsHourglassSplit, BsStarFill, BsGraphUp, BsTrophy, BsBarChart } from "react-icons/bs";
import { FaMedal } from "react-icons/fa";
import { NAV_SL } from "../../utils/navConfig";

const getInitials = (nome) =>
  nome ? nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "C";

function estadoAtividade(estado) {
  const e = (estado || "").toUpperCase();
  if (e === "APPROVED")     return { cls: "bg-green",  label: "Aprovado" };
  if (e === "REJECTED")     return { cls: "bg-red",    label: "Rejeitado" };
  if (e === "UNDER_REVIEW") return { cls: "bg-purple", label: "Aguarda validação SL" };
  if (e === "SUBMITTED")    return { cls: "bg-orange", label: "Em validação TM" };
  if (e === "OPEN")         return { cls: "bg-blue",   label: "Devolvida" };
  return { cls: "bg-blue", label: estado };
}

export default function DashBoardSL() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(() => {
    if (!utilizador?.idserviceline) return;
    fetch(`${API_BASE}/sl/dashboard?idserviceline=${utilizador.idserviceline}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [utilizador?.idserviceline]);

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    if (!utilizador.idserviceline) { navigate("/perfil"); return; }
    carregar();
    const intervalo = setInterval(carregar, 20000); // atualização ~tempo real
    return () => clearInterval(intervalo);
  }, []);


  const kpis = data?.kpis ?? {};
  const maxArea = Math.max(1, ...(data?.porArea ?? []).map((a) => (a.atribuidos || 0) + (a.emprocesso || 0)));

  return (
    <div className="tm-dashboard-container">
      <Navbar navItems={NAV_SL} />

      <main className="tm-dashboard-content">
        <div className="tm-dashboard-header">
          <h1>Service Line {data?.serviceline?.nome ? `- ${data.serviceline.nome}` : ""}</h1>
          <p>Progresso dos badges e dos consultores da sua Service Line.</p>
        </div>

        {loading && <p style={{ color: "#64748b" }}>A carregar...</p>}

        {!loading && (
          <>
            {/* KPIs sobre badges */}
            <div className="tm-dashboard-cards">
              <div className="tm-card">
                <div className="tm-card-icon bg-blue"><BsPeopleFill size={24} /></div>
                <div className="tm-card-info">
                  <h3>Consultores</h3>
                  <p className="tm-card-value">{kpis.consultores ?? 0}</p>
                </div>
              </div>

              <div className="tm-card">
                <div className="tm-card-icon bg-green"><BsAwardFill size={24} /></div>
                <div className="tm-card-info">
                  <h3>Badges atribuídos</h3>
                  <p className="tm-card-value">{kpis.badgesAtribuidos ?? 0}</p>
                </div>
              </div>

              <div className="tm-card" style={{ cursor: "pointer" }} onClick={() => navigate("/sl/validacoes")}>
                <div className="tm-card-icon bg-purple"><MdOutlineVerified size={24} /></div>
                <div className="tm-card-info">
                  <h3>A aguardar validação</h3>
                  <p className="tm-card-value">{kpis.aguardamValidacao ?? 0}</p>
                </div>
              </div>

              <div className="tm-card">
                <div className="tm-card-icon bg-orange"><BsHourglassSplit size={24} /></div>
                <div className="tm-card-info">
                  <h3>Badges em processo</h3>
                  <p className="tm-card-value">{kpis.emProcesso ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Linha secundária de métricas de badges */}
            <div className="tm-dashboard-cards" style={{ marginTop: "-1.5rem" }}>
              <div className="tm-card">
                <div className="tm-card-icon bg-blue"><AiOutlineAppstore size={24} /></div>
                <div className="tm-card-info">
                  <h3>Badges no catálogo</h3>
                  <p className="tm-card-value">{kpis.badgesCatalogo ?? 0}</p>
                </div>
              </div>
              <div className="tm-card">
                <div className="tm-card-icon bg-green"><BsGraphUp size={24} /></div>
                <div className="tm-card-info">
                  <h3>Taxa de aprovação</h3>
                  <p className="tm-card-value">{kpis.taxaAprovacao != null ? `${kpis.taxaAprovacao}%` : "-"}</p>
                </div>
              </div>
              <div className="tm-card">
                <div className="tm-card-icon bg-purple"><BsStarFill size={24} /></div>
                <div className="tm-card-info">
                  <h3>Pontos da Service Line</h3>
                  <p className="tm-card-value">{kpis.totalPontos ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="tm-dashboard-grid">
              {/* Coluna esquerda */}
              <div className="tm-dashboard-sections">
                {/* Badges mais obtidos */}
                <div className="tm-section" style={{ marginBottom: "2rem" }}>
                  <h2><FaMedal /> Badges mais obtidos</h2>
                  <div className="tm-ranking-list">
                    {data?.topBadges?.length > 0 ? (
                      data.topBadges.map((b, i) => (
                        <div key={b.idbadge} className="tm-ranking-row">
                          <span className={`tm-rank-badge rank-${i + 1}`}>{i + 1}</span>
                          {b.imagemurl ? (
                            <img src={b.imagemurl} alt={b.nome} className="tm-rank-avatar" />
                          ) : (
                            <div className="tm-rank-avatar-placeholder" style={{ background: "#d97706" }}>
                              <FaMedal size={18} />
                            </div>
                          )}
                          <div className="tm-rank-info">
                            <span className="tm-rank-name">{b.nome}</span>
                            <span className="tm-rank-meta">{b.total} atribuição(ões)</span>
                          </div>
                          <span className="tm-rank-points">{b.total}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#64748b", fontSize: ".9rem" }}>Ainda sem badges atribuídos.</p>
                    )}
                  </div>
                </div>

                {/* Distribuição por área */}
                <div className="tm-section">
                  <h2><BsBarChart /> Badges por área</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {data?.porArea?.length > 0 ? (
                      data.porArea.map((a) => {
                        const total = (a.atribuidos || 0) + (a.emprocesso || 0);
                        const pctAtrib = `${((a.atribuidos || 0) / maxArea) * 100}%`;
                        const pctProc = `${((a.emprocesso || 0) / maxArea) * 100}%`;
                        return (
                          <div key={a.area}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", marginBottom: ".3rem" }}>
                              <span style={{ fontWeight: 600, color: "#334155" }}>{a.area}</span>
                              <span style={{ color: "#64748b" }}>
                                {a.atribuidos} atribuídos · {a.emprocesso} em processo
                              </span>
                            </div>
                            <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", background: "#f1f5f9" }}>
                              <div style={{ width: pctAtrib, background: "#10b981" }} title="Atribuídos" />
                              <div style={{ width: pctProc, background: "#f59e0b" }} title="Em processo" />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: "#64748b", fontSize: ".9rem" }}>Sem áreas nesta Service Line.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna direita */}
              <div className="tm-dashboard-sections">
                {/* Top consultores */}
                <div className="tm-section" style={{ marginBottom: "2rem" }}>
                  <h2><BsTrophy /> Top consultores</h2>
                  <div className="tm-ranking-list">
                    {data?.topConsultores?.length > 0 ? (
                      data.topConsultores.map((c, i) => (
                        <div key={c.idutilizador} className="tm-ranking-row">
                          <span className={`tm-rank-badge rank-${i + 1}`}>{i + 1}</span>
                          {c.fotourl ? (
                            <img src={c.fotourl.startsWith("data:") ? c.fotourl : `data:image/jpeg;base64,${c.fotourl}`} alt={c.nome} className="tm-rank-avatar" />
                          ) : (
                            <div className="tm-rank-avatar-placeholder">{getInitials(c.nome)}</div>
                          )}
                          <div className="tm-rank-info">
                            <span className="tm-rank-name">{c.nome}</span>
                            <span className="tm-rank-meta">{c.area || "Sem área"} · {c.badges} badges</span>
                          </div>
                          <span className="tm-rank-points">{c.pontos} pts</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#64748b", fontSize: ".9rem" }}>Nenhum consultor na Service Line.</p>
                    )}
                  </div>
                </div>

                {/* Atividade / histórico recente */}
                <div className="tm-section">
                  <h2><BsClockHistory /> Atividade recente</h2>
                  <div className="tm-activity-list">
                    {data?.atividade?.length > 0 ? (
                      data.atividade.map((act) => {
                        const info = estadoAtividade(act.estado);
                        const dateStr = new Date(
                          act.ultimaatualizacao || act.datacriacao
                        ).toLocaleDateString("pt-PT");
                        return (
                          <div key={act.idcandidatura} className="tm-activity-item">
                            <div className={`tm-activity-dot ${info.cls}`} />
                            <div className="tm-activity-text">
                              <strong>{act.consultor_nome}</strong> - <strong>{act.badge_nome}</strong>
                              <br />
                              <span style={{ color: "#64748b", fontSize: ".8rem" }}>
                                {act.area_nome ? `${act.area_nome} · ` : ""}{info.label} · {dateStr}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: "#64748b", fontSize: ".9rem", textAlign: "center", padding: "2rem 0" }}>
                        Sem atividade recente.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
