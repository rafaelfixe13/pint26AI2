import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Ajuda.css";
import "../styles/Sobre.css";
import {
  MdDiamond,
  MdDescription,
  MdCheckCircleOutline,
  MdCancel,
  MdSchedule,
  MdNotificationsNone,
  MdIosShare,
  MdTrendingUp,
  MdHelpOutline,
} from "react-icons/md";
import { FiChevronDown } from "react-icons/fi";
import { BsLightbulb } from "react-icons/bs";
import Navbar from "./NavBar";
import { getNavItems, navegarTab } from "../utils/navConfig";

const ajudaItems = [
  {
    icon: <MdDiamond size={20} />,
    title: "Sistema de Badges",
    content: (
      <div>
        <p className="ajuda-text">
          Os badges são certificações digitais que reconhecem competências e conquistas profissionais.
          Cada badge é validado por um Talent Manager e fica visível no teu perfil.
        </p>
        <div className="ajuda-bullets">
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Badges de Competência — validam skills técnicas ou comportamentais</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Badges de Projeto — reconhecem contribuições em projetos específicos</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Badges de Formação — certificam conclusão de cursos internos</p></div>
        </div>
      </div>
    ),
  },
  {
    icon: <MdDescription size={20} />,
    title: "Como pedir um Badge",
    content: (
      <div>
        <div className="ajuda-steps">
          <div className="ajuda-step"><span className="ajuda-step-num">1</span><p>Acede ao Catálogo de Badges</p></div>
          <div className="ajuda-step"><span className="ajuda-step-num">2</span><p>Seleciona o badge pretendido</p></div>
          <div className="ajuda-step"><span className="ajuda-step-num">3</span><p>Consulta os requisitos e critérios</p></div>
          <div className="ajuda-step"><span className="ajuda-step-num">4</span><p>Submete o pedido com evidências</p></div>
          <div className="ajuda-step"><span className="ajuda-step-num">5</span><p>Aguarda validação do Talent Manager</p></div>
        </div>
        <div className="ajuda-note"><BsLightbulb size={14} /><p>Pedidos incompletos podem ser devolvidos.</p></div>
      </div>
    ),
  },
  {
    icon: <MdCheckCircleOutline size={20} />,
    title: "Evidências aceites",
    content: (
      <div>
        <p className="ajuda-text">São aceites os seguintes tipos de evidências:</p>
        <div className="ajuda-bullets">
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Certificados digitais ou físicos digitalizados</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Capturas de ecrã de projetos ou entregas</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Links para repositórios ou portfólios públicos</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Relatórios de desempenho emitidos pela empresa</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Avaliações de chefias ou pares (peer review)</p></div>
        </div>
        <div className="ajuda-note"><BsLightbulb size={14} /><p>As evidências devem ser legíveis e estar em português ou inglês.</p></div>
      </div>
    ),
  },
  {
    icon: <MdCancel size={20} />,
    title: "Pedido devolvido ou rejeitado",
    content: (
      <div>
        <p className="ajuda-text">O teu pedido pode ter dois resultados negativos:</p>
        <div className="ajuda-bullets">
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Devolvido — faltam evidências; podes corrigir e resubmeter</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Rejeitado — critérios não cumpridos; podes recandidatar-te em 90 dias</p></div>
        </div>
        <p className="ajuda-text">Em ambos os casos receberás uma notificação com o motivo detalhado.</p>
        <div className="ajuda-note"><BsLightbulb size={14} /><p>Contacta o teu Talent Manager se tiveres dúvidas sobre a decisão.</p></div>
      </div>
    ),
  },
  {
    icon: <MdSchedule size={20} />,
    title: "SLA — Tempo de Resposta",
    content: (
      <div>
        <div className="ajuda-bullets">
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Avaliação inicial: até 2 dias úteis</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Validação completa: 3 a 5 dias úteis</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Períodos de alta demanda: até 10 dias úteis</p></div>
        </div>
        <div className="ajuda-note"><BsLightbulb size={14} /><p>Os prazos contam a partir da submissão com todas as evidências completas.</p></div>
      </div>
    ),
  },
  {
    icon: <MdNotificationsNone size={20} />,
    title: "Notificações",
    content: (
      <div>
        <p className="ajuda-text">Recebes notificações automáticas nos seguintes momentos:</p>
        <div className="ajuda-bullets">
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Pedido recebido e em avaliação</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Pedido devolvido para correção</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Badge aprovado e atribuído</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Novo badge disponível no catálogo</p></div>
        </div>
        <p className="ajuda-text">Gere as tuas preferências em Definições → Notificações.</p>
      </div>
    ),
  },
  {
    icon: <MdIosShare size={20} />,
    title: "Partilha de Badges",
    content: (
      <div>
        <div className="ajuda-steps">
          <div className="ajuda-step"><span className="ajuda-step-num">1</span><p>Acede ao teu perfil</p></div>
          <div className="ajuda-step"><span className="ajuda-step-num">2</span><p>Seleciona o badge que queres partilhar</p></div>
          <div className="ajuda-step"><span className="ajuda-step-num">3</span><p>Clica em "Partilhar"</p></div>
          <div className="ajuda-step"><span className="ajuda-step-num">4</span><p>Escolhe a plataforma (LinkedIn, email, etc.)</p></div>
        </div>
        <div className="ajuda-note"><BsLightbulb size={14} /><p>O link de partilha é público e verificável por qualquer pessoa.</p></div>
      </div>
    ),
  },
  {
    icon: <MdTrendingUp size={20} />,
    title: "Acompanhamento",
    content: (
      <div>
        <p className="ajuda-text">Na secção "O Meu Percurso" podes acompanhar:</p>
        <div className="ajuda-bullets">
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Estado de todos os pedidos submetidos</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Histórico de badges conquistados</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Progresso em direção a novos badges</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Feedback dos Talent Managers</p></div>
        </div>
      </div>
    ),
  },
  {
    icon: <MdHelpOutline size={20} />,
    title: "Precisa de mais ajuda?",
    content: (
      <div>
        <p className="ajuda-text">Se não encontraste a resposta que procuras, estamos aqui para ajudar:</p>
        <div className="ajuda-bullets">
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Email: suporte@badges.pt</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>Chat na app: dias úteis, 9h–18h</p></div>
          <div className="ajuda-bullet"><span className="ajuda-bullet-dot" /><p>FAQ completo em badges.pt/ajuda</p></div>
        </div>
        <div className="ajuda-note"><BsLightbulb size={14} /><p>O tempo médio de resposta por email é de 1 dia útil.</p></div>
      </div>
    ),
  },
];

function Ajuda() {
  const navigate = useNavigate();
  const perfilAtivo = localStorage.getItem("perfilAtivo") || "1";
  const [expandido, setExpandido] = useState(new Set());

  const toggle = (index) => {
    setExpandido((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <div className="page-wrapper">
      <Navbar
        activeTab=""
        navItems={getNavItems(perfilAtivo)}
        onTabChange={(l) => navegarTab(navigate, perfilAtivo, l)}
      />

      <div className="ajuda-wrapper">
        <div className="ajuda-lista">
          {ajudaItems.map((item, index) => {
            const aberto = expandido.has(index);
            return (
              <div key={index} className={`ajuda-tile ${aberto ? "aberto" : ""}`}>
                <button className="ajuda-tile-header" onClick={() => toggle(index)}>
                  <span className="ajuda-tile-icon">{item.icon}</span>
                  <span className="ajuda-tile-title">{item.title}</span>
                  <FiChevronDown
                    size={18}
                    className={`ajuda-tile-chevron ${aberto ? "rotated" : ""}`}
                  />
                </button>
                {aberto && (
                  <div className="ajuda-tile-body">
                    {item.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Ajuda;