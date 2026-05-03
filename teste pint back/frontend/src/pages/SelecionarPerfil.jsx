import { useNavigate } from "react-router-dom";
import "../styles/SelecionarPerfil.css";

const ROLE_ADMIN = 4;

const PERFIS = {
  1: {
    nome: "Consultor",
    descricao: "Aceda às suas badges, projetos e atividades.",
    icone: "👤",
  },
  2: {
    nome: "Talent Manager",
    descricao: "Gira colaboradores, avaliações e desenvolvimento de talento.",
    icone: "🎯",
  },
  3: {
    nome: "Service Line",
    descricao: "Supervisione a sua linha de serviço e equipas associadas.",
    icone: "🏢",
  },
  4: {
    nome: "Administrador",
    descricao: "Acesso total à gestão da plataforma.",
    icone: "⚙️",
  },
};

function SelecionarPerfil() {
  const navigate = useNavigate();
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");

  if (!utilizador) {
    navigate("/login");
    return null;
  }

  const perfisDoUtilizador = Array.isArray(utilizador.roles)
    ? utilizador.roles
    : [utilizador.idrole];

  const isAdmin = perfisDoUtilizador.includes(ROLE_ADMIN);

  const DESTINOS = {
    1: "/consultor",
    2: "/talent/catalogo",
    3: "/consultor",
    4: "/admin/utilizadores",
  };

  const handleSelecionarPerfil = (idrole) => {
    localStorage.setItem("perfilAtivo", String(idrole));
    navigate(DESTINOS[idrole] ?? "/consultor");
  };

  const handleLogout = () => {
    localStorage.removeItem("utilizador");
    localStorage.removeItem("perfilAtivo");
    navigate("/login");
  };

  return (
    <div className="perfil-wrapper">
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
