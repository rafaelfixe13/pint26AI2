import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles/PagBadge.css";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsAward } from "react-icons/bs";
import { MdOutlineAssignment } from "react-icons/md";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaMedal } from "react-icons/fa";

function BadgeDetalhe() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Catálogo de Badges");

  const navItems = [
    { label: "Início",             icon: <GoHome size={16} /> },
    { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
    { label: "Os meus badges",     icon: <BsAward size={16} /> },
    { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
  ];

  useEffect(() => {
    fetch(`http://localhost:3000/api/badges/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Badge não encontrado.");
        return res.json();
      })
      .then((data) => { setBadge(data); setLoading(false); })
      .catch((err) => { console.error(err); setError("Erro ao carregar os detalhes do badge."); setLoading(false); });
  }, [id]);

  const voltarParaCatalogo = () => {
    const perfilAtivo = localStorage.getItem("perfilAtivo");
    if (perfilAtivo === "1") navigate("/consultor");
    else if (perfilAtivo === "2") navigate("/talent");
    else if (perfilAtivo === "4") navigate("/admin/utilizadores");
    else navigate("/perfil");
  };

  const handleTabChange = (label) => {
    setActiveTab(label);
    if (label === "Início" || label === "Catálogo de Badges") {
      voltarParaCatalogo();
    }
  };

  const getPointsColor = (pontos) => {
    if (pontos >= 100) return "#7c3aed";
    if (pontos >= 75)  return "#0369a1";
    if (pontos >= 50)  return "#059669";
    return "#d97706";
  };

  return (
    <div className="page-wrapper">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navItems={navItems}
      />

      <div className="badge-detail-page">
        <button className="back-link" onClick={voltarParaCatalogo}>
          <IoArrowBackOutline size={16} />
          Voltar ao Catálogo
        </button>

        {loading && (
          <div className="badge-detail-status">
            <p>A carregar detalhes do badge...</p>
          </div>
        )}

        {error && (
          <div className="badge-detail-status error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && badge && (
          <div className="badge-detail-card">
            <div className="badge-detail-left">
              <div className="badge-detail-icon-wrap">
                {badge.imagemurl ? (
                  <img
                    src={badge.imagemurl}
                    alt={badge.nome}
                    className="badge-detail-img"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="badge-detail-fallback"
                  style={{ display: badge.imagemurl ? "none" : "flex" }}
                >
                  <FaMedal size={56} color="#6b9bc7" />
                </div>
              </div>
            </div>

            <div className="badge-detail-center">
              <h1 className="badge-detail-title">{badge.nome}</h1>
              <p className="badge-detail-description">{badge.descricao}</p>

              <div className="badge-detail-info-grid">
                <div className="badge-detail-info-column">
                  {badge.learningpath && <p><span>Learning Path:</span> {badge.learningpath}</p>}
                  {badge.area         && <p><span>Área:</span> {badge.area}</p>}
                  {badge.estado       && <p><span>Estado:</span> {badge.estado}</p>}
                </div>
                <div className="badge-detail-info-column">
                  {badge.serviceline && <p><span>Service Line:</span> {badge.serviceline}</p>}
                  {badge.nivel       && <p><span>Nível:</span> {badge.nivel}</p>}
                </div>
              </div>
            </div>

            <div className="badge-detail-right">
              {badge.ispublic === false && (
                <span className="badge-tag-special">⭐ Conquista Especial</span>
              )}
              <div
                className="badge-detail-points"
                style={{ backgroundColor: getPointsColor(badge.pontos) }}
              >
                {badge.pontos} Pontos
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BadgeDetalhe;