import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/TalentMDashboard.css"
import Navbar from "../NavBar"

import { GoHome } from "react-icons/go";
import { API_BASE } from "../../api";
import { MdOutlineVerified } from "react-icons/md";
import { BsClockHistory, BsTrophy, BsBarChart, BsPeopleFill, BsAwardFill, BsGraphUp, BsExclamationTriangleFill } from "react-icons/bs";
import { AiOutlineAppstore } from "react-icons/ai";
import { FiUsers } from "react-icons/fi";
import { filtrarBadgesProximosExpiracao } from "../../utils/expiracaoTm";
import { NAV_TALENT } from "../../utils/navConfig";



export default function DashBoard() {
    const navigate = useNavigate();
    const [totalConsultores, setTotalConsultores] = useState("...");
    const [totalBadges, setTotalBadges] = useState("...");
    const [totalPendentes, setTotalPendentes] = useState("...");
    const [topConsultores, setTopConsultores] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [badgesProximosExpiracao, setBadgesProximosExpiracao] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/admin/utilizadores`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setTotalConsultores(data.length);
                } else {
                    setTotalConsultores(0);
                }
            })
            .catch((err) => {
                console.error("Erro ao buscar consultores:", err);
                setTotalConsultores("-");
            });
    }, []);

    useEffect(() => {
        fetch(`${API_BASE}/admin/badges`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setTotalBadges(data.length);
                } else {
                    setTotalBadges(0);
                }
            })
            .catch((err) => {
                console.error("Erro ao buscar badges:", err);
                setTotalBadges("-");
            });
    }, []);

    useEffect(() => {
        fetch(`${API_BASE}/candidaturas/tm/lista`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    const pendentes = data.filter(c => c.estado === 'SUBMITTED');
                    setTotalPendentes(pendentes.length);
                    // Histórico Recente
                    const resolvidas = data.filter(c => c.estado !== 'SUBMITTED').slice(0, 4);
                    setRecentActivity(resolvidas);
                } else {
                    setTotalPendentes(0);
                    setRecentActivity([]);
                }
            })
            .catch((err) => {
                console.error("Erro ao buscar candidaturas pendentes:", err);
                setTotalPendentes("-");
                setRecentActivity([]);
            });
    }, []);

    useEffect(() => {
        fetch(`${API_BASE}/talent/ranking`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    // Pegar os top 5
                    setTopConsultores(data.slice(0, 5));
                }
            })
            .catch((err) => {
                console.error("Erro ao buscar ranking de consultores:", err);
            });
    }, []);

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/admin/utilizadores`).then((res) => res.json()).catch(() => []),
            fetch(`${API_BASE}/admin/badges`).then((res) => res.json()).catch(() => []),
        ])
            .then(async ([utilizadores, badges]) => {
                if (!Array.isArray(utilizadores) || !Array.isArray(badges)) {
                    setBadgesProximosExpiracao([]);
                    return;
                }

                const consultores = utilizadores.filter((u) => String(u.idrole) === "1");
                const meta = Object.fromEntries(badges.map((badge) => [badge.idbadge, badge]));

                const resultados = await Promise.all(
                    consultores.map(async (consultor) => {
                        try {
                            const res = await fetch(`${API_BASE}/candidaturas/minhas?idutilizador=${consultor.idutilizador}`);
                            const candidaturas = await res.json();
                            const aprovadas = Array.isArray(candidaturas)
                                ? candidaturas.filter((c) => c.estado?.toUpperCase() === "APPROVED")
                                : [];

                            const badgesConsultor = aprovadas
                                .map((c) => ({
                                    ...c,
                                    ...meta[c.idbadge],
                                    nomeConsultor: consultor.nome,
                                    dataconquista: c.dataaprovacao || c.datacriacao,
                                }))
                                .filter((badge) => badge?.expiremeses && badge?.dataconquista);

                            return filtrarBadgesProximosExpiracao(badgesConsultor, 3);
                        } catch {
                            return [];
                        }
                    })
                );

                setBadgesProximosExpiracao(resultados.flat());
            })
            .catch(() => setBadgesProximosExpiracao([]));
    }, []);


    return (
        <div className="tm-dashboard-container">
            <Navbar navItems={NAV_TALENT} />

            <main className="tm-dashboard-content">
                <div className="tm-dashboard-header">
                    <h1>Visão Geral</h1>
                    <p>Resumo da sua equipa e atividade recente.</p>
                </div>

                {badgesProximosExpiracao.length > 0 && (
                    <div className="tm-expiracao-banner">
                        <div className="tm-expiracao-banner-icon"><BsExclamationTriangleFill /></div>
                        <div>
                            <h2>Badges próximos da data de expiração</h2>
                            <ul>
                                {badgesProximosExpiracao.slice(0, 5).map((badge) => (
                                    <li key={`${badge.idutilizador}-${badge.idbadge}`}>
                                        <strong>{badge.nomeConsultor}</strong> - {badge.nome} ({badge.texto || "próximo da expiração"})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <div className="tm-dashboard-cards">
                    <div className="tm-card">
                        <div className="tm-card-icon bg-blue">
                            <BsPeopleFill size={24} />
                        </div>
                        <div className="tm-card-info">
                            <h3>Consultores</h3>
                            <p className="tm-card-value">{totalConsultores}</p>
                        </div>
                    </div>

                    <div className="tm-card">
                        <div className="tm-card-icon bg-orange">
                            <MdOutlineVerified size={24} />
                        </div>
                        <div className="tm-card-info">
                            <h3>Total de Badges</h3>
                            <p className="tm-card-value">{totalBadges}</p>
                        </div>
                    </div>

                    <div className="tm-card" onClick={() => navigate("/talent/validacoes")} style={{ cursor: 'pointer' }}>
                        <div className="tm-card-icon bg-purple">
                            <BsClockHistory size={24} />
                        </div>
                        <div className="tm-card-info">
                            <h3>Pendente Validação</h3>
                            <p className="tm-card-value">{totalPendentes}</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid para ranking e atalhos rápidos */}
                <div className="tm-dashboard-grid">
                    {/* Secção de Ranking */}
                    <div className="tm-dashboard-sections">
                        <div className="tm-section">
                            <h2><BsTrophy /> Top Consultores (Destaques)</h2>
                            <div className="tm-ranking-list">
                                {topConsultores.length > 0 ? (
                                    topConsultores.map((cons, index) => {
                                        const initials = cons.nome ? cons.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "C";
                                        return (
                                            <div key={cons.idutilizador} className="tm-ranking-row">
                                                <span className={`tm-rank-badge rank-${index + 1}`}>
                                                    {index + 1}
                                                </span>
                                                {cons.fotourl ? (
                                                    <img src={cons.fotourl.startsWith("data:") ? cons.fotourl : `data:image/jpeg;base64,${cons.fotourl}`} alt={cons.nome} className="tm-rank-avatar" />
                                                ) : (
                                                    <div className="tm-rank-avatar-placeholder" style={{ backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : '#3b82f6' }}>
                                                        {initials}
                                                    </div>
                                                )}
                                                <div className="tm-rank-info">
                                                    <span className="tm-rank-name">{cons.nome}</span>
                                                    <span className="tm-rank-meta">{cons.serviceline || "Sem Service Line"} • {cons.area || "Sem Área"}</span>
                                                </div>
                                                <span className="tm-rank-points">{cons.pontos} pts</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nenhum consultor encontrado.</p>
                                )}
                            </div>


                        </div>

                    </div>

                    {/* Secção de Atividade Recente */}
                    <div className="tm-dashboard-sections">
                        <div className="tm-section">
                            <h2><BsClockHistory /> Atividade e Validações Recentes</h2>
                            <div className="tm-activity-list">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((act) => {
                                        const initials = act.consultor_nome ? act.consultor_nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "C";
                                        const dateStr = act.datasubmissao ? new Date(act.datasubmissao).toLocaleDateString("pt-PT") : new Date(act.datacriacao).toLocaleDateString("pt-PT");
                                        const statusCls = act.estado === 'APPROVED' ? 'bg-green' : act.estado === 'REJECTED' ? 'bg-red' : 'bg-blue';
                                        const statusLabel = act.estado === 'APPROVED' ? 'Aprovado' : act.estado === 'REJECTED' ? 'Rejeitado' : act.estado;

                                        return (
                                            <div key={act.idcandidatura} className="tm-activity-item">
                                                <div className={`tm-activity-dot ${statusCls}`}></div>
                                                <div className="tm-activity-text">
                                                    <strong>{act.consultor_nome}</strong> candidatou-se a <strong>{act.badge_nome}</strong>
                                                    <br />
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Submetido em: {dateStr} • {statusLabel}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Nenhuma validação recente.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
