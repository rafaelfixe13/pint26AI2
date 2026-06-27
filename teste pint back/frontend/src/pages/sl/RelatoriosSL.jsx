import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/RelatoriosSL.css";
import { API_BASE } from "../../api";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { GoHome } from "react-icons/go";
import { MdOutlineVerified, MdOutlineAssignment, MdLeaderboard } from "react-icons/md";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsTrophy, BsBarChart } from "react-icons/bs";
import { RiAwardLine } from "react-icons/ri";
import { FiUsers } from "react-icons/fi";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { NAV_SL } from "../../utils/navConfig";

const fmtData = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-PT");
};

function estadoLabel(estado) {
  const e = (estado || "").toUpperCase();
  if (e === "APPROVED")     return "Aprovado";
  if (e === "REJECTED")     return "Rejeitado";
  if (e === "UNDER_REVIEW") return "Em validação SL";
  if (e === "OPEN")         return "Devolvida";
  if (e === "SUBMITTED")    return "Em validação TM";
  return estado || "-";
}

export default function RelatoriosSL() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [candidaturas, setCandidaturas] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [badges, setBadges] = useState([]);
  const [slNome, setSlNome] = useState("");
  const [loading, setLoading] = useState(true);

  const [area, setArea] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    if (!utilizador.idserviceline) { navigate("/perfil"); return; }
    const sl = utilizador.idserviceline;

    Promise.all([
      fetch(`${API_BASE}/candidaturas/sl/lista?idserviceline=${sl}`).then((r) => r.json()).catch(() => []),
      fetch(`${API_BASE}/sl/conquistas?idserviceline=${sl}`).then((r) => r.json()).catch(() => []),
      fetch(`${API_BASE}/badges`).then((r) => r.json()).catch(() => []),
      fetch(`${API_BASE}/sl/dashboard?idserviceline=${sl}`).then((r) => r.json()).catch(() => ({})),
    ]).then(([cand, cons, bdg, dash]) => {
      setCandidaturas(Array.isArray(cand) ? cand : []);
      setConsultores(Array.isArray(cons) ? cons : []);
      setBadges(Array.isArray(bdg) ? bdg : []);
      setSlNome(dash?.serviceline?.nome || utilizador.serviceline || "");
      setLoading(false);
    });
  }, []);


  // Apenas badges da Service Line do utilizador
  const badgesSL = useMemo(
    () => badges.filter((b) => !slNome || b.serviceline === slNome),
    [badges, slNome]
  );

  // Áreas disponíveis (das várias fontes)
  const areas = useMemo(() => {
    const s = new Set();
    candidaturas.forEach((c) => c.area_nome && s.add(c.area_nome));
    consultores.forEach((c) => c.area && s.add(c.area));
    badgesSL.forEach((b) => b.area && s.add(b.area));
    return [...s].sort();
  }, [candidaturas, consultores, badgesSL]);

  const dataPedido = (c) => c.dataaprovacao || c.datarejeicao || c.ultimaatualizacao || c.datacriacao;

  const noPeriodo = (v) => {
    const d = new Date(v);
    if (de && d < new Date(de + "T00:00:00")) return false;
    if (ate && d > new Date(ate + "T23:59:59")) return false;
    return true;
  };

  //Conjuntos filtrados por relatório
  const pedidos = useMemo(
    () => candidaturas.filter((c) => (!area || c.area_nome === area) && noPeriodo(dataPedido(c))),
    [candidaturas, area, de, ate]
  );
  const aprovacoes = useMemo(
    () => pedidos.filter((c) => (c.estado || "").toUpperCase() === "APPROVED"),
    [pedidos]
  );
  const badgesFiltrados = useMemo(
    () => badgesSL.filter((b) => !area || b.area === area),
    [badgesSL, area]
  );
  const consultoresFiltrados = useMemo(
    () => consultores.filter((c) => !area || c.area === area),
    [consultores, area]
  );

  //Definição de cada relatório (colunas + linhas)
  const construir = (tipo) => {
    switch (tipo) {
      case "pedidos":
        return {
          titulo: "Pedidos de Badges",
          colunas: ["Consultor", "Email", "Badge", "Área", "Data", "Estado"],
          linhas: pedidos.map((c) => [
            c.consultor_nome || "N/A", c.consultor_email || "-", c.badge_nome || "N/A",
            c.area_nome || "-", fmtData(dataPedido(c)), estadoLabel(c.estado),
          ]),
        };
      case "aprovacoes":
        return {
          titulo: "Aprovações (Badges Atribuídos)",
          colunas: ["Consultor", "Email", "Badge", "Área", "Data de atribuição"],
          linhas: aprovacoes.map((c) => [
            c.consultor_nome || "N/A", c.consultor_email || "-", c.badge_nome || "N/A",
            c.area_nome || "-", fmtData(c.dataaprovacao || dataPedido(c)),
          ]),
        };
      case "badges":
        return {
          titulo: "Catálogo de Badges da Service Line",
          colunas: ["Badge", "Pontos", "Nível", "Área", "Estado"],
          linhas: badgesFiltrados.map((b) => [
            b.nome || "N/A", b.pontos != null ? `${b.pontos}` : "Sem pontos",
            b.nivel || "-", b.area || "-", b.estado || "-",
          ]),
        };
      case "consultores":
        return {
          titulo: "Consultores da Service Line",
          colunas: ["Nome", "Email", "Área", "Badges", "Pontos"],
          linhas: consultoresFiltrados.map((c) => [
            c.nome || "N/A", c.email || "-", c.area || "-",
            `${c.totalbadges ?? 0}`, `${c.totalpontos ?? 0}`,
          ]),
        };
      default:
        return null;
    }
  };

  const subtituloFiltros = () => {
    const partes = [`Service Line: ${slNome || utilizador?.idserviceline}`];
    partes.push(`Área: ${area || "Todas"}`);
    partes.push(`Período: ${de ? fmtData(de) : "início"} a ${ate ? fmtData(ate) : "hoje"}`);
    return partes;
  };

  const exportarPDF = (tipo) => {
    const rel = construir(tipo);
    if (!rel || rel.linhas.length === 0) {
      setMsg("Não há dados para os filtros selecionados.");
      setTimeout(() => setMsg(""), 3500);
      return;
    }
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(43, 55, 72);
    doc.text(rel.titulo, 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(113, 128, 150);
    let y = 25;
    subtituloFiltros().forEach((linha) => { doc.text(linha, 14, y); y += 5; });
    doc.text(`Total de registos: ${rel.linhas.length}`, 14, y); y += 5;
    doc.text(`Exportado em: ${new Date().toLocaleString("pt-PT")}`, 14, y); y += 4;

    autoTable(doc, {
      startY: y + 2,
      head: [rel.colunas],
      body: rel.linhas,
      theme: "striped",
      headStyles: { fillColor: [59, 102, 149], textColor: [255, 255, 255] },
      styles: { font: "helvetica", fontSize: 9 },
    });
    doc.save(`Relatorio_${tipo}_${Date.now()}.pdf`);
  };

  const exportarExcel = (tipo) => {
    const rel = construir(tipo);
    if (!rel || rel.linhas.length === 0) {
      setMsg("Não há dados para os filtros selecionados.");
      setTimeout(() => setMsg(""), 3500);
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet([rel.colunas, ...rel.linhas]);
    ws["!cols"] = rel.colunas.map((c) => ({ wch: Math.max(c.length + 4, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, rel.titulo.substring(0, 30));
    XLSX.writeFile(wb, `Relatorio_${tipo}_${Date.now()}.xlsx`);
  };

  const CARDS = [
    { tipo: "pedidos",     titulo: "Pedidos",     icon: <MdOutlineAssignment size={22} />, cls: "azul",    total: pedidos.length },
    { tipo: "badges",      titulo: "Badges",      icon: <RiAwardLine size={22} />,         cls: "amarelo", total: badgesFiltrados.length },
    { tipo: "consultores", titulo: "Consultores", icon: <FiUsers size={22} />,             cls: "roxo",    total: consultoresFiltrados.length },
    { tipo: "aprovacoes",  titulo: "Aprovações",  icon: <IoCheckmarkCircleOutline size={22} />, cls: "verde", total: aprovacoes.length },
  ];

  return (
    <div className="page-wrapper">
      <Navbar navItems={NAV_SL} />

      <div className="relsl-page">
        <div className="relsl-header">
          <h1>Relatórios da Service Line</h1>
          <p>Exporte os dados da sua Service Line para Excel ou PDF.</p>
        </div>

        {msg && <div className="relsl-msg">{msg}</div>}

        <div className="relsl-card">
          <h3 className="relsl-card-titulo">Filtros</h3>
          <div className="relsl-filtros">
            <div className="relsl-campo">
              <label>Área</label>
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Todas as áreas</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="relsl-campo">
              <label>De</label>
              <input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div className="relsl-campo">
              <label>Até</label>
              <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
          </div>
          <p className="relsl-nota">O período aplica-se a <strong>Pedidos</strong> e <strong>Aprovações</strong>. A área aplica-se a todos os relatórios.</p>
        </div>

        <h3 className="relsl-card-titulo" style={{ marginBottom: "1.1rem" }}>Exportação de Dados</h3>
        <div className="relsl-export-grid">
          {CARDS.map((c) => (
            <div key={c.tipo} className="relsl-export-card">
              <div className={`relsl-export-icone ${c.cls}`}>{c.icon}</div>
              <h4>{c.titulo}</h4>
              <span className="relsl-export-total">{loading ? "..." : `${c.total} registos`}</span>
              <div className="relsl-export-btns">
                <button className="excel" disabled={loading} onClick={() => exportarExcel(c.tipo)}>Excel</button>
                <button className="pdf" disabled={loading} onClick={() => exportarPDF(c.tipo)}>PDF</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
