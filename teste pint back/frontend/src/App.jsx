import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import AlterarPassword from "./pages/AlterarPassword";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import Perfil from "./pages/Perfil";
import PagBadge from "./pages/PagBadge";

// Consultor
import BadgesList from "./pages/BadgesList";

// Talent
import CatalogoBadgesTalent from "./pages/catalagoBadgesTM";
import DiretorioConsultores from "./pages/DirConsultoresTM";
import ConquistasTalent from "./pages/ConquistasTM";

// Admin
import GestaoUtilizadores from "./pages/admin/GestaoUtilizadores";
import GestaoBadges from "./pages/admin/GestaoBadges";
import DetalhesUtilizador from "./pages/admin/DetalhesUtilizador";
import BadgesUtilizador from "./pages/admin/BadgesUtilizador";

// Outras
import Sobre from "./pages/Sobre";
import Ajuda from "./pages/Ajuda";

function RotaProtegida({ children }) {
  const utilizador = localStorage.getItem("utilizador");
  return utilizador ? children : <Navigate to="/login" replace />;
}

function RotaAdmin({ children }) {
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");
  if (!utilizador) return <Navigate to="/login" replace />;
  const isAdmin =
    (Array.isArray(utilizador.roles) && utilizador.roles.includes(4)) ||
    utilizador.idrole === 4;
  return isAdmin ? children : <Navigate to="/perfil" replace />;
}

function RotaTalent({ children }) {
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");
  if (!utilizador) return <Navigate to="/login" replace />;
  const isTalent =
    (Array.isArray(utilizador.roles) && utilizador.roles.includes(2)) ||
    utilizador.idrole === 2;
  return isTalent ? children : <Navigate to="/perfil" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirmar-email" element={<ConfirmarEmail />} />

        <Route path="/alterar-password" element={<RotaProtegida><AlterarPassword /></RotaProtegida>} />
        <Route path="/perfil" element={<RotaProtegida><SelecionarPerfil /></RotaProtegida>} />
        <Route path="/meu-perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path="/badges/:id" element={<RotaProtegida><PagBadge /></RotaProtegida>} />

        {/* Consultor */}
        <Route path="/consultor" element={<RotaProtegida><BadgesList /></RotaProtegida>} />

        {/* Talent Manager */}
        <Route path="/talent/catalogo"   element={<RotaTalent><CatalogoBadgesTalent /></RotaTalent>} />
        <Route path="/talent/diretorio"  element={<RotaTalent><DiretorioConsultores /></RotaTalent>} />
        <Route path="/talent/conquistas" element={<RotaTalent><ConquistasTalent /></RotaTalent>} />

        {/* Admin */}
        <Route path="/admin/utilizadores" element={<RotaAdmin><GestaoUtilizadores /></RotaAdmin>} />
        <Route path="/admin/utilizadores/:id" element={<RotaAdmin><DetalhesUtilizador /></RotaAdmin>} />
        <Route path="/admin/utilizadores/:id/badges" element={<RotaAdmin><BadgesUtilizador /></RotaAdmin>} />
        <Route path="/admin/badges" element={<RotaAdmin><GestaoBadges /></RotaAdmin>} />

        <Route path="/sobre" element={<RotaProtegida><Sobre /></RotaProtegida>} />
        <Route path="/ajuda" element={<RotaProtegida><Ajuda /></RotaProtegida>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
