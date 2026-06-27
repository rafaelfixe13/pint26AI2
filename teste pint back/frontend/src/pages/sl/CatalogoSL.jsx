import BadgesList from "../BadgesList";
import { NAV_SL } from "../../utils/navConfig";

// Reutiliza o catálogo de badges (mostra todos os badges + descrições),
// mas com a navegação própria do perfil Service Line.
export default function CatalogoSL() {
  return <BadgesList navItems={NAV_SL} />;
}
