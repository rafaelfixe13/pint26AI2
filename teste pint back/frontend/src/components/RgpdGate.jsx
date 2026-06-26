import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import RgpdModal from "./RgpdModal";
import { definirRgpd } from "../utils/rgpd";

// Páginas onde o modal NÃO deve aparecer (públicas / autenticação).
const ROTAS_PUBLICAS = ["/login", "/register", "/recuperar-password", "/definir-password", "/confirmar-email", "/verificar", "/publico"];

// Mostra o modal de consentimento sempre que o utilizador tem rgpd=false
// (ex.: após o admin alterar a política, que repõe todos a false).
export default function RgpdGate() {
  const location = useLocation();
  const [mostrar, setMostrar] = useState(false);
  const [utilizador, setUtilizador] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ehPublica = ROTAS_PUBLICAS.some((p) => location.pathname.startsWith(p));
    const dispensado = sessionStorage.getItem("rgpdDispensado") === "1";
    const u = JSON.parse(localStorage.getItem("utilizador") || "null");

    if (!ehPublica && !dispensado && u?.idutilizador && u.rgpd === false) {
      setUtilizador(u);
      setMostrar(true);
    } else {
      setMostrar(false);
    }
  }, [location.pathname]);

  const aceitar = async () => {
    if (!utilizador) return;
    setLoading(true);
    try {
      await definirRgpd(utilizador.idutilizador, true);
      sessionStorage.removeItem("rgpdDispensado");
      setMostrar(false);
    } catch {
      alert("Não foi possível registar o consentimento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const recusar = () => {
    sessionStorage.setItem("rgpdDispensado", "1");
    setMostrar(false);
  };

  if (!mostrar) return null;
  return <RgpdModal onAccept={aceitar} onCancel={recusar} onReject={recusar} loading={loading} />;
}
