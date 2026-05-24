import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SelecionarPerfil.css";
import { API_BASE } from "../api";

const ROLE_ADMIN = 4;
const ROLE_CONSULTOR = 1;
const ROLE_SL = 3;

const PERFIS = {
  1: { nome: "Consultor",     descricao: "Aceda às suas badges, projetos e atividades.",                 icone: "👤" },
  2: { nome: "Talent Manager",descricao: "Gira colaboradores, avaliações e desenvolvimento de talento.", icone: "🎯" },
  3: { nome: "Service Line",  descricao: "Supervisione a sua linha de serviço e equipas associadas.",     icone: "🏢" },
  4: { nome: "Administrador", descricao: "Acesso total à gestão da plataforma.",                         icone: "⚙️" },
};

const DESTINOS = { 1: "/consultor/catalogo", 2: "/talent/dashboard", 3: "/sl/validacoes", 4: "/admin/utilizadores" };

// Mapeamento de idrole → perfis disponíveis
const PERFIS_POR_ROLE = {
  1: [1],           // Consultor
  2: [2],           // Talent Manager
  3: [3],           // Service Line
  4: [4],           // Administrador
  5: [1, 2, 3, 4],  // Full Access — todos os perfis
};

// ── Popup configuração de perfil ──────────────────────────────────
function PopupConfigurarPerfil({ utilizador, roleAtiva, onConcluido }) {
  const isSL = roleAtiva === ROLE_SL;
  const isConsultor = roleAtiva === ROLE_CONSULTOR;

  const [servicelines, setServicelines] = useState([]);
  const [areas, setAreas] = useState([]);
  const [slSel, setSlSel] = useState("");
  const [areaSel, setAreaSel] = useState("");
  const [erro, setErro] = useState("");
  const [submetendo, setSubmetendo] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/admin/servicelines`)
      .then((r) => r.json())
      .then((data) => setServicelines(Array.isArray(data) ? data.filter((sl) => sl.ativo) : []))
      .catch(() => setErro("Erro ao carregar Service Lines."));
  }, []);

  useEffect(() => {
    if (!isConsultor || !slSel) { setAreas([]); setAreaSel(""); return; }
    fetch(`${API_BASE}/admin/hierarquia`)
      .then((r) => r.json())
      .then((hierarquia) => {
        const sl = hierarquia.find((s) => s.idserviceline == slSel);
        setAreas(sl ? sl.areas.filter((a) => a.ativo) : []);
        setAreaSel("");
      })
      .catch(() => setErro("Erro ao carregar áreas."));
  }, [slSel, isConsultor]);

  const podeGuardar = isSL ? !!slSel : (!!slSel && !!areaSel);

  const handleGuardar = async () => {
    if (!podeGuardar) return;
    setSubmetendo(true);
    setErro("");
    try {
      const body = isSL
        ? { idserviceline: Number(slSel) }
        : { idarea: Number(areaSel) };

      const res = await fetch(`${API_BASE}/utilizadores/${utilizador.idutilizador}/perfil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.message || "Erro ao guardar."); return; }

      const novo = { ...utilizador, idserviceline: data.idserviceline, idarea: data.idarea };
      localStorage.setItem("utilizador", JSON.stringify(novo));
      onConcluido();
    } catch {
      setErro("Não foi possível ligar ao servidor.");
    } finally {
      setSubmetendo(false);
    }
  };

  return (
    <div className="popup-perfil-overlay">
      <div className="popup-perfil-card">
        <div className="popup-perfil-icone">{isSL ? "🏢" : "👤"}</div>
        <h2 className="popup-perfil-titulo">
          {isSL ? "Qual é a sua Service Line?" : "Qual é a sua área?"}
        </h2>
        <p className="popup-perfil-subtitulo">
          {isSL
            ? "Esta informação é necessária para que possa ver e gerir as candidaturas da sua Service Line."
            : "Esta informação permite-nos mostrar os badges mais relevantes para si."}
        </p>

        <div className="popup-perfil-form">
          <div className="popup-perfil-campo">
            <label>Service Line *</label>
            <select value={slSel} onChange={(e) => setSlSel(e.target.value)}>
              <option value="">-- Selecionar --</option>
              {servicelines.map((sl) => (
                <option key={sl.idserviceline} value={sl.idserviceline}>{sl.nome}</option>
              ))}
            </select>
          </div>

          {isConsultor && (
            <div className="popup-perfil-campo">
              <label>Área *</label>
              <select value={areaSel} onChange={(e) => setAreaSel(e.target.value)} disabled={!slSel}>
                <option value="">-- Selecionar --</option>
                {areas.map((a) => (
                  <option key={a.idarea} value={a.idarea}>{a.nome}</option>
                ))}
              </select>
            </div>
          )}

          {erro && <p className="popup-perfil-erro">{erro}</p>}

          <button
            className="popup-perfil-btn"
            onClick={handleGuardar}
            disabled={!podeGuardar || submetendo}
          >
            {submetendo ? "A guardar..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
function SelecionarPerfil() {
  const navigate = useNavigate();
  const [utilizador, setUtilizador] = useState(
    JSON.parse(localStorage.getItem("utilizador") || "null")
  );
  const [rolePendente, setRolePendente] = useState(null);

  if (!utilizador) {
    navigate("/login");
    return null;
  }

  // Usa o mapa PERFIS_POR_ROLE para determinar os perfis disponíveis
  const perfisDoUtilizador = PERFIS_POR_ROLE[utilizador.idrole] ?? [utilizador.idrole];

  const precisaPopup = (idrole) => {
    if (idrole === ROLE_SL && !utilizador.idserviceline) return true;
    if (idrole === ROLE_CONSULTOR && !utilizador.idarea) return true;
    return false;
  };

  const handleSelecionarPerfil = (idrole) => {
    if (precisaPopup(idrole)) {
      setRolePendente(idrole);
      return;
    }
    localStorage.setItem("perfilAtivo", String(idrole));
    navigate(DESTINOS[idrole] ?? "/consultor");
  };

  const handlePopupConcluido = () => {
    const atualizado = JSON.parse(localStorage.getItem("utilizador") || "null");
    setUtilizador(atualizado);
    setRolePendente(null);
    localStorage.setItem("perfilAtivo", String(rolePendente));
    navigate(DESTINOS[rolePendente] ?? "/consultor");
  };

  const handleLogout = () => {
    localStorage.removeItem("utilizador");
    localStorage.removeItem("perfilAtivo");
    navigate("/login");
  };

  return (
    <div className="perfil-wrapper">
      {rolePendente !== null && (
        <PopupConfigurarPerfil
          utilizador={utilizador}
          roleAtiva={rolePendente}
          onConcluido={handlePopupConcluido}
        />
      )}

      <div className="perfil-header">
        <h2 className="perfil-titulo">Olá, {utilizador.nome.split(" ")[0]}</h2>
        <p className="perfil-subtitulo">Selecione o perfil com que pretende entrar</p>
      </div>

      <div className="perfil-grelha">
        {perfisDoUtilizador.map((idrole) => {
          const perfil = PERFIS[idrole];
          if (!perfil) return null;
          return (
            <button
              key={idrole}
              className="perfil-card"
              onClick={() => handleSelecionarPerfil(idrole)}
            >
              <span className="perfil-icone">{perfil.icone}</span>
              <span className="perfil-nome">{perfil.nome}</span>
              <span className="perfil-descricao">{perfil.descricao}</span>
            </button>
          );
        })}
      </div>

      <button className="perfil-logout" onClick={handleLogout}>
        Sair da conta
      </button>
    </div>
  );
}

export default SelecionarPerfil;