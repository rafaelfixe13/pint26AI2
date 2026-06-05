import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import DefinirPassword from "./pages/DefinirPassword";
import AlterarPassword from "./pages/AlterarPassword";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import Perfil from "./pages/Perfil";
import PagBadge from "./pages/PagBadge";

// Consultor
import BadgesList from "./pages/BadgesList";
import ConsultorDashboard from "./pages/consultor/DashBoard";
import OsMeusBadges from "./pages/consultor/OsMeusBadges";
import CandidaturasBadge from "./pages/consultor/CandidaturasBadge";
import Rankings from "./pages/consultor/Rankings";
import ConquistasConsultor from "./pages/consultor/ConquistasConsultor";

// Talent
import DashBoard from "./pages/talentM/DashBoard";
import CatalogoBadgesTalent from "./pages/talentM/catalagoBadgesTM";
import DiretorioConsultores from "./pages/talentM/DirConsultoresTM";
import ConquistasTalent from "./pages/talentM/ConquistasTM";
import ValidacoesTM from "./pages/talentM/ValidacoesTM";

// Service Line
import ValidacoesSL from "./pages/ValidacoesSL";

// Admin
import GestaoUtilizadores from "./pages/admin/GestaoUtilizadores";
import GestaoBadges from "./pages/admin/GestaoBadges";
import DetalhesUtilizador from "./pages/admin/DetalhesUtilizador";
import BadgesUtilizador from "./pages/admin/BadgesUtilizador";

// Outras
import Sobre from "./pages/Sobre";
import Ajuda from "./pages/Ajuda";

// ── Mapeamento de roles ───────────────────────────────────────────
const PERFIS_POR_ROLE = {
  1: [1],
  2: [2],
  3: [3],
  4: [4],
  5: [1, 2, 3, 4],
};

const temAcesso = (utilizador, idrole) => {
  const perfis = PERFIS_POR_ROLE[utilizador.idrole] ?? [utilizador.idrole];
  return perfis.includes(idrole);
};

// ── Guards ────────────────────────────────────────────────────────
function RotaProtegida({ children }) {
  const utilizador = localStorage.getItem("utilizador");
  return utilizador ? children : <Navigate to="/login" replace />;
}

function RotaConsultor({ children }) {
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");
  if (!utilizador) return <Navigate to="/login" replace />;
  return temAcesso(utilizador, 1) ? children : <Navigate to="/perfil" replace />;
}

function RotaTalent({ children }) {
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");
  if (!utilizador) return <Navigate to="/login" replace />;
  return temAcesso(utilizador, 2) ? children : <Navigate to="/perfil" replace />;
}

function RotaSL({ children }) {
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");
  if (!utilizador) return <Navigate to="/login" replace />;
  return temAcesso(utilizador, 3) ? children : <Navigate to="/perfil" replace />;
}

function RotaAdmin({ children }) {
  const utilizador = JSON.parse(localStorage.getItem("utilizador") || "null");
  if (!utilizador) return <Navigate to="/login" replace />;
  return temAcesso(utilizador, 4) ? children : <Navigate to="/perfil" replace />;
}

// ── App ───────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login"            element={<Login />} />
        <Route path="/register"         element={<Register />} />
        <Route path="/confirmar-email"  element={<ConfirmarEmail />} />
        <Route path="/definir-password" element={<DefinirPassword />} />

        {/* Autenticadas (qualquer role) */}
        <Route path="/alterar-password" element={<RotaProtegida><AlterarPassword /></RotaProtegida>} />
        <Route path="/perfil"           element={<RotaProtegida><SelecionarPerfil /></RotaProtegida>} />
        <Route path="/meu-perfil"       element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path="/badges/:id"       element={<RotaProtegida><PagBadge /></RotaProtegida>} />
        <Route path="/sobre"            element={<RotaProtegida><Sobre /></RotaProtegida>} />
        <Route path="/ajuda"            element={<RotaProtegida><Ajuda /></RotaProtegida>} />

        {/* Consultor (role 1) */}
        <Route path="/consultor"              element={<RotaConsultor><ConsultorDashboard /></RotaConsultor>} />
        <Route path="/consultor/dashboard"    element={<RotaConsultor><ConsultorDashboard /></RotaConsultor>} />
        <Route path="/consultor/catalogo"     element={<RotaConsultor><BadgesList /></RotaConsultor>} />
        <Route path="/consultor/badges"       element={<RotaConsultor><OsMeusBadges /></RotaConsultor>} />
        <Route path="/consultor/candidaturas" element={<RotaConsultor><CandidaturasBadge /></RotaConsultor>} />
        <Route path="/consultor/conquistas"   element={<RotaConsultor><ConquistasConsultor /></RotaConsultor>} />
        <Route path="/consultor/rankings"     element={<RotaConsultor><Rankings /></RotaConsultor>} />

        {/* Talent Manager (role 2) */}
        <Route path="/talent/dashboard"  element={<RotaTalent><DashBoard /></RotaTalent>} />
        <Route path="/talent/validacoes" element={<RotaTalent><ValidacoesTM /></RotaTalent>} />
        <Route path="/talent/catalogo"   element={<RotaTalent><CatalogoBadgesTalent /></RotaTalent>} />
        <Route path="/talent/diretorio"  element={<RotaTalent><DiretorioConsultores /></RotaTalent>} />
        <Route path="/talent/conquistas" element={<RotaTalent><ConquistasTalent /></RotaTalent>} />

        {/* Service Line (role 3) */}
        <Route path="/sl/validacoes" element={<RotaSL><ValidacoesSL /></RotaSL>} />

        {/* Admin (role 4) */}
        <Route path="/admin/utilizadores"            element={<RotaAdmin><GestaoUtilizadores /></RotaAdmin>} />
        <Route path="/admin/utilizadores/:id"        element={<RotaAdmin><DetalhesUtilizador /></RotaAdmin>} />
        <Route path="/admin/utilizadores/:id/badges" element={<RotaAdmin><BadgesUtilizador /></RotaAdmin>} />
        <Route path="/admin/badges"                  element={<RotaAdmin><GestaoBadges /></RotaAdmin>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;