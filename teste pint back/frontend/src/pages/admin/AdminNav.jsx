import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/AdminNav.css";
import { BsBell, BsSearch, BsInfoCircle, BsQuestionCircle, BsTrash } from "react-icons/bs";
import { FaUser } from "react-icons/fa";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { MdSwitchAccount } from "react-icons/md";

const NAV_ITEMS = [
  { label: "Utilizadores", path: "/admin/utilizadores" },
  { label: "Badges", path: "/admin/badges" },
];

function AdminNav() {
  const navigate = useNavigate();
  const location = useLocation();
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

  return (
    <>
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

      <header className="an-header">
        <div className="an-top">
          {/* Logo */}
          <div
            className="an-logo"
            onClick={() => navigate("/admin/utilizadores")}
            style={{ cursor: "pointer" }}
          >
            <span className="logo-soft">Softinsa</span>
            <span className="logo-badges"> Admin</span>
          </div>

          {/* Search */}
          <div className="an-search">
            <BsSearch size={15} />
            <input type="text" placeholder="Pesquisar..." />
          </div>

          {/* Actions */}
          <div className="an-actions">
            {/* Notificações */}
            <div className="an-notif-wrap" ref={notifRef}>
              <button className="an-notif-btn" onClick={toggleNotif}>
                <BsBell size={20} />
                {unreadCount > 0 && (
                  <span className="an-notif-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notifAberto && (
                <div className="an-notif-popup">
                  <div className="an-notif-header">
                    <h3>Notificações</h3>
                  </div>

                  {loadingNotif ? (
                    <div className="an-notif-empty">
                      A carregar notificações...
                    </div>
                  ) : notificacoes.length === 0 ? (
                    <div className="an-notif-empty">
                      Não tens notificações.
                    </div>
                  ) : (
                    <div className="an-notif-list">
                      {notificacoes.map((n) => (
                        <div
                          key={n.idnotificacao}
                          className="an-notif-item"
                          onClick={() => {
                            if (!n.lido) marcarComoLida(n.idnotificacao);
                          }}
                        >
                          <div className="an-notif-avatar">
                            <span>🟦</span>
                          </div>
                          <div className="an-notif-content">
                            <div className="an-notif-title">{n.titulo}</div>
                            <div className="an-notif-message">{n.mensagem}</div>
                            <div className="an-notif-meta">
                              {!n.lido && <span className="an-unread-dot" />}
                              <span>{n.lido ? "Lida" : "Não lida"}</span>
                              <span>•</span>
                              <span>{formatarDataCurta(n.dataenvio)}</span>
                            </div>
                          </div>
                          <div
                            className="an-notif-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="an-notif-delete"
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
            <div className="an-profile-wrap" ref={dropdownRef}>
              <div
                className="an-profile"
                onClick={() => setMenuAberto((prev) => !prev)}
                style={{ cursor: "pointer" }}
              >
                {fotoAtual ? (
                  <img
                    src={fotoAtual}
                    alt={utilizador.nome}
                    className="an-avatar an-avatar-img"
                  />
                ) : (
                  <div className="an-avatar">
                    {getInitials(utilizador?.nome)}
                  </div>
                )}
                <div className="an-profile-info">
                  <span className="an-profile-label">{getSaudacao()}</span>
                  <span className="an-profile-name">
                    {utilizador?.nome ?? "Utilizador"} ▾
                  </span>
                </div>
              </div>

              {menuAberto && (
                <div className="an-dropdown">
                  <div className="an-dropdown-head">
                    <div className="an-foto-wrap">
                      {fotoAtual ? (
                        <img
                          src={fotoAtual}
                          alt={utilizador.nome}
                          className="an-foto"
                        />
                      ) : (
                        <div className="an-foto an-foto-iniciais">
                          {getInitials(utilizador?.nome)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="an-dropdown-nome">{utilizador?.nome}</p>
                      <p className="an-dropdown-email">{utilizador?.email}</p>
                    </div>
                  </div>

                  <div className="an-divider" />

                  <button
                    className="an-dropdown-item"
                    onClick={() => {
                      setMenuAberto(false);
                      navigate("/meu-perfil");
                    }}
                  >
                    <FaUser size={15} />
                    O meu perfil
                  </button>

                  <button
                    className="an-dropdown-item"
                    onClick={() => {
                      setMenuAberto(false);
                      navigate("/perfil");
                    }}
                  >
                    <MdSwitchAccount size={15} />
                    Trocar de perfil
                  </button>

                  <button className="an-dropdown-item" onClick={() => { setMenuAberto(false); navigate("/sobre"); }}>
                    <BsInfoCircle size={15} />
                    Sobre
                  </button>

                  <button className="an-dropdown-item" onClick={() => { setMenuAberto(false); navigate("/ajuda"); }}>
                    <BsQuestionCircle size={15} />
                    Ajuda
                  </button>

                  <div className="an-divider" />

                  <button
                    className="an-dropdown-item an-dropdown-sair"
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
        <nav className="an-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`an-nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
    </>
  );
}

export default AdminNav;
