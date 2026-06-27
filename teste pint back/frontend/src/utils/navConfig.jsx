import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { MdOutlineAssignment, MdLeaderboard, MdOutlineVerified } from "react-icons/md";
import { BsAward, BsTrophy, BsBarChart, BsBell } from "react-icons/bs";
import { FiUsers, FiClock } from "react-icons/fi";


export const NAV_CONSULTOR = [
  { label: "Início",             path: "/consultor",              icon: <GoHome size={16} /> },
  { label: "Catálogo de Badges", path: "/consultor/catalogo",     icon: <AiOutlineAppstore size={16} /> },
  { label: "Os meus badges",     path: "/consultor/badges",       icon: <BsAward size={16} /> },
  { label: "Candidaturas",       path: "/consultor/candidaturas", icon: <MdOutlineAssignment size={16} /> },
  { label: "Conquistas",         path: "/consultor/conquistas",   icon: <BsTrophy size={16} /> },
  { label: "Rankings",           path: "/consultor/rankings",     icon: <MdLeaderboard size={16} /> },
  { label: "Lembretes",          path: "/consultor/lembretes",    icon: <FiClock size={16} /> },
];

export const NAV_TALENT = [
  { label: "Início",      path: "/talent/dashboard",  icon: <GoHome size={16} /> },
  { label: "Validações",  path: "/talent/validacoes", icon: <MdOutlineVerified size={16} /> },
  { label: "Catálogo",    path: "/talent/catalogo",   icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas",  path: "/talent/conquistas", icon: <BsTrophy size={16} /> },
  { label: "Relatórios",  path: "/talent/relatorios", icon: <BsBarChart size={16} /> },
  { label: "Consultores", path: "/talent/diretorio",  icon: <FiUsers size={16} /> },
];

export const NAV_SL = [
  { label: "Início",     path: "/sl/dashboard",  icon: <GoHome size={16} /> },
  { label: "Validações", path: "/sl/validacoes", icon: <MdOutlineVerified size={16} /> },
  { label: "Catálogo",   path: "/sl/catalogo",   icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas", path: "/sl/conquistas", icon: <BsTrophy size={16} /> },
  { label: "Ranking",    path: "/sl/ranking",    icon: <MdLeaderboard size={16} /> },
  { label: "Relatórios", path: "/sl/relatorios", icon: <BsBarChart size={16} /> },
];

export const NAV_ADMIN = [
  { label: "Início",       path: "/admin/dashboard",    icon: <GoHome size={16} /> },
  { label: "Utilizadores", path: "/admin/utilizadores", icon: <FiUsers size={16} /> },
  { label: "Badges",       path: "/admin/badges",       icon: <BsAward size={16} /> },
  { label: "Pedidos",      path: "/admin/pedidos",      icon: <MdOutlineAssignment size={16} /> },
  { label: "Notificações", path: "/admin/notificacoes", icon: <BsBell size={16} /> },
  { label: "Relatórios",   path: "/admin/relatorios",   icon: <BsBarChart size={16} /> },
];

export function getNavItems(perfilAtivo) {
  if (perfilAtivo === "2") return NAV_TALENT;
  if (perfilAtivo === "3") return NAV_SL;
  if (perfilAtivo === "4") return NAV_ADMIN;
  return NAV_CONSULTOR;
}

// Rota "casa" de cada perfil (primeiro item do respetivo menu).
export function getHomePath(perfilAtivo) {
  const items = getNavItems(perfilAtivo);
  return items[0]?.path || "/perfil";
}
