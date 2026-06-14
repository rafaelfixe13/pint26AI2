import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar";
import "../../styles/Relatorios.css";
import { API_BASE } from "../../api";

// Importações do jsPDF para gerar o PDF no cliente
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import * as XLSX from "xlsx";

// Ícones da Navbar e Exportação
import { BsBarChart, BsClockHistory, BsTrophy } from "react-icons/bs";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { FiUsers } from "react-icons/fi";
import { MdOutlineVerified } from "react-icons/md";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { RiAwardLine } from "react-icons/ri";
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from "react-icons/io5";

const NAV_ITEMS = [
  { label: "Início", icon: <GoHome size={16} /> },
  { label: "Validações", icon: <MdOutlineVerified size={16} /> },
  { label: "Histórico", icon: <BsClockHistory size={16} /> },
  { label: "Catálogo", icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas", icon: <BsTrophy size={16} /> },
  { label: "Relatórios", icon: <BsBarChart size={16} /> },
  { label: "Consultores", icon: <FiUsers size={16} /> },
];

function RelatoriosTM() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Relatórios");

  // Estados dos KPIs
  const [totalUtilizadores, setTotalUtilizadores] = useState("...");
  const [totalBadges, setTotalBadges] = useState("...");
  const [totalCertificados, setTotalCertificados] = useState("...");

  // Estados dos Gráficos Dinâmicos
  const [dadosBarras, setDadosBarras] = useState([]);
  const [dadosDonut, setDadosDonut] = useState({ júnior: 0, intermedio: 0, senior: 0, especialista: 0 });

  // 1. Carregar Total de Utilizadores
  useEffect(() => {
    fetch(`${API_BASE}/admin/utilizadores`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTotalUtilizadores(data.length);
        else setTotalUtilizadores(0);
      })
      .catch((err) => {
        console.error("Erro ao buscar utilizadores:", err);
        setTotalUtilizadores("-");
      });
  }, []);

  // 2. Carregar Total de Badges
  useEffect(() => {
    fetch(`${API_BASE}/admin/badges`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTotalBadges(data.length);
        else setTotalBadges(0);
      })
      .catch((err) => {
        console.error("Erro ao buscar badges:", err);
        setTotalBadges("-");
      });
  }, []);

  const formatarData = (valor) => {
    if (!valor) return "-";
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? "-" : data.toLocaleDateString("pt-PT");
  };

  const obterDataCandidatura = (item) => item?.datasubmissao || item?.datacriacao || item?.dataaprovacao || item?.datarejeicao;

  // 3. Carregar Candidaturas (Para Gráficos e Certificados Aprovados)
  useEffect(() => {
    fetch(`${API_BASE}/candidaturas/tm/lista`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const aprovados = data.filter((c) => c.estado === "APPROVED");
          setTotalCertificados(aprovados.length);

          // === LÓGICA DO GRÁFICO DE BARRAS (Agrupado por Mês) ===
          const mesesLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
          const contagemMeses = Array(12).fill(0);

          aprovados.forEach((c) => {
            const dataCandidatura = new Date(obterDataCandidatura(c));
            if (!Number.isNaN(dataCandidatura.getTime())) {
              contagemMeses[dataCandidatura.getMonth()]++;
            }
          });

          const maxMes = Math.max(...contagemMeses, 1);
          const barrasCalculadas = mesesLabels.map((mes, idx) => ({
            mes,
            altura: `${(contagemMeses[idx] / maxMes) * 95}%`,
            total: contagemMeses[idx]
          }));
          setDadosBarras(barrasCalculadas);

          // === LÓGICA DO GRÁFICO DONUT (Por Nível de Badge) ===
          let jr = 0, int = 0, sr = 0, esp = 0;

          aprovados.forEach((c) => {
            const nivel = (c.badge_nivel || c.badge_nome || "").toUpperCase();
            if (nivel.includes("JÚNIOR") || nivel.includes("A")) jr++;
            else if (nivel.includes("INTERMÉDIO") || nivel.includes("B")) int++;
            else if (nivel.includes("SÉNIOR") || nivel.includes("C")) sr++;
            else esp++;
          });

          setDadosDonut({ júnior: jr, intermedio: int, senior: sr,专especialista: esp });
        } else {
          setTotalCertificados(0);
        }
      })
      .catch((err) => {
        console.error("Erro ao processar dados das candidaturas:", err);
        setTotalCertificados("-");
      });
  }, []);





// === FUNÇÃO PARA GERAR O PDF DIRETAMENTE NO CLIENTE COM BASE NOS MODELOS SEQUELIZE ===
  const exportarParaPDF = async (tipo) => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(43, 55, 72); // Cor #2D3748

    let tituloReport = "";
    let endpoint = "";
    let colunas = [];
    let mapearLinha = (item) => [];

    switch (tipo) {
      // 1. TABELA: utilizadores (Lista Geral de Consultores)
      case "consultores":
        tituloReport = "Lista Geral de Consultores (Utilizadores)";
        endpoint = `${API_BASE}/admin/utilizadores`;
        colunas = ["ID", "Nome", "Email", "Estado Conta", "Pontos Acumulados"];
        mapearLinha = (u) => [
          u?.idutilizador || "-", 
          u?.nome || "N/A", 
          u?.email || "N/A", 
          u?.estadoconta || "ATIVA", 
          `${u?.pontos ?? u?.pontuacao ?? u?.totalpontos ?? 0} pts`
        ];
        break;

      // 2. TABELA: badges (Catálogo de Badges)
      case "badges":
        tituloReport = "Catálogo Geral de Badges Ativos";
        endpoint = `${API_BASE}/admin/badges`;
        colunas = ["ID", "Nome do Badge", "Pontos Atribuídos", "ID Nível", "ID Área", "Estado"];
        mapearLinha = (b) => [
          b?.idbadge || "-", 
          b?.nome || "N/A", 
          `${b?.pontos ?? 0} pts`,
          b?.Nivel?.nome || b?.nivel || b?.idnivel || "Geral",
          b?.Area?.nome || b?.area || b?.nomearea || b?.idarea || "Geral",
          b?.ativo ? "Ativo" : "Inativo"
        ];
        break;

      // 3. TABELA: utilizador_badges (Histórico de Conquistas/Certificados)
      case "conquistas":
        tituloReport = "Relatório de Badges Conquistados (Utilizador_Badges)";
        endpoint = `${API_BASE}/candidaturas/tm/lista`; // Ou a rota que mapeia esta tabela intermédia
        colunas = ["ID Consultor", "Nome Consultor", "ID Badge", "Nome Badge", "Data de Conquista"];
        mapearLinha = (ub) => [
          ub?.idutilizador || "-",
          ub?.consultor_nome || ub?.Utilizador?.nome || "N/A",
          ub?.idbadge || "-",
          ub?.badge_nome || ub?.Badge?.nome || "N/A",
          formatarData(ub?.dataconquista)
        ];
        break;

      // 4. TABELA: areas (Estrutura de Áreas / Service Lines)
      case "areas":
        tituloReport = "Lista de Áreas e Departamentos Registados";
        endpoint = `${API_BASE}/admin/areas`; // Ajusta para a tua rota de áreas se necessário
        colunas = ["ID Área", "ID Service Line", "Nome da Área", "Descrição", "Estado"];
        mapearLinha = (a) => [
          a?.idarea || "-",
          a?.idserviceline || "-",
          a?.nome || "N/A",
          a?.descricao || "Sem descrição",
          a?.ativo ? "Ativa" : "Inativa"
        ];
        break;

      // 5. TABELA: nivel (Níveis de Proficiência dos Badges)
      case "niveis":
        tituloReport = "Lista de Níveis de Badges (Proficiência)";
        endpoint = `${API_BASE}/admin/niveis`; // Ajusta para a tua rota de níveis se necessário
        colunas = ["ID Nível", "Nome do Nível", "Descrição"];
        mapearLinha = (n) => [
          n?.idnivel || "-",
          n?.nome || "N/A",
          n?.descricao || "Sem descrição"
        ];
        break;

      // Opções das candidaturas que tinhas anteriormente (Pedidos gerais, aprovados e rejeitados)
      case "pedidos":
        tituloReport = "Relatório Geral de Pedidos de Candidatura";
        endpoint = `${API_BASE}/candidaturas/tm/lista`;
        colunas = ["ID", "Consultor", "Badge", "Data Submissão", "Estado"];
        mapearLinha = (c) => [
          c?.idcandidatura || "-",
          c?.consultor_nome || "N/A",
          c?.badge_nome || "N/A",
          formatarData(obterDataCandidatura(c)),
          c?.estado || "PENDING"
        ];
        break;

      case "aprovacoes":
        tituloReport = "Histórico de Candidaturas Aprovadas";
        endpoint = `${API_BASE}/candidaturas/tm/lista`;
        colunas = ["ID", "Consultor", "Badge", "Data"];
        mapearLinha = (c) => [
          c?.idcandidatura || "-",
          c?.consultor_nome || "N/A",
          c?.badge_nome || "N/A",
          formatarData(obterDataCandidatura(c))
        ];
        break;

      case "rejeicoes":
        tituloReport = "Histórico de Candidaturas Rejeitadas";
        endpoint = `${API_BASE}/candidaturas/tm/lista`;
        colunas = ["ID", "Consultor", "Badge", "Data"];
        mapearLinha = (c) => [
          c?.idcandidatura || "-",
          c?.consultor_nome || "N/A",
          c?.badge_nome || "N/A",
          formatarData(obterDataCandidatura(c))
        ];
        break;

      default:
        return alert("Tipo de relatório não reconhecido.");
    }

    try {
      console.log(`A efetuar fetch para a tabela correspondente a: ${tipo}`, endpoint);
      let data;

      if (tipo === "consultores") {
        const [utilizadoresRes, rankingRes] = await Promise.all([
          fetch(`${API_BASE}/admin/utilizadores`),
          fetch(`${API_BASE}/talent/ranking`)
        ]);

        if (!utilizadoresRes.ok) throw new Error(`Erro ao buscar utilizadores: ${utilizadoresRes.status}`);
        if (!rankingRes.ok) throw new Error(`Erro ao buscar ranking: ${rankingRes.status}`);

        const utilizadores = await utilizadoresRes.json();
        const ranking = await rankingRes.json();

        if (!Array.isArray(utilizadores)) {
          throw new Error("A API de utilizadores não devolveu uma lista válida.");
        }
        if (!Array.isArray(ranking)) {
          throw new Error("A API de ranking não devolveu uma lista válida.");
        }

        const pontosPorUtilizador = ranking.reduce((acc, item) => {
          if (item?.idutilizador !== undefined) acc[item.idutilizador] = item.pontos ?? 0;
          return acc;
        }, {});

        data = utilizadores.map((u) => ({
          ...u,
          pontos: pontosPorUtilizador[u.idutilizador] ?? u.pontos ?? 0,
        }));
      } else {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`O servidor respondeu com status ${res.status}`);
        data = await res.json();
      }

      console.log(`Dados estruturados recebidos para [${tipo}]:`, data);

      if (!Array.isArray(data)) {
        if (data && Array.isArray(data.data)) data = data.data;
        else if (data && Array.isArray(data.lista)) data = data.lista;
        else {
          alert("A estrutura do JSON retornado pela API não é um Array válido.");
          return;
        }
      }

      // Filtros aplicados localmente para poupar rotas redundantes
      if (tipo === "aprovacoes") {
        data = data.filter(c => c && c.estado && c.estado.toUpperCase() === "APPROVED");
      }
      if (tipo === "rejeicoes") {
        data = data.filter(c => c && c.estado && c.estado.toUpperCase() === "REJECTED");
      }

      // Geração do Cabeçalho do PDF
      doc.text(tituloReport, 14, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(113, 128, 150);
      doc.text(`Exportado em: ${new Date().toLocaleDateString("pt-PT")} às ${new Date().toLocaleTimeString("pt-PT")}`, 14, 27);
      doc.text(`Total de registos extraídos da tabela: ${data.length}`, 14, 33);

      // Renderização com o plugin jspdf-autotable
      autoTable(doc, {
        startY: 38,
        head: [colunas],
        body: data.map(mapearLinha),
        theme: "striped",
        headStyles: { fillColor: [59, 102, 149], textColor: [255, 255, 255] },
        styles: { font: "helvetica", fontSize: 9 },
      });

      doc.save(`Relatorio_Tabela_${tipo}_${Date.now()}.pdf`);
    } catch (err) {
      console.error("ERRO DE EXECUÇÃO NO CLIENT-SIDE PDF:", err);
      alert(`Falha na exportação: ${err.message}. Abre a consola (F12) para validar o formato do objeto.`);
    }
  };




// === FUNÇÃO PARA GERAR O EXCEL DIRETAMENTE NO CLIENTE ===
  const exportarParaExcel = async (tipo) => {
    let tituloReport = "";
    let endpoint = "";
    let colunas = [];
    let mapearObjeto = (item) => ({});





    // Mapeamento dos dados para o cabeçalho e linhas do Excel
    if (tipo === "pedidos") {
      tituloReport = "Pedidos Submetidos";
      endpoint = `${API_BASE}/candidaturas/tm/lista`;
      colunas = ["ID Candidatura", "Consultor", "Badge", "Data Submissão", "Estado"];
      mapearObjeto = (c) => ({
        "ID Candidatura": c?.idcandidatura || c?.id || "-",
        "Consultor": c?.consultor_nome || c?.nome_consultor || "N/A",
        "Badge": c?.badge_nome || c?.nome_badge || "N/A",
        "Data Submissão": formatarData(obterDataCandidatura(c)),
        "Estado": c?.estado || "PENDING"
      });
    } else if (tipo === "badges") {
      tituloReport = "Catálogo Geral de Badges Ativos";
      endpoint = `${API_BASE}/admin/badges`;
      colunas = ["ID Badge", "Nome do Badge", "Pontos Atribuídos", "ID Nível", "ID Área", "Estado"];
      mapearObjeto = (b) => ({
        "ID Badge": b?.idbadge || b?.id || "-",
        "Nome do Badge": b?.nome || "N/A",
        "Pontos Atribuídos": `${b?.pontos ?? 0} pts`,
        "ID Nível": b?.Nivel?.nome || b?.nivel || b?.idnivel || "Geral",
        "ID Área": b?.Area?.nome || b?.area || b?.nomearea || b?.idarea || "Geral",
        "Estado": b?.ativo ? "Ativo" : "Inativo"
      });
    } else if (tipo === "consultores") {            
      tituloReport = "Lista Geral de Consultores";
      // Vamos buscar os utilizadores e o ranking para unir os pontos corretamente
      endpoint = `${API_BASE}/admin/utilizadores`;
      colunas = ["ID", "Nome", "Email", "Estado Conta", "Pontos Acumulados"];
      mapearObjeto = (u) => ({
        "ID": u?.idutilizador || u?.id || "-",
        "Nome": u?.nome || "N/A",
        "Email": u?.email || "N/A",
        "Estado Conta": u?.estadoconta || "ATIVA",
        "Pontos Acumulados": `${u?.pontos ?? u?.pontuacao ?? u?.totalpontos ?? 0} pts`
      });
    } else if (tipo === "aprovacoes") {
      tituloReport = "Histórico de Candidaturas Aprovadas";
      endpoint = `${API_BASE}/candidaturas/tm/lista`;
      colunas = ["ID Candidatura", "Consultor", "Badge", "Data"];
      mapearObjeto = (c) => ({
        "ID Candidatura": c?.idcandidatura || c?.id || "-",
        "Consultor": c?.consultor_nome || "N/A",
        "Badge": c?.badge_nome || "N/A",
        "Data": formatarData(obterDataCandidatura(c))
      });
    } else if (tipo === "rejeicoes") {
      tituloReport = "Histórico de Candidaturas Rejeitadas";
      endpoint = `${API_BASE}/candidaturas/tm/lista`;
      colunas = ["ID Candidatura", "Consultor", "Badge", "Data"];
      mapearObjeto = (c) => ({
        "ID Candidatura": c?.idcandidatura || c?.id || "-",
        "Consultor": c?.consultor_nome || "N/A",
        "Badge": c?.badge_nome || "N/A",
        "Data": formatarData(obterDataCandidatura(c))
      });
    }

    try {
      console.log(`A tentar fazer fetch para exportação Excel (${tipo}) em:`, endpoint || "(merge de dados)");
      let data;

      if (tipo === "consultores") {
        const [utilizadoresRes, rankingRes] = await Promise.all([
          fetch(`${API_BASE}/admin/utilizadores`),
          fetch(`${API_BASE}/talent/ranking`)
        ]);

        if (!utilizadoresRes.ok) throw new Error(`Erro ao buscar utilizadores: ${utilizadoresRes.status}`);
        if (!rankingRes.ok) throw new Error(`Erro ao buscar ranking: ${rankingRes.status}`);

        const utilizadores = await utilizadoresRes.json();
        const ranking = await rankingRes.json();

        if (!Array.isArray(utilizadores)) {
          throw new Error("A API de utilizadores não devolveu uma lista válida.");
        }
        if (!Array.isArray(ranking)) {
          throw new Error("A API de ranking não devolveu uma lista válida.");
        }

        const pontosPorUtilizador = ranking.reduce((acc, item) => {
          if (item?.idutilizador !== undefined) acc[item.idutilizador] = item.pontos ?? 0;
          return acc;
        }, {});

        data = utilizadores.map((u) => ({
          ...u,
          pontos: pontosPorUtilizador[u.idutilizador] ?? u.pontos ?? 0,
        }));
      } else {
        const res = await fetch(endpoint);

        if (!res.ok) throw new Error(`Erro do servidor: ${res.status}`);

        data = await res.json();
      }

      if (!Array.isArray(data)) {
        if (data && Array.isArray(data.data)) data = data.data;
        else if (data && Array.isArray(data.lista)) data = data.lista;
        else {
          alert("A API não devolveu uma lista válida para Excel.");
          return;
        }
      }

      // Filtros locais de estado
      if (tipo === "aprovacoes") data = data.filter(c => c && c.estado === "APPROVED");
      if (tipo === "rejeicoes") data = data.filter(c => c && c.estado === "REJECTED");

      // Transforma o array de objetos da API em linhas estruturadas para a folha
      const linhasExcel = data.map(mapearObjeto);

      // Instancia o SheetJS para montar o workbook na memória do browser
      const worksheet = XLSX.utils.json_to_sheet(linhasExcel);
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(workbook, worksheet, tituloReport.substring(0, 30));

      // Calcula automaticamente larguras de coluna básicas para evitar texto encavalitado
      const largurasColunas = colunas.map(col => ({
        wch: Math.max(col.length + 4, 15)
      }));
      worksheet["!cols"] = largurasColunas;

      // Dispara o download nativo do .xlsx
      XLSX.writeFile(workbook, `Relatorio_${tipo}_${Date.now()}.xlsx`);

    } catch (err) {
      console.error("ERRO DETALHADO DA EXPORTAÇÃO EXCEL:", err);
      alert(`Erro na exportação para Excel: ${err.message}`);
    }
  };



  const handleTabChange = (label) => {
    setActiveTab(label);
    if (label === "Início") navigate("/talent/dashboard");
    if (label === "Validações") navigate("/talent/validacoes");
    if (label === "Histórico") navigate("/talent/historico");
    if (label === "Catálogo") navigate("/talent/catalogo");
    if (label === "Conquistas") navigate("/talent/conquistas");
    if (label === "Relatórios") navigate("/talent/relatorios");
    if (label === "Consultores") navigate("/talent/diretorio");
  };

  // Cálculo das fatias do conic-gradient para o Donut
  const totalNiveis = dadosDonut.júnior + dadosDonut.intermedio + dadosDonut.senior + dadosDonut.especialista || 1;
  const pctJr = (dadosDonut.júnior / totalNiveis) * 100;
  const pctInt = (dadosDonut.intermedio / totalNiveis) * 100;
  const pctSr = (dadosDonut.senior / totalNiveis) * 100;

  const donutGradient = {
    background: `conic-gradient(
      #3B82F6 0% ${pctJr}%, 
      #10B981 ${pctJr}% ${pctJr + pctInt}%, 
      #F59E0B ${pctJr + pctInt}% ${pctJr + pctInt + pctSr}%, 
      #8B5CF6 ${pctJr + pctInt + pctSr}% 100%
    )`
  };

  return (
    <div className="page-wrapper">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} navItems={NAV_ITEMS} />

      <div className="relatorios-container">
        {/* HEADER */}
        <div className="relatorios-header">
          <div>
            <h1>Relatórios e Estatísticas</h1>
            <p className="subtitle">Analise o desempenho da equipa e exporte os dados do sistema.</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card"><h2>{totalUtilizadores}</h2><p>Total de Utilizadores</p></div>
          <div className="kpi-card divider"><h2>{totalBadges}</h2><p>Total de Badges no Sistema</p></div>
          <div className="kpi-card"><h2>{totalCertificados}</h2><p>Total de Certificados Emitidos</p></div>
        </div>

        {/* GRÁFICOS */}
        <div className="charts-grid">
          {/* Gráfico de Barras */}
          <div className="chart-box">
            <div className="chart-header">
              <h3>Badges Atribuídos por Mês</h3>
              
            </div>
            <div className="mock-chart-container">
              <div className="chart-grid-lines">
                <div><span>Máx</span></div><div><span>75%</span></div><div><span>50%</span></div><div><span>25%</span></div><div><span>0</span></div>
              </div>
              <div className="mock-bars-wrapper">
                {dadosBarras.length > 0 ? (
                  dadosBarras.map((item, index) => (
                    <div key={index} className="mock-bar-col" title={`${item.total} badges`}>
                      <div className="mock-bar" style={{ height: item.altura }}></div>
                      <span className="mock-bar-label">{item.mes}</span>
                    </div>
                  ))
                ) : (
                  <p className="loading-charts">A ler dados da base de dados...</p>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico Donut */}
          <div className="chart-box">
            <h3>Distribuição por Níveis</h3>
            <div className="mock-donut-container">
              <div className="mock-donut-chart" style={donutGradient}>
                <div className="mock-donut-hole">
                  <div className="donut-center-text">
                    <span>{totalCertificados}</span>
                    <small>Total</small>
                  </div>
                </div>
              </div>
              <div className="mock-donut-legend">
                <div className="legend-item"><span className="legend-dot júnior"></span> Júnior ({dadosDonut.júnior})</div>
                <div className="legend-item"><span className="legend-dot intermedio"></span> Intermédio ({dadosDonut.intermedio})</div>
                <div className="legend-item"><span className="legend-dot senior"></span> Sénior ({dadosDonut.senior})</div>
                <div className="legend-item"><span className="legend-dot especialista"></span> Especialista ({dadosDonut.especialista})</div>
              </div>
            </div>
          </div>
        </div>

        {/* EXPORTAÇÃO */}
        <h3 className="section-title">Exportação de Dados (Excel / PDF)</h3>
        <div className="export-grid">
          
          <div className="export-card">
            <div className="card-icon blue-bg"><HiOutlineDocumentText size={22} color="#3B82F6" /></div>
            <h4>Pedidos Submetidos</h4>
            <div className="export-buttons">
                <button className="excel" onClick={() => exportarParaExcel("pedidos")}>Excel</button>
              <button className="pdf" onClick={() => exportarParaPDF("pedidos")}>PDF</button>
      
            </div>
          </div>

          <div className="export-card">
            <div className="card-icon yellow-bg"><RiAwardLine size={22} color="#F59E0B" /></div>
            <h4>Catálogo de Badges</h4>
            <div className="export-buttons">
              <button className="excel" onClick={() => exportarParaExcel("badges")}>Excel</button>
              <button className="pdf" onClick={() => exportarParaPDF("badges")}>PDF</button>
            </div>
          </div>

          <div className="export-card">
            <div className="card-icon purple-bg"><FiUsers size={22} color="#8B5CF6" /></div>
            <h4>Lista de Consultores</h4>
            <div className="export-buttons">
              <button className="excel" onClick={() => exportarParaExcel("consultores")}>Excel</button>
              <button className="pdf" onClick={() => exportarParaPDF("consultores")}>PDF</button>
            </div>
          </div>

          <div className="export-card">
            <div className="card-icon green-bg"><IoCheckmarkCircleOutline size={22} color="#10B981" /></div>
            <h4>Histórico de Aprovações</h4>
            <div className="export-buttons">
              <button className="excel" onClick={() => exportarParaExcel("aprovacoes")}>Excel</button>
              <button className="pdf" onClick={() => exportarParaPDF("aprovacoes")}>PDF</button>
            </div>
          </div>

          <div className="export-card">
            <div className="card-icon red-bg"><IoCloseCircleOutline size={22} color="#EF4444" /></div>
            <h4>Histórico de Rejeições</h4>
            <div className="export-buttons">
              <button className="excel" onClick={() => exportarParaExcel("rejeicoes")}>Excel</button>
              <button className="pdf" onClick={() => exportarParaPDF("rejeicoes")}>PDF</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default RelatoriosTM;