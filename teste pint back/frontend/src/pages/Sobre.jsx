import { useNavigate } from "react-router-dom";
import "../styles/Sobre.css";
import Navbar from "./NavBar";
import { getNavItems } from "../utils/navConfig";
import { FaMedal } from "react-icons/fa";
import { FiUsers, FiSettings } from "react-icons/fi";

function Sobre() {
  const navigate = useNavigate();
  const perfilAtivo = localStorage.getItem("perfilAtivo") || "1";

  return (
    <div className="page-wrapper">
      <Navbar navItems={getNavItems(perfilAtivo)} />

      <div className="sobre-wrapper">
        <div className="sobre-intro">
          <h2 className="sobre-titulo">Sistema de Gestão de Competências e Badges – Softinsa</h2>
          <p className="sobre-descricao">
            Esta plataforma foi desenvolvida para apoiar a gestão, validação e evolução das
            competências dos consultores da Softinsa, através de um sistema estruturado de badges
            técnicos e comportamentais. O objetivo é promover transparência, reconhecimento e
            crescimento profissional alinhado com as Service Lines da organização.
          </p>
        </div>

        <div className="sobre-grelha">
          <div className="sobre-card">
            <h3><FaMedal /> Sistema de Badges</h3>
            <p>
              Badges representam competências certificadas, associadas a áreas técnicas e
              comportamentais, com níveis de senioridade de Júnior a Líder de Conhecimento.
            </p>

            <h3><FiUsers /> Perfis</h3>
            <div className="sobre-perfis">
              <div>
                <strong>Consultor</strong>
                <span>Submete pedidos, faz upload de evidências e acompanha progresso</span>
              </div>
              <div>
                <strong>Talent Manager</strong>
                <span>Valida evidências e assegura cumprimento de SLA</span>
              </div>
              <div>
                <strong>Service Line Leader</strong>
                <span>Realiza validação final e aprova pedidos</span>
              </div>
            </div>
          </div>

          <div className="sobre-card">
            <h3><FiSettings /> Como Funciona</h3>
            <ol className="sobre-steps">
              <li><span>1</span> Consultor submete pedido com evidências</li>
              <li><span>2</span> Talent Manager valida evidências</li>
              <li><span>3</span> Service Line Leader faz validação final</li>
              <li><span>4</span> Badge é aprovado ou devolvido com feedback</li>
            </ol>
            <p className="sobre-privacidade">
              <strong>Privacidade:</strong> Cumprimento de RGPD. Partilha de badges apenas com consentimento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sobre;