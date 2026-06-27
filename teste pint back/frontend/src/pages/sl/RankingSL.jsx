import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/RankingSL.css";
import { API_BASE } from "../../api";

import { GoHome } from "react-icons/go";
import { MdOutlineVerified, MdLeaderboard } from "react-icons/md";
import { AiOutlineAppstore, AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsTrophy, BsBarChart, BsAwardFill, BsStarFill } from "react-icons/bs";
import { HiOutlineEmojiSad } from "react-icons/hi";
import { FaCrown } from "react-icons/fa";
import { NAV_SL } from "../../utils/navConfig";

const getInitials = (nome) =>
  nome ? nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";

export default function RankingSL() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criterio, setCriterio] = useState("badges"); // "badges" | "pontos"
  const [area, setArea] = useState("");

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    if (!utilizador.idserviceline) { navigate("/perfil"); return; }
    fetch(`${API_BASE}/sl/conquistas?idserviceline=${utilizador.idserviceline}`)
      .then((r) => r.json())
      .then((data) => { setConsultores(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);


  const areas = useMemo(() => {
    const s = new Set();
    consultores.forEach((c) => c.area && s.add(c.area));
    return [...s].sort();
  }, [consultores]);

  const ordenados = useMemo(() => {
    const lista = consultores
      .filter((c) => !area || c.area === area)
      .map((c) => ({ ...c, totalbadges: c.totalbadges || 0, totalpontos: c.totalpontos || 0 }));
    lista.sort((a, b) =>
      criterio === "pontos"
        ? b.totalpontos - a.totalpontos || b.totalbadges - a.totalbadges
        : b.totalbadges - a.totalbadges || b.totalpontos - a.totalpontos
    );
    return lista;
  }, [consultores, area, criterio]);

  const valor = (c) => (criterio === "pontos" ? c.totalpontos : c.totalbadges);
  const unidade = criterio === "pontos" ? "pts" : "badges";
  const maxValor = ordenados.length ? Math.max(...ordenados.map(valor), 1) : 1;
  const podio = ordenados.slice(0, 3);

  return (
    <div className="page-wrapper">
      <Navbar navItems={NAV_SL} />

      <div className="rksl-page">
        <div className="rksl-header">
          <h1>Ranking de Consultores</h1>
          <p>Compare o desempenho dos consultores da sua Service Line por badges ou pontos.</p>
        </div>

        <div className="rksl-controlos">
          <div className="rksl-toggle">
            <button className={criterio === "badges" ? "active" : ""} onClick={() => setCriterio("badges")}>
              <BsAwardFill size={14} /> Badges
            </button>
            <button className={criterio === "pontos" ? "active" : ""} onClick={() => setCriterio("pontos")}>
              <BsStarFill size={14} /> Pontos
            </button>
          </div>
          <select className="rksl-area" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Todas as áreas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {loading && (
          <div className="rksl-status">
            <AiOutlineLoading3Quarters size={28} className="rksl-spinner" />
            <p>A carregar ranking...</p>
          </div>
        )}

        {!loading && ordenados.length === 0 && (
          <div className="rksl-status">
            <HiOutlineEmojiSad size={36} />
            <p>Sem consultores para mostrar.</p>
          </div>
        )}

        {!loading && ordenados.length > 0 && (
          <>
            {/* Pódio */}
            <div className="rksl-podio">
              {[1, 0, 2].map((idx) => {
                const c = podio[idx];
                if (!c) return <div key={idx} className="rksl-pod rksl-pod-vazio" />;
                const pos = idx + 1;
                return (
                  <div key={c.idutilizador} className={`rksl-pod rksl-pod-${pos}`}>
                    {pos === 1 && <span className="rksl-coroa"><FaCrown /></span>}
                    {c.fotourl ? (
                      <img src={c.fotourl.startsWith("data:") ? c.fotourl : `data:image/jpeg;base64,${c.fotourl}`} alt={c.nome} className="rksl-pod-avatar" />
                    ) : (
                      <div className="rksl-pod-avatar rksl-pod-avatar-ph">{getInitials(c.nome)}</div>
                    )}
                    <span className="rksl-pod-nome">{c.nome}</span>
                    <span className="rksl-pod-valor">{valor(c)} {unidade}</span>
                    <div className="rksl-pod-base">{pos}º</div>
                  </div>
                );
              })}
            </div>

            {/* Tabela / barras */}
            <div className="rksl-lista">
              {ordenados.map((c, i) => (
                <div key={c.idutilizador} className="rksl-linha">
                  <span className={`rksl-pos ${i < 3 ? "top" : ""}`}>{i + 1}</span>
                  {c.fotourl ? (
                    <img src={c.fotourl.startsWith("data:") ? c.fotourl : `data:image/jpeg;base64,${c.fotourl}`} alt={c.nome} className="rksl-avatar" />
                  ) : (
                    <div className="rksl-avatar rksl-avatar-ph">{getInitials(c.nome)}</div>
                  )}
                  <div className="rksl-info">
                    <div className="rksl-info-topo">
                      <span className="rksl-nome">{c.nome}</span>
                      <span className="rksl-valor">{valor(c)} {unidade}</span>
                    </div>
                    <div className="rksl-barra-fundo">
                      <div className="rksl-barra" style={{ width: `${(valor(c) / maxValor) * 100}%` }} />
                    </div>
                    <span className="rksl-meta">
                      {c.area || "Sem área"} · {c.totalbadges} badges · {c.totalpontos} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
