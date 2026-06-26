import { useEffect, useState } from "react";
import { BsShieldCheck } from "react-icons/bs";
import { FiX } from "react-icons/fi";
import "../styles/Rgpd.css";
import { API_BASE } from "../api";

// Conteúdo de recurso, usado se ainda não existir política definida na BD.
const TITULO_FALLBACK = "Termos de publicação e partilha";
const SUB_FALLBACK =
  "Para tornar um badge público ou partilhá-lo (ex.: LinkedIn), precisa de aceitar os termos de proteção de dados (RGPD).";

export default function RgpdModal({ onAccept, onCancel, onReject, loading = false }) {
  const [politica, setPolitica] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/politica-rgpd`)
      .then((r) => r.json())
      .then((d) => { if (d && d.conteudo) setPolitica(d); })
      .catch(() => {});
  }, []);

  const recusar = onReject || onCancel;

  return (
    <div className="rgpd-overlay" onClick={onCancel}>
      <div className="rgpd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rgpd-close" onClick={onCancel} title="Fechar"><FiX size={18} /></button>

        <div className="rgpd-icon"><BsShieldCheck size={26} /></div>
        <h2 className="rgpd-title">{politica?.titulo || TITULO_FALLBACK}</h2>

        {politica ? (
          <div className="rgpd-terms" style={{ whiteSpace: "pre-line" }}>
            {politica.conteudo}
          </div>
        ) : (
          <>
            <p className="rgpd-sub">{SUB_FALLBACK}</p>
            <div className="rgpd-terms">
              <p>Ao aceitar, autoriza a Softinsa a:</p>
              <ul>
                <li>Publicar numa página pública o seu nome, foto e os badges que tornar públicos;</li>
                <li>Disponibilizar um link de verificação acessível por terceiros;</li>
                <li>Permitir a partilha desses badges em redes externas (ex.: LinkedIn).</li>
              </ul>
              <p className="rgpd-nota">
                Pode retirar este consentimento a qualquer momento em <strong>Configurações</strong>,
                deixando de partilhar os seus dados publicamente.
              </p>
            </div>
          </>
        )}

        <div className="rgpd-acoes">
          <button className="rgpd-btn-cancelar" onClick={recusar} disabled={loading}>Não aceitar</button>
          <button className="rgpd-btn-aceitar" onClick={onAccept} disabled={loading}>
            {loading ? "A guardar..." : "Aceitar e continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
