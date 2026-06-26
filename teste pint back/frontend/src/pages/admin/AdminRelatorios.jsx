import { useEffect, useMemo, useState } from "react";
import AdminNav from "./AdminNav";
import "../../styles/AdminRelatorios.css";
import { API_BASE } from "../../api";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { FiDownload } from "react-icons/fi";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const fmtData = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-PT");
};


const rotuloMes = (ym) => {
  const [ano, mes] = (ym || "").split("-");
  const idx = Number(mes) - 1;
  return idx >= 0 && idx < 12 ? `${MESES[idx]}/${ano.slice(2)}` : ym;
};

export default function AdminRelatorios() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [msg, setMsg] = useState("");

  const carregar = (deVal = de, ateVal = ate) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (deVal) params.set("de", deVal);
    if (ateVal) params.set("ate", ateVal);
    fetch(`${API_BASE}/admin/estatisticas?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => { setStats(null); setLoading(false); });
  };

  useEffect(() => { carregar("", ""); }, []);

  const aviso = (texto) => { setMsg(texto); setTimeout(() => setMsg(""), 3500); };

  // ----- dados derivados para os gráficos -----
  const totalAtribuidos = stats?.totais?.badgesAtribuidos || 0;
  const maxMes = useMemo(
    () => Math.max(1, ...(stats?.badgesPorMes || []).map((m) => m.total)),
    [stats]
  );
  const maxNivel = useMemo(
    () => Math.max(1, ...(stats?.badgesPorNivel || []).map((n) => n.total)),
    [stats]
  );
  const maxArea = useMemo(
    () => Math.max(1, ...(stats?.badgesPorArea || []).map((a) => a.total)),
    [stats]
  );

  // ----- exportação genérica -----
  const buscar = async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  const filtrarAprovados = (lista) =>
    lista.filter((c) => (c.estado || "").toUpperCase() === "APPROVED");

  // Configuração de cada relatório exportável
  const RELATORIOS = {
    utilizadores: {
      titulo: "Lista de Utilizadores",
      colunas: ["ID", "Nome", "Email", "Estado", "Registo"],
      carregar: () => buscar("/admin/utilizadores"),
      linha: (u) => [u.idutilizador, u.nome, u.email, u.estadoconta, fmtData(u.datacriacao)],
    },
    badges: {
      titulo: "Catálogo de Badges",
      colunas: ["ID", "Nome", "Pontos", "Nível", "Área", "Service Line"],
      carregar: () => buscar("/admin/badges"),
      linha: (b) => [b.idbadge, b.nome, b.pontos ?? 0, b.nivel || "-", b.area || "-", b.serviceline || "-"],
    },
    atribuidos: {
      titulo: "Badges Atribuídos",
      colunas: ["Consultor", "Email", "Badge", "Data de atribuição"],
      carregar: async () => filtrarAprovados(await buscar("/candidaturas/tm/lista")),
      linha: (c) => [c.consultor_nome, c.consultor_email || "-", c.badge_nome, fmtData(c.dataaprovacao || c.ultimaatualizacao)],
    },
    pedidos: {
      titulo: "Pedidos de Candidatura",
      colunas: ["ID", "Consultor", "Badge", "Estado", "Submissão"],
      carregar: () => buscar("/candidaturas/tm/lista"),
      linha: (c) => [c.idcandidatura, c.consultor_nome, c.badge_nome, c.estado, fmtData(c.datasubmissao || c.datacriacao)],
    },
  };

  const exportarPDF = async (tipo) => {
    const cfg = RELATORIOS[tipo];
    try {
      const data = await cfg.carregar();
      if (!data.length) return aviso("Sem dados para exportar neste relatório.");

      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(43, 55, 72);
      doc.text(cfg.titulo, 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(113, 128, 150);
      const periodo = `${de ? fmtData(de) : "início"} a ${ate ? fmtData(ate) : "hoje"}`;
      doc.text(`Período: ${periodo}`, 14, 28);
      doc.text(`Total de registos: ${data.length}`, 14, 33);
      doc.text(`Exportado em: ${new Date().toLocaleString("pt-PT")}`, 14, 38);

      autoTable(doc, {
        startY: 44,
        head: [cfg.colunas],
        body: data.map(cfg.linha),
        theme: "striped",
        headStyles: { fillColor: [59, 102, 149], textColor: [255, 255, 255] },
        styles: { font: "helvetica", fontSize: 9 },
      });
      doc.save(`Relatorio_${tipo}_${Date.now()}.pdf`);
    } catch (err) {
      aviso(`Falha na exportação: ${err.message}`);
    }
  };

  const exportarExcel = async (tipo) => {
    const cfg = RELATORIOS[tipo];
    try {
      const data = await cfg.carregar();
      if (!data.length) return aviso("Sem dados para exportar neste relatório.");

      const linhas = data.map((item) => {
        const valores = cfg.linha(item);
        return cfg.colunas.reduce((obj, col, i) => ({ ...obj, [col]: valores[i] }), {});
      });
      const ws = XLSX.utils.json_to_sheet(linhas);
      ws["!cols"] = cfg.colunas.map((c) => ({ wch: Math.max(c.length + 4, 14) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, cfg.titulo.substring(0, 30));
      XLSX.writeFile(wb, `Relatorio_${tipo}_${Date.now()}.xlsx`);
    } catch (err) {
      aviso(`Falha na exportação: ${err.message}`);
    }
  };

  return (
    <>
      <AdminNav />
      <div className="adm-rel-page">
        <div className="adm-rel-header">
          <h1>Relatórios e Estatísticas</h1>
          <p>Indicadores-chave da plataforma e exportação de dados para Excel/PDF.</p>
        </div>

        {msg && <div className="adm-rel-msg">{msg}</div>}

        {/* Filtro de período */}
        <div className="adm-card">
          <h3>Filtrar por período (badges atribuídos)</h3>
          <div className="adm-filtros">
            <div className="adm-campo">
              <label>De</label>
              <input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div className="adm-campo">
              <label>Até</label>
              <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
            <button className="adm-btn-aplicar" onClick={() => carregar()}>Aplicar</button>
            <button className="adm-btn-limpar" onClick={() => { setDe(""); setAte(""); carregar("", ""); }}>
              Limpar
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="adm-kpi-grid">
          <div className="adm-kpi"><h2>{loading ? "..." : stats?.totais?.utilizadores ?? "-"}</h2><p>Utilizadores registados</p></div>
          <div className="adm-kpi"><h2>{loading ? "..." : stats?.totais?.badgesCatalogo ?? "-"}</h2><p>Badges no catálogo</p></div>
          <div className="adm-kpi"><h2>{loading ? "..." : stats?.totais?.badgesAtribuidos ?? "-"}</h2><p>Badges atribuídos</p></div>
          <div className="adm-kpi"><h2>{loading ? "..." : stats?.totais?.pedidosEmCurso ?? "-"}</h2><p>Pedidos em curso</p></div>
        </div>

        {/* Gráficos */}
        <div className="adm-charts-grid">
          {/* Badges por mês */}
          <div className="adm-card">
            <h3>Badges atribuídos por mês {de || ate ? "(período filtrado)" : "(visão mensal)"}</h3>
            {loading ? (
              <p className="adm-empty">A carregar...</p>
            ) : (stats?.badgesPorMes || []).length === 0 ? (
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

          {/* Badges por nível */}
          <div className="adm-card">
            <h3>Badges por nível</h3>
            {loading ? (
              <p className="adm-empty">A carregar...</p>
            ) : (stats?.badgesPorNivel || []).length === 0 ? (
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

        {/* Badges por Learning Path + por Área */}
        <div className="adm-charts-grid">
          <div className="adm-card">
            <h3>Badges por Learning Path</h3>
            {loading ? (
              <p className="adm-empty">A carregar...</p>
            ) : (
              (stats?.badgesPorLearningPath || []).map((lp) => (
                <div key={lp.learningpath} className="adm-dist-row">
                  <span className="adm-dist-label" title={lp.learningpath}>{lp.learningpath}</span>
                  <div className="adm-dist-track">
                    <div className="adm-dist-fill" style={{ width: "100%" }} />
                  </div>
                  <span className="adm-dist-val">{lp.total}</span>
                </div>
              ))
            )}
          </div>

          <div className="adm-card">
            <h3>Badges por área</h3>
            {loading ? (
              <p className="adm-empty">A carregar...</p>
            ) : (stats?.badgesPorArea || []).length === 0 ? (
              <p className="adm-empty">Sem dados.</p>
            ) : (
              stats.badgesPorArea.map((a, i) => (
                <div key={`${a.serviceline}-${a.area}-${i}`} className="adm-dist-row">
                  <span className="adm-dist-label" title={`${a.serviceline} · ${a.area}`}>{a.area}</span>
                  <div className="adm-dist-track">
                    <div className="adm-dist-fill" style={{ width: `${(a.total / maxArea) * 100}%` }} />
                  </div>
                  <span className="adm-dist-val">{a.total}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Exportação */}
        <div className="adm-card">
          <h3>Exportar dados (Excel / PDF)</h3>
          <div className="adm-export-grid">
            <div className="adm-export-card">
              <h4>Utilizadores</h4>
              <small>Lista completa de contas registadas.</small>
              <div className="adm-export-btns">
                <button className="excel" onClick={() => exportarExcel("utilizadores")}>Excel</button>
                <button className="pdf" onClick={() => exportarPDF("utilizadores")}>PDF</button>
              </div>
            </div>
            <div className="adm-export-card">
              <h4>Catálogo de Badges</h4>
              <small>Badges, pontos, nível e área.</small>
              <div className="adm-export-btns">
                <button className="excel" onClick={() => exportarExcel("badges")}>Excel</button>
                <button className="pdf" onClick={() => exportarPDF("badges")}>PDF</button>
              </div>
            </div>
            <div className="adm-export-card">
              <h4>Badges Atribuídos</h4>
              <small>Apenas candidaturas aprovadas.</small>
              <div className="adm-export-btns">
                <button className="excel" onClick={() => exportarExcel("atribuidos")}>Excel</button>
                <button className="pdf" onClick={() => exportarPDF("atribuidos")}>PDF</button>
              </div>
            </div>
            <div className="adm-export-card">
              <h4>Pedidos</h4>
              <small>Todos os pedidos de candidatura.</small>
              <div className="adm-export-btns">
                <button className="excel" onClick={() => exportarExcel("pedidos")}>Excel</button>
                <button className="pdf" onClick={() => exportarPDF("pedidos")}>PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
