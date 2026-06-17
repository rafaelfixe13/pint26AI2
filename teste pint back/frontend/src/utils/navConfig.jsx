import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { MdOutlineAssignment, MdLeaderboard, MdOutlineVerified } from "react-icons/md";
import { BsAward, BsClockHistory, BsTrophy, BsBarChart } from "react-icons/bs";
import { FiUsers, FiClock } from "react-icons/fi";

export const NAV_CONSULTOR = [
  { label: "Início",             icon: <GoHome size={16} /> },
  { label: "Catálogo de Badges", icon: <AiOutlineAppstore size={16} /> },
  { label: "Os meus badges",     icon: <BsAward size={16} /> },
  { label: "Candidaturas",       icon: <MdOutlineAssignment size={16} /> },
  { label: "Conquistas",         icon: <BsTrophy size={16} /> },
  { label: "Rankings",           icon: <MdLeaderboard size={16} /> },
  { label: "Lembretes",          icon: <FiClock size={16} /> },
];

export const NAV_TALENT = [
  { label: "Início",      icon: <GoHome size={16} /> },
  { label: "Validações",  icon: <MdOutlineVerified size={16} /> },
  { label: "Histórico",   icon: <BsClockHistory size={16} /> },
  { label: "Catálogo",    icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas",  icon: <BsTrophy size={16} /> },
  { label: "Relatórios",  icon: <BsBarChart size={16} /> },
  { label: "Consultores", icon: <FiUsers size={16} /> },
];

export const NAV_ADMIN = [
  { label: "Utilizadores", icon: <FiUsers size={16} /> },
  { label: "Badges",       icon: <BsAward size={16} /> },
];

export function getNavItems(perfilAtivo) {
  if (perfilAtivo === "2") return NAV_TALENT;
  if (perfilAtivo === "4") return NAV_ADMIN;
  return NAV_CONSULTOR;
}

const ROTAS = {
  "1": {
    "Início": "/consultor",
    "Catálogo de Badges": "/consultor/catalogo",
    "Os meus badges": "/consultor/badges",
    "Candidaturas": "/consultor/candidaturas",
    "Conquistas": "/consultor/conquistas",
    "Rankings": "/consultor/rankings",
    "Lembretes": "/consultor/lembretes",
  },
  "2": {
    "Início": "/talent",
    "Validações": "/talent/validacoes",
    "Histórico": "/talent/historico",
    "Catálogo": "/talent/catalogo",
    "Conquistas": "/talent/conquistas",
    "Relatórios": "/talent/relatorios",
    "Consultores": "/talent/diretorio",
  },
  "4": {
    "Utilizadores": "/admin/utilizadores",
    "Badges": "/admin/badges",
  },
};

export function navegarTab(navigate, perfilAtivo, label) {
  const destino = ROTAS[perfilAtivo]?.[label];
  if (destino) navigate(destino);
}
