import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles/Rgpd.css";
import { definirRgpd } from "../utils/rgpd";
import { BsShieldCheck, BsBell, BsAward, BsClockHistory, BsTrophy, BsBarChart } from "react-icons/bs";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { MdOutlineAssignment, MdLeaderboard, MdOutlineVerified } from "react-icons/md";
import { FiUsers, FiLock, FiClock } from "react-icons/fi";

import { getNavItems } from "../utils/navConfig";

// Interruptor estilizado
function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`cfg-switch ${checked ? "on" : ""}`}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="cfg-switch-knob" />
    </button>
  );
}

function Configuracoes() {
  const navigate = useNavigate();
  const perfilAtivo = localStorage.getItem("perfilAtivo") || "1";
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "{}");

  // Preferências de notificações (local)
  const [notificacoes, setNotificacoes] = useState(true);
  const [notificacoesEmail, setNotificacoesEmail] = useState(true);
  const [resultadosCandidatura, setResultadosCandidatura] = useState(true);

  // RGPD (persistido no backend)
  const [rgpd, setRgpd] = useState(utilizador?.rgpd === true);
  const [aGuardarRgpd, setAGuardarRgpd] = useState(false);

  // Manter sessão iniciada (localStorage)
  const [lembrar, setLembrar] = useState(localStorage.getItem("lembrar") === "true");

  const alterarLembrar = (valor) => {
    setLembrar(valor);
    localStorage.setItem("lembrar", valor ? "true" : "false");
  };

  const navItems = getNavItems(perfilAtivo);

  const alterarRgpd = async (valor) => {
    if (!utilizador?.idutilizador) return;
    setRgpd(valor);
    setAGuardarRgpd(true);
    try {
      const novo = await definirRgpd(utilizador.idutilizador, valor);
      setRgpd(novo);
    } catch {
      setRgpd(!valor);
      alert("Não foi possível atualizar o consentimento RGPD. Tente novamente.");
    } finally {
      setAGuardarRgpd(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar navItems={navItems} />

      <div className="cfg-page">
        <h1 className="cfg-title">Configurações</h1>

        {/* Notificações */}
        <div className="cfg-card">
          <div className="cfg-section">
            <BsBell size={22} className="cfg-section-icon" />
            <h3>Notificações</h3>
          </div>

          <div className="cfg-toggle-row">
            <span className="cfg-toggle-label">Notificações</span>
            <Switch checked={notificacoes} onChange={setNotificacoes} />
          </div>
          <div className="cfg-toggle-row">
            <span className="cfg-toggle-label">Notificações por email</span>
            <Switch checked={notificacoesEmail} onChange={setNotificacoesEmail} />
          </div>
          <div className="cfg-toggle-row">
            <span className="cfg-toggle-label">Resultados de uma candidatura</span>
            <Switch checked={resultadosCandidatura} onChange={setResultadosCandidatura} />
          </div>
        </div>

        {/* Segurança & Privacidade */}
        <div className="cfg-card">
          <div className="cfg-section">
            <BsShieldCheck size={22} className="cfg-section-icon" />
            <h3>Segurança & Privacidade</h3>
          </div>

          <p className="cfg-subhead">Sessão & Segurança</p>
          <button className="cfg-action-btn" onClick={() => navigate("/alterar-password")}>
            <FiLock size={18} />
            Alterar palavra-passe
          </button>

          <div className="cfg-toggle-row" style={{ marginTop: 14 }}>
            <div className="cfg-toggle-text">
              <span className="cfg-toggle-label">Manter sessão iniciada</span>
              <span className="cfg-toggle-sub">
                Não terá de introduzir as credenciais sempre que abrir a aplicação.
              </span>
            </div>
            <Switch checked={lembrar} onChange={alterarLembrar} />
          </div>

          <p className="cfg-subhead" style={{ marginTop: 22 }}>Privacidade</p>
          <div className="cfg-toggle-row cfg-toggle-row--box">
            <div className="cfg-toggle-text">
              <span className="cfg-toggle-label">Aceitar os termos RGPD</span>
              <span className="cfg-toggle-sub">
                Autoriza a publicação e partilha dos teus badges conforme a política de privacidade.
              </span>
            </div>
            <Switch checked={rgpd} onChange={alterarRgpd} disabled={aGuardarRgpd} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;
