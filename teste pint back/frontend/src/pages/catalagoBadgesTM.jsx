import { useNavigate } from "react-router-dom";
import BadgesList from "./BadgesList";
import { GoHome } from "react-icons/go";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsClockHistory, BsTrophy, BsBarChart } from "react-icons/bs";
import { MdOutlineVerified } from "react-icons/md";
import { FiUsers } from "react-icons/fi";

const NAV_ITEMS_TALENT = [
  { label: "Início",      icon: <GoHome size={16} /> },
  { label: "Validações",  icon: <MdOutlineVerified size={16} /> },
  { label: "Histórico",   icon: <BsClockHistory size={16} /> },
  { label: "Catálogo",    icon: <AiOutlineAppstore size={16} /> },
  { label: "Conquistas",  icon: <BsTrophy size={16} /> },
  { label: "Relatórios",  icon: <BsBarChart size={16} /> },
  { label: "Consultores", icon: <FiUsers size={16} /> },
];

function CatalogoBadgesTalent() {
  const navigate = useNavigate();

  const handleTabExtra = (label) => {
    if (label === "Início")      navigate("/talent/catalogo");
    if (label === "Validações")  navigate("/talent/validacoes");
    if (label === "Consultores") navigate("/talent/diretorio");
    if (label === "Conquistas")  navigate("/talent/conquistas");
  };

  return (
    <BadgesList
      navItems={NAV_ITEMS_TALENT}
      onTabExtra={handleTabExtra}
    />
  );
}

export default CatalogoBadgesTalent;