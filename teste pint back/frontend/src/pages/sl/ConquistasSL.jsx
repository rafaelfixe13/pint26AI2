import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/ConquistasSL.css";
import { API_BASE } from "../../api";

import { GoHome } from "react-icons/go";
import { MdOutlineVerified, MdLeaderboard } from "react-icons/md";
import { AiOutlineAppstore, AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsTrophy, BsBarChart } from "react-icons/bs";
import { HiOutlineEmojiSad } from "react-icons/hi";
import { FaMedal, FaRocket, FaFire, FaRunning, FaBolt, FaAward, FaStar } from "react-icons/fa";
import { NAV_SL } from "../../utils/navConfig";

const getInitials = (nome) =>
  nome ? nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";

// Máximo de badges conquistados dentro de qualquer janela deslizante de `dias`.
function maxNumaJanela(datas, dias) {
  const ts = datas.map((d) => new Date(d).getTime()).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
  const janela = dias * 24 * 60 * 60 * 1000;
  let max = 0, ini = 0;
  for (let fim = 0; fim < ts.length; fim++) {
    while (ts[fim] - ts[ini] > janela) ini++;
    max = Math.max(max, fim - ini + 1);
  }
  return max;
}

// Máximo de badges conquistados no mesmo trimestre (ano+trimestre).
function maxNoTrimestre(datas) {
  const grupos = {};
  for (const d of datas) {
    const data = new Date(d);
    if (Number.isNaN(data.getTime())) continue;
    const chave = `${data.getFullYear()}-T${Math.floor(data.getMonth() / 3)}`;
    grupos[chave] = (grupos[chave] || 0) + 1;
  }
  return Object.values(grupos).reduce((m, v) => Math.max(m, v), 0);
}

//Catálogo de conquistas Premium (regras no código)
const CONQUISTAS = [
  { id: "primeiros", nome: "Primeiros Passos", icone: <FaMedal />, cor: "#b45309",
    descricao: "Conquistar o 1.º badge", regra: "1 badge aprovado",
    check: (c) => c.totalbadges >= 1 },
  { id: "ascensao", nome: "Em Ascensão", icone: <FaRocket />, cor: "#2563eb",
    descricao: "Conquistar 3 badges", regra: "3 badges aprovados",
    check: (c) => c.totalbadges >= 3 },
  { id: "imparavel", nome: "Imparável", icone: <FaFire />, cor: "#dc2626",
    descricao: "Conquistar 10 badges", regra: "10 badges aprovados",
    check: (c) => c.totalbadges >= 10 },
  { id: "maratonista", nome: "Maratonista", icone: <FaRunning />, cor: "#059669",
    descricao: "Ritmo intenso de conquistas", regra: "5 badges em 90 dias",
    check: (c) => maxNumaJanela(c.datasaprovacao, 90) >= 5 },
  { id: "sprint", nome: "Sprint Trimestral", icone: <FaBolt />, cor: "#d97706",
    descricao: "Forte desempenho num trimestre", regra: "3 badges no mesmo trimestre",
    check: (c) => maxNoTrimestre(c.datasaprovacao) >= 3 },
  { id: "centuriao", nome: "Centurião", icone: <FaAward />, cor: "#7c3aed",
    descricao: "Atingir 100 pontos", regra: "100 pontos acumulados",
    check: (c) => c.totalpontos >= 100 },
  { id: "elite", nome: "Elite", icone: <FaStar />, cor: "#0f766e",
    descricao: "Atingir 250 pontos", regra: "250 pontos acumulados",
    check: (c) => c.totalpontos >= 250 },
];

export default function ConquistasSL() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    if (!utilizador.idserviceline) { navigate("/perfil"); return; }
    fetch(`${API_BASE}/sl/conquistas?idserviceline=${utilizador.idserviceline}`)
      .then((r) => r.json())
      .then((data) => {
        // normaliza datasaprovacao para array
        const norm = (Array.isArray(data) ? data : []).map((c) => ({
          ...c,
          datasaprovacao: Array.isArray(c.datasaprovacao) ? c.datasaprovacao : [],
        }));
        setConsultores(norm);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);


  // Para cada conquista, que consultores a desbloquearam
  const conquistasComUnlocks = useMemo(
    () => CONQUISTAS.map((q) => ({
      ...q,
      unlocked: consultores.filter((c) => q.check(c)),
    })),
    [consultores]
  );

  // Para cada consultor, que conquistas desbloqueou
  const consultoresComConquistas = useMemo(
    () => consultores.map((c) => ({
      ...c,
      conquistas: CONQUISTAS.filter((q) => q.check(c)),
    })),
    [consultores]
  );

  return (
    <div className="page-wrapper">
      <Navbar navItems={NAV_SL} />

      <div className="cqsl-page">
        <div className="cqsl-header">
          <h1>Conquistas Especiais (Badges Premium)</h1>
          <p>Distinções de mérito desbloqueadas pelos consultores da sua Service Line ao atingir marcos especiais.</p>
        </div>

        {loading && (
          <div className="cqsl-status">
            <AiOutlineLoading3Quarters size={28} className="cqsl-spinner" />
            <p>A calcular conquistas...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Grelha de conquistas*/}
            <h2 className="cqsl-section-titulo">Conquistas Premium</h2>
            <div className="cqsl-grelha">
              {conquistasComUnlocks.map((q) => (
                <div key={q.id} className="cqsl-card">
                  <div className="cqsl-card-icone" style={{ background: q.cor }}>
                    <span>{q.icone}</span>
                  </div>
                  <div className="cqsl-card-corpo">
                    <h3>{q.nome}</h3>
                    <p className="cqsl-card-desc">{q.descricao}</p>
                    <span className="cqsl-regra">{q.regra}</span>
                  </div>
                  <div className="cqsl-card-rodape">
                    <span className="cqsl-unlock-count">{q.unlocked.length}</span>
                    <span className="cqsl-unlock-label">
                      {q.unlocked.length === 1 ? "consultor desbloqueou" : "consultores desbloquearam"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/*Por consultor*/}
            <h2 className="cqsl-section-titulo" style={{ marginTop: "2.5rem" }}>
              Consultores da Service Line
            </h2>

            {consultoresComConquistas.length === 0 ? (
              <div className="cqsl-status">
                <HiOutlineEmojiSad size={36} />
                <p>Nenhum consultor na Service Line.</p>
              </div>
            ) : (
              <div className="cqsl-consultores">
                {consultoresComConquistas.map((c) => (
                  <div key={c.idutilizador} className="cqsl-consultor">
                    <div className="cqsl-consultor-topo">
                      {c.fotourl ? (
                        <img src={c.fotourl.startsWith("data:") ? c.fotourl : `data:image/jpeg;base64,${c.fotourl}`} alt={c.nome} className="cqsl-avatar" />
                      ) : (
                        <div className="cqsl-avatar cqsl-avatar-iniciais">{getInitials(c.nome)}</div>
                      )}
                      <div className="cqsl-consultor-info">
                        <span className="cqsl-consultor-nome">{c.nome}</span>
                        <span className="cqsl-consultor-meta">
                          {c.area || "Sem área"} · {c.totalbadges} badges · {c.totalpontos} pts
                        </span>
                      </div>
                      <span className="cqsl-consultor-total">
                        {c.conquistas.length}/{CONQUISTAS.length}
                      </span>
                    </div>

                    {c.conquistas.length > 0 ? (
                      <div className="cqsl-medalhas">
                        {c.conquistas.map((q) => (
                          <span key={q.id} className="cqsl-medalha" title={`${q.nome} — ${q.regra}`}>
                            <span className="cqsl-medalha-icone" style={{ background: q.cor }}>{q.icone}</span>
                            {q.nome}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="cqsl-sem-medalhas">Ainda sem conquistas especiais.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
