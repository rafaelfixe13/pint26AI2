import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles/Perfil.css";
import { MdOutlineEmail, MdOutlineVerified, MdOutlineModeEdit } from "react-icons/md";
import { BsCalendarCheck, BsAward } from "react-icons/bs";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { MdOutlineAssignment } from "react-icons/md";

function Perfil() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("O meu perfil");

  const [utilizador, setUtilizador] = useState(
    JSON.parse(localStorage.getItem("utilizador") || "{}")
  );
  const [fotoPreview, setFotoPreview] = useState(null);

  const navItems = [
    { label: "Início",             icon: <GoHome size={16} /> },
    { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
    { label: "Os meus badges",     icon: <BsAward size={16} /> },
    { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
  ];

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

  // ✅ Navegação corrigida
  const navegarParaHome = () => {
    const perfilAtivo = localStorage.getItem("perfilAtivo");
    if (perfilAtivo === "1") navigate("/consultor");
    else if (perfilAtivo === "2") navigate("/talent");
    else if (perfilAtivo === "4") navigate("/admin/utilizadores");
    else navigate("/perfil");
  };

  const handleTabChange = (label) => {
    setActiveTab(label);
    if (label === "Início" || label === "Catálogo de Badges") {
      navegarParaHome();
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

          {/* (aqui podes mais tarde adicionar conteúdo principal do perfil) */}
        </div>
      </div>
    </div>
  );
}

export default Perfil;