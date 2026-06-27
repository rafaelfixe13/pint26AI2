import { FaRocket, FaBullseye, FaStar, FaFire, FaMedal, FaAward, FaGem, FaBolt } from "react-icons/fa";

// Mapeia o token de ícone de um marco (definido em marcos.js, que é .js e não
// pode conter JSX) para o respetivo ícone do react-icons.
const ICONES = {
  rocket: <FaRocket />,
  target: <FaBullseye />,
  star:   <FaStar />,
  fire:   <FaFire />,
  gold:   <FaMedal />,
  medal:  <FaAward />,
  gem:    <FaGem />,
  bolt:   <FaBolt />,
};

export function marcoIcone(token) {
  return ICONES[token] || <FaStar />;
}
