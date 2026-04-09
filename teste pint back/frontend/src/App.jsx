import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import AlterarPassword from "./pages/AlterarPassword";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import BadgesList from "./pages/BadgesList";
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
        <Route path="/register" element={<Register />} />
        <Route path="/confirmar-email" element={<ConfirmarEmail />} />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
