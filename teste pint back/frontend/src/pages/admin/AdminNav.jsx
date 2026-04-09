import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/AdminNav.css";

const LINKS = [
  { path: "/admin/utilizadores", label: "Utilizadores", icone: "👥" },
  { path: "/admin/badges", label: "Badges", icone: "🏅" },
];

function AdminNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  const handleLogout = () => {
    localStorage.removeItem("utilizador");
    localStorage.removeItem("perfilAtivo");
    navigate("/login");
  };

  return (
    <nav className="anav-wrapper">
      <div className="anav-esquerda">
        <span className="anav-logo" onClick={() => navigate("/admin/utilizadores")}>
          ⚙️ Admin
        </span>
        <div className="anav-links">
          {LINKS.map((link) => (
            <button
              key={link.path}
              className={`anav-link ${location.pathname === link.path ? "anav-link--ativo" : ""}`}
              onClick={() => navigate(link.path)}
            >
              <span>{link.icone}</span>
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <div className="anav-direita">
        <span className="anav-user">{utilizador?.nome?.split(" ")[0]}</span>
        <button className="anav-perfil" onClick={() => navigate("/perfil")}>
          Trocar perfil
        </button>
        <button className="anav-logout" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </nav>
  );
}

export default AdminNav;
