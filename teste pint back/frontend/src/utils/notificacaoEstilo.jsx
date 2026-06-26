import { BsBell, BsInfoCircle, BsExclamationTriangle, BsAward, BsCheckCircle, BsXCircle } from "react-icons/bs";

// Mapeia o "tipo" de uma notificação para a sua aparência (chave de estilo, ícone e rótulo).
const MAPA = {
  aviso:       { chave: "aviso",       icon: <BsBell size={16} />,                label: "Aviso" },
  geral:       { chave: "geral",       icon: <BsInfoCircle size={16} />,          label: "Geral" },
  alerta:      { chave: "alerta",      icon: <BsExclamationTriangle size={16} />, label: "Alerta" },
  candidatura: { chave: "candidatura", icon: <BsAward size={16} />,               label: "Candidatura" },
  aprovacao:   { chave: "aprovacao",   icon: <BsCheckCircle size={16} />,         label: "Aprovação" },
  rejeicao:    { chave: "rejeicao",    icon: <BsXCircle size={16} />,             label: "Rejeição" },
};

export function estiloNotificacao(tipo) {
  return MAPA[tipo] || { chave: "geral", icon: <BsInfoCircle size={16} />, label: "Notificação" };
}

export default estiloNotificacao;
