import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import DefinirPassword from "./pages/DefinirPassword";
import RecuperarPassword from "./pages/RecuperarPassword";
import AlterarPassword from "./pages/AlterarPassword";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import Perfil from "./pages/Perfil";
import PagBadge from "./pages/PagBadge";

import BadgesList from "./pages/BadgesList";
import ConsultorDashboard from "./pages/consultor/DashBoard";
import OsMeusBadges from "./pages/consultor/OsMeusBadges";
import CandidaturasBadge from "./pages/consultor/CandidaturasBadge";
import Rankings from "./pages/consultor/Rankings";
import ConquistasConsultor from "./pages/consultor/ConquistasConsultor";
import Lembretes from "./pages/consultor/Lembretes";

import DashBoard from "./pages/talentM/DashBoard";
import CatalogoBadgesTalent from "./pages/talentM/catalagoBadgesTM";
import DiretorioConsultores from "./pages/talentM/DirConsultoresTM";
import ConquistasTalent from "./pages/talentM/ConquistasTM";
import ValidacoesTM from "./pages/talentM/ValidacoesTM";
import RelatoriosTM from "./pages/talentM/relatoriosTM";

import ValidacoesSL from "./pages/ValidacoesSL";
import DashBoardSL from "./pages/sl/DashBoardSL";
import CatalogoSL from "./pages/sl/CatalogoSL";
import ConquistasSL from "./pages/sl/ConquistasSL";
import RelatoriosSL from "./pages/sl/RelatoriosSL";
import RankingSL from "./pages/sl/RankingSL";

import AdminDashboard from "./pages/admin/AdminDashboard";
import GestaoUtilizadores from "./pages/admin/GestaoUtilizadores";
import GestaoBadges from "./pages/admin/GestaoBadges";
import AdminRelatorios from "./pages/admin/AdminRelatorios";
import NotificacoesAdmin from "./pages/admin/Notificacoes";
import InformacoesAdmin from "./pages/admin/InformacoesAdmin";
import PoliticaRgpdAdmin from "./pages/admin/PoliticaRgpdAdmin";
import GestaoPedidos from "./pages/admin/GestaoPedidos";
import DetalhesUtilizador from "./pages/admin/DetalhesUtilizador";
import BadgesUtilizador from "./pages/admin/BadgesUtilizador";

import RgpdGate from "./components/RgpdGate";
import Sobre from "./pages/Sobre";
import Avisos from "./pages/Avisos";
import Ajuda from "./pages/Ajuda";
import Configuracoes from "./pages/Configuracoes";
import PerfilPublico from "./pages/PerfilPublico";
import VerificarBadge from "./pages/VerificarBadge";

const PERFIS_POR_ROLE = {
  1: [1],
  2: [2],
  3: [3],
  4: [4],
  5: [1, 2, 3, 4],
  6: [1, 3], // Consultor + Service Line
  7: [1, 2], // Consultor + Talent Manager
  8: [1, 4], // Consultor + Administrador
};

const temAcesso = (utilizador, idrole) => {
  const perfis = PERFIS_POR_ROLE[utilizador.idrole] ?? [utilizador.idrole];
  return perfis.includes(idrole);
};

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

function App() {
  return (
    <BrowserRouter>
      <RgpdGate />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirmar-email" element={<ConfirmarEmail />} />
        <Route path="/definir-password" element={<DefinirPassword />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />

        <Route path="/publico/consultor/:id" element={<PerfilPublico />} />
        <Route path="/verificar/:idcandidatura" element={<VerificarBadge />} />

        <Route path="/alterar-password" element={<RotaProtegida><AlterarPassword /></RotaProtegida>} />
        <Route path="/perfil" element={<RotaProtegida><SelecionarPerfil /></RotaProtegida>} />
        <Route path="/meu-perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path="/configuracoes" element={<RotaProtegida><Configuracoes /></RotaProtegida>} />
        <Route path="/badges/:id" element={<RotaProtegida><PagBadge /></RotaProtegida>} />
        <Route path="/sobre" element={<RotaProtegida><Sobre /></RotaProtegida>} />
        <Route path="/ajuda" element={<RotaProtegida><Ajuda /></RotaProtegida>} />
        <Route path="/avisos" element={<RotaProtegida><Avisos /></RotaProtegida>} />

        <Route path="/consultor" element={<RotaConsultor><ConsultorDashboard /></RotaConsultor>} />
        <Route path="/consultor/dashboard" element={<RotaConsultor><ConsultorDashboard /></RotaConsultor>} />
        <Route path="/consultor/catalogo" element={<RotaConsultor><BadgesList /></RotaConsultor>} />
        <Route path="/consultor/badges" element={<RotaConsultor><OsMeusBadges /></RotaConsultor>} />
        <Route path="/consultor/candidaturas" element={<RotaConsultor><CandidaturasBadge /></RotaConsultor>} />
        <Route path="/consultor/conquistas" element={<RotaConsultor><ConquistasConsultor /></RotaConsultor>} />
        <Route path="/consultor/rankings" element={<RotaConsultor><Rankings /></RotaConsultor>} />
        <Route path="/consultor/lembretes" element={<RotaConsultor><Lembretes /></RotaConsultor>} />

        <Route path="/talent/dashboard" element={<RotaTalent><DashBoard /></RotaTalent>} />
        <Route path="/talent/validacoes" element={<RotaTalent><ValidacoesTM /></RotaTalent>} />
        <Route path="/talent/catalogo" element={<RotaTalent><CatalogoBadgesTalent /></RotaTalent>} />
        <Route path="/talent/diretorio" element={<RotaTalent><DiretorioConsultores /></RotaTalent>} />
        <Route path="/talent/conquistas" element={<RotaTalent><ConquistasTalent /></RotaTalent>} />
        <Route path="/talent/relatorios" element={<RotaTalent><RelatoriosTM /></RotaTalent>} />

        <Route path="/sl/dashboard" element={<RotaSL><DashBoardSL /></RotaSL>} />
        <Route path="/sl/validacoes" element={<RotaSL><ValidacoesSL /></RotaSL>} />
        <Route path="/sl/catalogo" element={<RotaSL><CatalogoSL /></RotaSL>} />
        <Route path="/sl/conquistas" element={<RotaSL><ConquistasSL /></RotaSL>} />
        <Route path="/sl/relatorios" element={<RotaSL><RelatoriosSL /></RotaSL>} />
        <Route path="/sl/ranking" element={<RotaSL><RankingSL /></RotaSL>} />

        <Route path="/admin/dashboard" element={<RotaAdmin><AdminDashboard /></RotaAdmin>} />
        <Route path="/admin/pedidos" element={<RotaAdmin><GestaoPedidos /></RotaAdmin>} />
        <Route path="/admin/utilizadores" element={<RotaAdmin><GestaoUtilizadores /></RotaAdmin>} />
        <Route path="/admin/utilizadores/:id" element={<RotaAdmin><DetalhesUtilizador /></RotaAdmin>} />
        <Route path="/admin/utilizadores/:id/badges" element={<RotaAdmin><BadgesUtilizador /></RotaAdmin>} />
        <Route path="/admin/badges" element={<RotaAdmin><GestaoBadges /></RotaAdmin>} />
        <Route path="/admin/relatorios" element={<RotaAdmin><AdminRelatorios /></RotaAdmin>} />
        <Route path="/admin/notificacoes" element={<RotaAdmin><NotificacoesAdmin /></RotaAdmin>} />
        <Route path="/admin/informacoes" element={<RotaAdmin><InformacoesAdmin /></RotaAdmin>} />
        <Route path="/admin/rgpd" element={<RotaAdmin><PoliticaRgpdAdmin /></RotaAdmin>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
