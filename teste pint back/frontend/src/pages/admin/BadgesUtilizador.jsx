import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { API_BASE } from "../../api";
import "../../styles/BadgesUtilizador.css";
import { IoArrowBackOutline } from "react-icons/io5";
import { BsCheckCircleFill, BsCircle } from "react-icons/bs";

function BadgesUtilizador() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [utilizador, setUtilizador] = useState(null);
  const [hierarquia, setHierarquia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [slExpandidas, setSlExpandidas] = useState({});
  const [areasExpandidas, setAreasExpandidas] = useState({});

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resUsers, resH] = await Promise.all([
          fetch(`${API_BASE}/admin/utilizadores`),
          fetch(`${API_BASE}/admin/utilizadores/${id}/badges`),
        ]);
        const users = await resUsers.json();
        const h = await resH.json();

        const u = users.find((u) => String(u.idutilizador) === String(id));
        if (!u) { setErro("Utilizador não encontrado."); return; }

        setUtilizador(u);
        setHierarquia(Array.isArray(h) ? h : []);

        if (h.length > 0) {
          setSlExpandidas({ [h[0].idserviceline]: true });
          if (h[0].areas?.length > 0) {
            setAreasExpandidas({ [h[0].areas[0].idarea]: true });
          }
        }
      } catch {
        setErro("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [id]);

  const toggleSl = (idsl) =>
    setSlExpandidas((p) => ({ ...p, [idsl]: !p[idsl] }));

  const toggleArea = (idarea) =>
    setAreasExpandidas((p) => ({ ...p, [idarea]: !p[idarea] }));

  const getInitials = (nome) => {
    if (!nome) return "?";
    return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  // badges é area.badges[]
  const badgesConquistados = (badges) =>
    badges.filter((b) => b.conquistado).length;

  const progressoBadge = (badge) => {
    const total = badge.requisitos.length;
    const feitos = badge.requisitos.filter((r) => r.concluido).length;
    return { feitos, total };
  };

  if (loading) return <><AdminNav /><div className="bu-loading">A carregar...</div></>;
  if (erro)    return <><AdminNav /><div className="bu-erro">{erro}</div></>;

  return (
    <>
      <AdminNav />
      <div className="bu-wrapper">

        {/* Cabeçalho */}
        <div className="bu-topo">
          <h1 className="bu-titulo">Badges do utilizador</h1>
          <button className="bu-voltar" onClick={() => navigate(`/admin/utilizadores/${id}`)}>
            <IoArrowBackOutline /> Voltar
          </button>
        </div>

        {/* Info utilizador */}
        <div className="bu-card-user">
          <div className="bu-user-foto">
            {utilizador.fotourl ? (
              <img src={utilizador.fotourl.startsWith("data:") ? utilizador.fotourl : `data:image/jpeg;base64,${utilizador.fotourl}`} alt={utilizador.nome} className="bu-foto" />
            ) : (
              <div className="bu-foto bu-foto-iniciais">{getInitials(utilizador.nome)}</div>
            )}
          </div>
          <div className="bu-user-info">
            <div className="bu-user-campo">
              <span className="bu-user-label">Nome<span className="bu-obrig">*</span></span>
              <span className="bu-user-valor">{utilizador.nome}</span>
            </div>
            <div className="bu-user-campo">
              <span className="bu-user-label">Email<span className="bu-obrig">*</span></span>
              <span className="bu-user-valor">{utilizador.email}</span>
            </div>
          </div>
        </div>

        {/* Service Lines */}
        {hierarquia.length === 0 && (
          <div className="bu-vazio">Nenhuma estrutura de badges disponível.</div>
        )}

        {hierarquia.map((sl) => (
          <div key={sl.idserviceline} className="bu-sl-bloco">

            <button className="bu-sl-header" onClick={() => toggleSl(sl.idserviceline)}>
              <span className="bu-sl-chevron">{slExpandidas[sl.idserviceline] ? "▾" : "▸"}</span>
              <span className="bu-sl-nome">{sl.nome}</span>
            </button>

            {slExpandidas[sl.idserviceline] && (
              <div className="bu-sl-body">
                {sl.areas.map((area) => {
                  const conquistados = badgesConquistados(area.badges);
                  const totalBadges = area.badges.length;

                  return (
                    <div key={area.idarea} className="bu-area-bloco">

                      <div className="bu-area-header" onClick={() => toggleArea(area.idarea)}>
                        <div className="bu-area-header-esq">
                          <span className="bu-area-chevron">
                            {areasExpandidas[area.idarea] ? "▾" : "▸"}
                          </span>
                          <div>
                            <span className="bu-area-nome">{area.nome}</span>
                            <span className="bu-area-sub">
                              {conquistados} de {totalBadges} badges conquistados
                            </span>
                          </div>
                        </div>
                        <span className="bu-area-contador">
                          {conquistados}/{totalBadges}
                        </span>
                      </div>

                      {areasExpandidas[area.idarea] && (
                        <div className="bu-niveis-grid">
                          {area.badges.map((badge) => {
                            const { feitos, total } = progressoBadge(badge);
                            const percentagem = total > 0 ? Math.round((feitos / total) * 100) : 0;
                            const conquistado = badge.conquistado;

                            return (
                              <div
                                key={badge.idbadge}
                                className={`bu-nivel-card ${conquistado ? "bu-nivel-card--conquistado" : ""}`}
                              >
                                {/* Ícone badge */}
                                <div className={`bu-badge-icone ${conquistado ? "bu-badge-icone--conquistado" : ""}`}>
                                  <svg viewBox="0 0 40 40" className="bu-badge-svg">
                                    <circle cx="20" cy="20" r="18" fill={conquistado ? "#1d4ed8" : "#e5e7eb"} />
                                    <circle cx="20" cy="20" r="12" fill={conquistado ? "#3b82f6" : "#f3f4f6"} />
                                    <circle cx="20" cy="20" r="6" fill={conquistado ? "#93c5fd" : "#d1d5db"} />
                                    {conquistado && (
                                      <path d="M16 20l3 3 6-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    )}
                                  </svg>
                                </div>

                                {/* Nome badge + nível */}
                                <div className="bu-nivel-nome">
                                  {badge.nome}
                                  {badge.nivel && (
                                    <span className="bu-nivel-tag"> — {badge.nivel}</span>
                                  )}
                                </div>

                                {/* Progresso */}
                                <div className="bu-progresso-row">
                                  <span className="bu-progresso-label">Progresso</span>
                                  <span className="bu-progresso-contagem">{feitos}/{total} requisitos</span>
                                </div>
                                <div className="bu-barra-wrap">
                                  <div
                                    className={`bu-barra-fill ${conquistado ? "bu-barra-fill--completo" : ""}`}
                                    style={{ width: `${percentagem}%` }}
                                  />
                                </div>

                                {/* Requisitos */}
                                {badge.requisitos.length > 0 && (
                                  <div className="bu-req-lista">
                                    <span className="bu-req-titulo-secao">Requisitos:</span>
                                    {badge.requisitos.map((req) => (
                                      <div key={req.idrequisito} className="bu-req-item">
                                        <span className={`bu-req-icone ${req.concluido ? "bu-req-icone--ok" : ""}`}>
                                          {req.concluido ? <BsCheckCircleFill /> : <BsCircle />}
                                        </span>
                                        <span className={`bu-req-texto ${req.concluido ? "bu-req-texto--ok" : ""}`}>
                                          {req.codigo}: {req.titulo}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default BadgesUtilizador;