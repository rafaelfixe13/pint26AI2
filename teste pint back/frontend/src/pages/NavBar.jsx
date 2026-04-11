import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import { BsBell, BsSearch, BsInfoCircle, BsQuestionCircle, BsTrash } from "react-icons/bs";
import { FaUser } from "react-icons/fa";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";

function Navbar({ activeTab, onTabChange, navItems }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmarLogout, setConfirmarLogout] = useState(false);
  const [utilizador, setUtilizador] = useState(
    JSON.parse(localStorage.getItem("utilizador") || "{}")
  );

  const [notifAberto, setNotifAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);

  useEffect(() => {
    const syncUtilizador = () => {
      setUtilizador(JSON.parse(localStorage.getItem("utilizador") || "{}"));
    };
    window.addEventListener("storage", syncUtilizador);
    return () => window.removeEventListener("storage", syncUtilizador);
  }, []);

  useEffect(() => {
    if (utilizador?.idutilizador) {
      fetchNotificacoes();
    }
  }, [utilizador?.idutilizador]);

  const getInitials = (nome) => {
    if (!nome) return "?";
    return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const getSaudacao = () => {
    if (utilizador?.primeirologin) return "Bem-vindo!";

    if (utilizador?.ultimadatalogin) {
      const ultima = new Date(utilizador.ultimadatalogin);
      const diffDias = (new Date() - ultima) / (1000 * 60 * 60 * 24);
      if (diffDias >= 15) return "Seja bem-vindo novamente";
    }

    const h = new Date().getHours();
    if (h < 12) return "Bom dia,";
    if (h < 19) return "Boa tarde,";
    return "Boa noite,";
  };

  const fotoAtual = utilizador?.fotourl;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("utilizador");
    localStorage.removeItem("perfilAtivo");
    navigate("/login");
  };

  // ---------- Notificações ----------

  const fetchNotificacoes = async () => {
    if (!utilizador?.idutilizador) return;
    setLoadingNotif(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/notificacoes/utilizador/${utilizador.idutilizador}`
      );
      const data = await res.json();
      setNotificacoes(data);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoadingNotif(false);
    }
  };

  const toggleNotif = () => {
    const novo = !notifAberto;
    setNotifAberto(novo);
    if (novo) fetchNotificacoes();
  };

  const marcarComoLida = async (idnotificacao) => {
    try {
      await fetch(
        `http://localhost:3000/api/notificacoes/${idnotificacao}/lida`,
        { method: "PATCH" }
      );
      setNotificacoes((prev) =>
        prev.map((n) =>
          n.idnotificacao === idnotificacao ? { ...n, lido: true } : n
        )
      );
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  const eliminarNotificacao = async (idnotificacao) => {
    try {
      await fetch(
        `http://localhost:3000/api/notificacoes/${idnotificacao}`,
        { method: "DELETE" }
      );
      setNotificacoes((prev) =>
        prev.filter((n) => n.idnotificacao !== idnotificacao)
      );
    } catch (err) {
      console.error("Erro ao eliminar notificação:", err);
    }
  };

  const formatarDataCurta = (data) => {
    if (!data) return "";
    return new Date(data).toLocaleString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const unreadCount = notificacoes.filter((n) => !n.lido).length;

  // ----------------------------------

  return (
    <>
      {/* Modal de confirmação de logout */}
      {confirmarLogout && (
        <div className="logout-overlay">
          <div className="logout-modal">
            <div className="logout-modal-icon">
              <IoLogOutOutline size={28} color="#4f6ef7" />
            </div>
            <p className="logout-modal-texto">Pretende terminar sessão?</p>
            <div className="logout-modal-botoes">
              <button className="logout-btn-sim" onClick={handleLogout}>
                Sim
              </button>
              <button
                className="logout-btn-voltar"
                onClick={() => setConfirmarLogout(false)}
              >
                Voltar
              </button>
            </div>
            <p className="logout-modal-nota">Pode voltar a qualquer momento.</p>
          </div>
        </div>
      )}

      <header className="navbar-wrapper">
        <div className="navbar-top">
          {/* Logo */}
          <div
            className="navbar-logo"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <span className="logo-soft">Softinsa</span>
            <span className="logo-badges"> Badges</span>
          </div>

          {/* Search */}
          <div className="navbar-search">
            <BsSearch size={15} />
            <input type="text" placeholder="Pesquisar..." />
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Notificações */}
            <div className="notifications-wrapper" ref={notifRef}>
              <button className="notif-btn" onClick={toggleNotif}>
                <BsBell size={20} />
                {unreadCount > 0 && (
                  <span className="notif-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notifAberto && (
                <div className="notifications-popup">
                  <div className="notifications-header">
                    <h3>Notificações</h3>
                  </div>

                  {loadingNotif ? (
                    <div className="notifications-empty">
                      A carregar notificações...
                    </div>
                  ) : notificacoes.length === 0 ? (
                    <div className="notifications-empty">
                      Não tens notificações.
                    </div>
                  ) : (
                    <div className="notifications-list">
                      {notificacoes.map((n) => (
                        <div
                          key={n.idnotificacao}
                          className="notification-item"
                          onClick={() => {
                            if (!n.lido) marcarComoLida(n.idnotificacao);
                          }}
                        >
                          <div className="notification-avatar">
                            <span>🟦</span>
                          </div>

                          <div className="notification-content">
                            <div className="notification-title">{n.titulo}</div>
                            <div className="notification-message">
                              {n.mensagem}
                            </div>
                            <div className="notification-meta">
                              {!n.lido && <span className="badge-unread-dot" />}
                              <span>{n.lido ? "Lida" : "Não lida"}</span>
                              <span>•</span>
                              <span>{formatarDataCurta(n.dataenvio)}</span>
                            </div>
                          </div>

                          <div
                            className="notification-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="notification-delete-btn"
                              onClick={() => eliminarNotificacao(n.idnotificacao)}
                              title="Eliminar"
                            >
                              <BsTrash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Perfil + Dropdown */}
            <div className="navbar-profile-wrap" ref={dropdownRef}>
              <div
                className="navbar-profile"
                onClick={() => setMenuAberto((prev) => !prev)}
                style={{ cursor: "pointer" }}
              >
                {fotoAtual ? (
                  <img
                    src={fotoAtual}
                    alt={utilizador.nome}
                    className="profile-avatar profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar">
                    {getInitials(utilizador?.nome)}
                  </div>
                )}
                <div className="profile-info">
                  <span className="profile-label">{getSaudacao()}</span>
                  <span className="profile-name">
                    {utilizador?.nome ?? "Utilizador"} ▾
                  </span>
                </div>
              </div>

              {menuAberto && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-foto-wrap">
                      {fotoAtual ? (
                        <img
                          src={fotoAtual}
                          alt={utilizador.nome}
                          className="dropdown-foto"
                        />
                      ) : (
                        <div className="dropdown-foto dropdown-foto-iniciais">
                          {getInitials(utilizador?.nome)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="dropdown-nome">{utilizador?.nome}</p>
                      <p className="dropdown-email">{utilizador?.email}</p>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setMenuAberto(false);
                      navigate("/meu-perfil");
                    }}
                  >
                    <FaUser size={15} />
                    O meu perfil
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => setMenuAberto(false)}
                  >
                    <IoSettingsOutline size={17} />
                    Configurações
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => setMenuAberto(false)}
                  >
                    <BsInfoCircle size={15} />
                    Sobre
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => setMenuAberto(false)}
                  >
                    <BsQuestionCircle size={15} />
                    Ajuda
                  </button>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-item dropdown-item-sair"
                    onClick={() => {
                      setMenuAberto(false);
                      setConfirmarLogout(true);
                    }}
                  >
                    <IoLogOutOutline size={17} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="navbar-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activeTab === item.label ? "active" : ""}`}
              onClick={() => onTabChange(item.label)}
            >
              {item.icon && <span className="nav-item-icon">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </nav>
      </header>
    </>
  );
}

export default Navbar;