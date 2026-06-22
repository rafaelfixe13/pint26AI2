import { useNavigate } from "react-router-dom";
import BadgesList from "../BadgesList";

import { GoHome } from "react-icons/go";
import { MdOutlineVerified } from "react-icons/md";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsTrophy, BsBarChart } from "react-icons/bs";

const NAV_ITEMS_SL = [
  { label: "Início",     icon: <GoHome size={16} /> },
  { label: "Validações", icon: <MdOutlineVerified size={16} /> },
  { label: "Catálogo",   icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas", icon: <BsTrophy size={16} /> },
  { label: "Relatórios", icon: <BsBarChart size={16} /> },
];

// Reutiliza o catálogo de badges (mostra todos os badges + descrições),
// mas com a navegação própria do perfil Service Line.
export default function CatalogoSL() {
  const navigate = useNavigate();

  const handleTab = (label) => {
    if (label === "Início")     navigate("/sl/dashboard");
    if (label === "Validações") navigate("/sl/validacoes");
    if (label === "Catálogo")   navigate("/sl/catalogo");
    if (label === "Conquistas") navigate("/sl/conquistas");
    if (label === "Relatórios") navigate("/sl/relatorios");
  };

  return (
    <BadgesList
      navItems={NAV_ITEMS_SL}
      onTabExtra={handleTab}
      activeTabInicial="Catálogo"
    />
  );
}
