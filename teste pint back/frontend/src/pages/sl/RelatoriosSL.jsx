import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/RelatoriosSL.css";
import { API_BASE } from "../../api";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { GoHome } from "react-icons/go";
import { MdOutlineVerified } from "react-icons/md";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsTrophy, BsBarChart } from "react-icons/bs";
import { FiDownload } from "react-icons/fi";

const NAV_ITEMS = [
  { label: "Início",     icon: <GoHome size={16} /> },
  { label: "Validações", icon: <MdOutlineVerified size={16} /> },
  { label: "Catálogo",   icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas", icon: <BsTrophy size={16} /> },
  { label: "Relatórios", icon: <BsBarChart size={16} /> },
];

const fmtData = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-PT");
};

export default function RelatoriosSL() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!utilizador) { navigate("/login"); return; }
    if (!utilizador.idserviceline) { navigate("/perfil"); return; }
    fetch(`${API_BASE}/candidaturas/sl/lista?idserviceline=${utilizador.idserviceline}`)
      .then((r) => r.json())
      .then((data) => { setCandidaturas(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleTabChange = (label) => {
    if (label === "Início")     navigate("/sl/dashboard");
    if (label === "Validações") navigate("/sl/validacoes");
    if (label === "Catálogo")   navigate("/sl/catalogo");
    if (label === "Conquistas") navigate("/sl/conquistas");
    if (label === "Relatórios") navigate("/sl/relatorios");
  };

  // Apenas badges atribuídos (aprovados) da Service Line
  const atribuidos = useMemo(
    () => candidaturas.filter((c) => (c.estado || "").toUpperCase() === "APPROVED"),
    [candidaturas]
  );

  const areas = useMemo(
    () => [...new Set(atribuidos.map((c) => c.area_nome).filter(Boolean))].sort(),
    [atribuidos]
  );

  const dataAtribuicao = (c) => c.dataaprovacao || c.ultimaatualizacao || c.datacriacao;

  const filtrados = useMemo(() => {
    return atribuidos.filter((c) => {
      if (area && c.area_nome !== area) return false;
      const d = new Date(dataAtribuicao(c));
      if (de && d < new Date(de + "T00:00:00")) return false;
      if (ate && d > new Date(ate + "T23:59:59")) return false;
      return true;
    });
  }, [atribuidos, area, de, ate]);

  const gerarPDF = () => {
    if (filtrados.length === 0) {
      setMsg("Não há badges atribuídos para os filtros selecionados.");
      setTimeout(() => setMsg(""), 3500);
      return;
    }

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(43, 55, 72);
    doc.text("Relatório de Badges Atribuídos", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(113, 128, 150);
    const slNome = utilizador?.serviceline || `Service Line ${utilizador?.idserviceline}`;
    const periodo = `${de ? fmtData(de) : "início"} a ${ate ? fmtData(ate) : "hoje"}`;
    doc.text(`Service Line: ${slNome}`, 14, 28);
    doc.text(`Área: ${area || "Todas"}`, 14, 33);
    doc.text(`Período: ${periodo}`, 14, 38);
    doc.text(`Total de badges atribuídos: ${filtrados.length}`, 14, 43);
    doc.text(`Exportado em: ${new Date().toLocaleString("pt-PT")}`, 14, 48);

    autoTable(doc, {
      startY: 54,
      head: [["Consultor", "Email", "Badge", "Área", "Data de atribuição"]],
      body: filtrados.map((c) => [
        c.consultor_nome || "N/A",
        c.consultor_email || "-",
        c.badge_nome || "N/A",
        c.area_nome || "-",
        fmtData(dataAtribuicao(c)),
      ]),
      theme: "striped",
      headStyles: { fillColor: [59, 102, 149], textColor: [255, 255, 255] },
      styles: { font: "helvetica", fontSize: 9 },
    });

    doc.save(`Relatorio_Badges_${area || "SL"}_${Date.now()}.pdf`);
  };

  return (
    <div className="page-wrapper">
      <Navbar activeTab="Relatórios" onTabChange={handleTabChange} navItems={NAV_ITEMS} />

      <div className="relsl-page">
        <div className="relsl-header">
          <h1>Relatórios da Service Line</h1>
          <p>Gere um PDF dos badges atribuídos na sua Service Line, por área e período.</p>
        </div>

        {msg && <div className="relsl-msg">{msg}</div>}

        <div className="relsl-kpis">
          <div className="relsl-kpi">
            <div className="relsl-kpi-valor">{loading ? "..." : atribuidos.length}</div>
            <div className="relsl-kpi-label">Badges atribuídos (total)</div>
          </div>
          <div className="relsl-kpi">
            <div className="relsl-kpi-valor">{loading ? "..." : areas.length}</div>
            <div className="relsl-kpi-label">Áreas com atribuições</div>
          </div>
          <div className="relsl-kpi destaque">
            <div className="relsl-kpi-valor">{loading ? "..." : filtrados.length}</div>
            <div className="relsl-kpi-label">No filtro atual</div>
          </div>
        </div>

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
            <button className="relsl-btn-pdf" onClick={gerarPDF} disabled={loading}>
              <FiDownload size={16} /> Gerar PDF
            </button>
          </div>
        </div>

        <div className="relsl-card">
          <h3 className="relsl-card-titulo">
            Pré-visualização <span className="relsl-contador">{filtrados.length}</span>
          </h3>
          <div className="relsl-tabela-wrap">
            <table className="relsl-tabela">
              <thead>
                <tr>
                  <th>Consultor</th>
                  <th>Badge</th>
                  <th>Área</th>
                  <th>Data de atribuição</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="relsl-vazio">A carregar...</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan={4} className="relsl-vazio">Sem badges atribuídos para os filtros.</td></tr>
                ) : (
                  filtrados.map((c) => (
                    <tr key={c.idcandidatura}>
                      <td>{c.consultor_nome}</td>
                      <td className="relsl-badge-nome">{c.badge_nome}</td>
                      <td>{c.area_nome || "-"}</td>
                      <td>{fmtData(dataAtribuicao(c))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
