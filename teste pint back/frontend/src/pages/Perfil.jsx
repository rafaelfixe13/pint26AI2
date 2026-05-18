import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles/Perfil.css";
import { MdOutlineEmail, MdOutlineVerified, MdOutlineModeEdit, MdOutlineAssignment } from "react-icons/md";
import { BsCalendarCheck, BsAward, BsBarChart, BsClockHistory, BsTrophy } from "react-icons/bs";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { FiUsers } from "react-icons/fi";

// ─── Nav items por perfil ──────────────────────────────────
const NAV_CONSULTOR = [
  { label: "Início",             icon: <GoHome size={16} /> },
  { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
  { label: "Os meus badges",     icon: <BsAward size={16} /> },
  { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
];

const NAV_TALENT = [
  { label: "Início",      icon: <GoHome size={16} /> },
  { label: "Validações",  icon: <MdOutlineVerified size={16} /> },
  { label: "Histórico",   icon: <BsClockHistory size={16} /> },
  { label: "Catálogo",    icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas",  icon: <BsTrophy size={16} /> },
  { label: "Relatórios",  icon: <BsBarChart size={16} /> },
  { label: "Consultores", icon: <FiUsers size={16} /> },
];

const NAV_ADMIN = [
  { label: "Utilizadores", icon: <FiUsers size={16} /> },
  { label: "Badges",       icon: <BsAward size={16} /> },
];

function getNavItems(perfilAtivo) {
  if (perfilAtivo === "2") return NAV_TALENT;
  if (perfilAtivo === "4") return NAV_ADMIN;
  return NAV_CONSULTOR;
}

function Perfil() {
  const navigate = useNavigate();

  // ✅ Lê o perfil ativo logo no início
  const perfilAtivo = localStorage.getItem("perfilAtivo") || "1";

  const [activeTab, setActiveTab] = useState("O meu perfil");
  const [utilizador, setUtilizador] = useState(
    JSON.parse(localStorage.getItem("utilizador") || "{}")
  );
  const [fotoPreview, setFotoPreview] = useState(null);

  // ✅ navItems corretos para o perfil ativo
  const navItems = getNavItems(perfilAtivo);

  const getInitials = (nome) => {
    if (!nome) return "?";
    return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const formatarData = (data) => {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // ✅ handleTabChange com rotas corretas para cada perfil
  const handleTabChange = (label) => {
    setActiveTab(label);

    // Consultor (1)
    if (perfilAtivo === "1") {
      if (label === "Início")             navigate("/consultor");
      if (label === "Catálogo de Badges") navigate("/consultor/catalogo");
      if (label === "Os meus badges")     navigate("/consultor");
      if (label === "Candidaturas")       navigate("/consultor/candidaturas");
    }

    // Talent Manager (2)
    if (perfilAtivo === "2") {
      if (label === "Início")      navigate("/talent");
      if (label === "Validações")  navigate("/talent/validacoes");
      if (label === "Histórico")   navigate("/talent/historico");
      if (label === "Catálogo")    navigate("/talent/catalogo");
      if (label === "Conquistas")  navigate("/talent/conquistas");
      if (label === "Relatórios")  navigate("/talent/relatorios");
      if (label === "Consultores") navigate("/talent/diretorio");
    }

    // Admin (4)
    if (perfilAtivo === "4") {
      if (label === "Utilizadores") navigate("/admin/utilizadores");
      if (label === "Badges")       navigate("/admin/badges");
    }
  };

  const fotoAtual = fotoPreview || utilizador?.fotourl;

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setFotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("foto", file);

    try {
      const res = await fetch(
        `http://localhost:3000/api/utilizadores/${utilizador.idutilizador}/foto`,
        { method: "PUT", body: formData }
      );
      const data = await res.json();
      if (res.ok) {
        const u = { ...utilizador, fotourl: data.fotourl };
        localStorage.setItem("utilizador", JSON.stringify(u));
        setUtilizador(u);
        setFotoPreview(null);
      }
    } catch (err) {
      console.error("Erro ao atualizar foto de perfil:", err);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navItems={navItems}
      />

      <div className="perfil-page-container">
        <div className="perfil-layout">
          {/* Sidebar */}
          <div className="perfil-sidebar">
            <div className="perfil-foto-wrap">
              {fotoAtual ? (
                <img
                  src={fotoAtual}
                  alt={utilizador.nome}
                  className="perfil-foto"
                />
              ) : (
                <div className="perfil-foto perfil-foto-iniciais">
                  {getInitials(utilizador?.nome)}
                </div>
              )}

              <label className="perfil-foto-edit">
                <MdOutlineModeEdit size={16} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFotoChange}
                />
              </label>
            </div>

            <h2 className="perfil-nome">{utilizador?.nome ?? "—"}</h2>

            <div className="perfil-contactos">
              <div className="perfil-contacto-item">
                <MdOutlineEmail size={20} className="contacto-icon" />
                <div>
                  <span className="contacto-label">Email</span>
                  <span className="contacto-valor">{utilizador?.email ?? "—"}</span>
                </div>
              </div>

              <div className="perfil-contacto-item">
                <BsCalendarCheck size={18} className="contacto-icon" />
                <div>
                  <span className="contacto-label">Membro desde</span>
                  <span className="contacto-valor">{formatarData(utilizador?.datacriacao)}</span>
                </div>
              </div>

              <div className="perfil-contacto-item">
                <MdOutlineVerified size={20} className="contacto-icon" />
                <div>
                  <span className="contacto-label">Estado da conta</span>
                  <span className={`contacto-valor estado-${(utilizador?.estadoconta ?? "").toLowerCase()}`}>
                    {utilizador?.estadoconta ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil;