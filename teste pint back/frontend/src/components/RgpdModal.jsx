import { BsShieldCheck } from "react-icons/bs";
import { FiX } from "react-icons/fi";
import "../styles/Rgpd.css";

export default function RgpdModal({ onAccept, onCancel, loading = false }) {
  return (
    <div className="rgpd-overlay" onClick={onCancel}>
      <div className="rgpd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rgpd-close" onClick={onCancel} title="Fechar"><FiX size={18} /></button>

        <div className="rgpd-icon"><BsShieldCheck size={26} /></div>
        <h2 className="rgpd-title">Termos de publicação e partilha</h2>
        <p className="rgpd-sub">
          Para tornar um badge público ou partilhá-lo (ex.: LinkedIn), precisa de aceitar os termos de
          proteção de dados (RGPD).
        </p>

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

        <div className="rgpd-acoes">
          <button className="rgpd-btn-cancelar" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button className="rgpd-btn-aceitar" onClick={onAccept} disabled={loading}>
            {loading ? "A guardar..." : "Aceitar e continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
