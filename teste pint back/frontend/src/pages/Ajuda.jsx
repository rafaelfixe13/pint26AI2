import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Ajuda.css";
import "../styles/Sobre.css";
import { API_BASE } from "../api";
import { MdHelpOutline } from "react-icons/md";
import { FiChevronDown } from "react-icons/fi";
import Navbar from "./NavBar";
import { getNavItems, navegarTab } from "../utils/navConfig";

function Ajuda() {
  const navigate = useNavigate();
  const perfilAtivo = localStorage.getItem("perfilAtivo") || "1";
  const [expandido, setExpandido] = useState(new Set());
  const [extras, setExtras] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/informacoes/publicas?tipo=ajuda`)
      .then((r) => r.json())
      .then((d) => setExtras(Array.isArray(d) ? d : []))
      .catch(() => setExtras([]));
  }, []);

  const toggle = (index) => {
    setExpandido((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <div className="page-wrapper">
      <Navbar
        activeTab=""
        navItems={getNavItems(perfilAtivo)}
        onTabChange={(l) => navegarTab(navigate, perfilAtivo, l)}
      />

      <div className="ajuda-wrapper">
        {extras.length > 0 ? (
          <div className="ajuda-lista">
            {extras.map((info, index) => {
              const aberto = expandido.has(index);
              return (
                <div key={info.idinformacao} className={`ajuda-tile ${aberto ? "aberto" : ""}`}>
                  <button className="ajuda-tile-header" onClick={() => toggle(index)}>
                    <span className="ajuda-tile-icon"><MdHelpOutline size={20} /></span>
                    <span className="ajuda-tile-title">{info.titulo}</span>
                    <FiChevronDown size={18} className={`ajuda-tile-chevron ${aberto ? "rotated" : ""}`} />
                  </button>
                  {aberto && (
                    <div className="ajuda-tile-body">
                      <p className="ajuda-text" style={{ whiteSpace: "pre-line" }}>{info.conteudo}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="ajuda-text" style={{ textAlign: "center", padding: "2rem 0" }}>
            Ainda não há informação de ajuda disponível.
          </p>
        )}
      </div>
    </div>
  );
}

export default Ajuda;
