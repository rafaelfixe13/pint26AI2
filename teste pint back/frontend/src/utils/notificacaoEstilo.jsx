import { BsBellFill, BsInfoCircleFill, BsExclamationTriangleFill } from "react-icons/bs";

// Devolve o ícone, a chave de estilo e o rótulo conforme o tipo da notificação.
// chave -> usada nas classes CSS: notif-item-<chave> e notif-av-<chave>.
export function estiloNotificacao(tipo) {
  const t = (tipo || "geral").toLowerCase();
  if (t === "alerta") {
    return { chave: "alerta", icon: <BsExclamationTriangleFill />, label: "Alerta" };
  }
  if (t === "aviso") {
    return { chave: "aviso", icon: <BsInfoCircleFill />, label: "Aviso" };
  }
  return { chave: "geral", icon: <BsBellFill />, label: "Normal" };
}
