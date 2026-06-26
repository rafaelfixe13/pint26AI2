import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Sobre.css";
import Navbar from "./NavBar";
import { getNavItems, navegarTab } from "../utils/navConfig";
import { API_BASE } from "../api";

function Avisos() {
  const navigate = useNavigate();
  const perfilAtivo = localStorage.getItem("perfilAtivo") || "1";
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/informacoes/publicas?tipo=aviso`)
      .then((r) => r.json())
      .then((d) => setAvisos(Array.isArray(d) ? d : []))
      .catch(() => setAvisos([]));
  }, []);

  return (
    <div className="page-wrapper">
      <Navbar
        activeTab=""
        navItems={getNavItems(perfilAtivo)}
        onTabChange={(l) => navegarTab(navigate, perfilAtivo, l)}
      />

      <div className="sobre-wrapper">
        <div className="sobre-intro">
          <h2 className="sobre-titulo">Avisos</h2>
        </div>

        {avisos.length > 0 ? (
          <div className="sobre-grelha">
            {avisos.map((info) => (
              <div key={info.idinformacao} className="sobre-card">
                <h3>{info.titulo}</h3>
                <p style={{ whiteSpace: "pre-line" }}>{info.conteudo}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="sobre-descricao">Não há avisos de momento.</p>
        )}
      </div>
    </div>
  );
}

export default Avisos;
