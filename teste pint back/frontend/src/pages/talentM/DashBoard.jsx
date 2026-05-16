import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/TalentMDashboard.css"
import Navbar from "../NavBar"

import { GoHome } from "react-icons/go";
import { API_BASE } from "../../api";
import { MdOutlineVerified } from "react-icons/md";
import { BsClockHistory, BsTrophy, BsBarChart, BsPeopleFill, BsAwardFill, BsGraphUp } from "react-icons/bs";
import { AiOutlineAppstore } from "react-icons/ai";
import { FiUsers } from "react-icons/fi";

const NAV_ITEMS = [
    { label: "Início", icon: <GoHome size={16} /> },
    { label: "Validações", icon: <MdOutlineVerified size={16} /> },
    { label: "Histórico", icon: <BsClockHistory size={16} /> },
    { label: "Catálogo", icon: <AiOutlineAppstore size={16} /> },
    { label: "Conquistas", icon: <BsTrophy size={16} /> },
    { label: "Relatórios", icon: <BsBarChart size={16} /> },
    { label: "Consultores", icon: <FiUsers size={16} /> },
];



export default function DashBoard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Início");
    const [totalConsultores, setTotalConsultores] = useState("...");

    useEffect(() => {
        fetch(`${API_BASE}/admin/utilizadores`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setTotalConsultores(data.length);
                } else {
                    setTotalConsultores(0);
                }
            })
            .catch((err) => {
                console.error("Erro ao buscar consultores:", err);
                setTotalConsultores("-");
            });
    }, []);

    const handleTabChange = (label) => {
        setActiveTab(label);
        // Exemplo de rotas - altere para os URLs que tem criados no seu App.jsx
        if (label === "Início") navigate("/talent-manager");
        if (label === "Validações") navigate("/talent-manager/validacoes");
        if (label === "Histórico") navigate("/talent/historico");
        if (label === "Catálogo") navigate("/talent-manager/catalogo");
        if (label === "Conquistas") navigate("/talent/conquistas");
        if (label === "Relatórios") navigate("/talent-manager/relatorios");
        if (label === "Consultores") navigate("/talent/diretorio");
    };

    return (
        <div className="tm-dashboard-container">
            <Navbar activeTab={activeTab} onTabChange={handleTabChange} navItems={NAV_ITEMS} />

            <main className="tm-dashboard-content">
                <div className="tm-dashboard-header">
                    <h1>Visão Geral</h1>
                    <p>Resumo da sua equipa e atividade recente.</p>
                </div>

                <div className="tm-dashboard-cards">
                    <div className="tm-card">
                        <div className="tm-card-icon bg-blue">
                            <BsPeopleFill size={24} />
                        </div>
                        <div className="tm-card-info">
                            <h3>Consultores</h3>
                            <p className="tm-card-value">{totalConsultores}</p>
                        </div>
                    </div>

                    <div className="tm-card">
                        <div className="tm-card-icon bg-orange">
                            <MdOutlineVerified size={24} />
                        </div>
                        <div className="tm-card-info">
                            <h3>Validações Pendentes</h3>
                            <p className="tm-card-value">7</p>
                        </div>
                    </div>

                    <div className="tm-card">
                        <div className="tm-card-icon bg-green">
                            <BsAwardFill size={24} />
                        </div>
                        <div className="tm-card-info">
                            <h3>Novas Conquistas</h3>
                            <p className="tm-card-value">12</p>
                        </div>
                    </div>

                    <div className="tm-card">
                        <div className="tm-card-icon bg-purple">
                            <BsGraphUp size={24} />
                        </div>
                        <div className="tm-card-info">
                            <h3>Evolução da Equipa</h3>
                            <p className="tm-card-value">84%</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
