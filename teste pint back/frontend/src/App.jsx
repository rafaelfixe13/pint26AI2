import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import DefinirPassword from "./pages/DefinirPassword";
import AlterarPassword from "./pages/AlterarPassword";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import BadgesList from "./pages/BadgesList";
import Perfil from "./pages/Perfil";
import PagBadge from "./pages/PagBadge";
import GestaoUtilizadores from "./pages/admin/GestaoUtilizadores";
import GestaoBadges from "./pages/admin/GestaoBadges";


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


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/confirmar-email" element={<ConfirmarEmail />} />
        <Route path="/definir-password" element={<DefinirPassword />} />

        <Route
          path="/alterar-password"
          element={
            <RotaProtegida>
              <AlterarPassword />
            </RotaProtegida>
          }
        />


        <Route
          path="/perfil"
          element={
            <RotaProtegida>
              <SelecionarPerfil />
            </RotaProtegida>
          }
        />

        <Route
          path="/meu-perfil"
          element={
            <RotaProtegida>
              <Perfil />
            </RotaProtegida>
          }
        />

        <Route
          path="/badges/:id"
          element={
            <RotaProtegida>
              <PagBadge />
            </RotaProtegida>
          }
        />

        <Route
          path="/admin/utilizadores"
          element={
            <RotaAdmin>
              <GestaoUtilizadores />
            </RotaAdmin>
          }
        />

        <Route
          path="/admin/badges"
          element={
            <RotaAdmin>
              <GestaoBadges />
            </RotaAdmin>
          }
        />

        <Route
          path="/"
          element={
            <RotaProtegida>
              <BadgesList />
            </RotaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;
