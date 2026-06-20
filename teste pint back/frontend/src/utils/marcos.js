// Marcos (milestones) alinhados com a app mobile (milestone_service.dart).
// Critérios: candidaturas submetidas (total), badges aprovados e ritmo (3 em 30 dias).
const MARCOS = [
  // Candidaturas submetidas (total)
  { id: "cand_1",  emoji: "🚀", titulo: "Primeira Candidatura!", descricao: "Submeteste a tua primeira candidatura. O teu percurso começa agora!" },
  { id: "cand_3",  emoji: "🎯", titulo: "3 Candidaturas!",        descricao: "Já tens 3 candidaturas submetidas. Continua a crescer!" },
  { id: "cand_5",  emoji: "⭐", titulo: "5 Candidaturas!",         descricao: "Estás a meio caminho das 10 candidaturas. Não pares!" },
  { id: "cand_10", emoji: "🔥", titulo: "10 Candidaturas!",        descricao: "Incrível! 10 candidaturas submetidas. És um exemplo de dedicação!" },
  // Badges aprovados
  { id: "apr_1",   emoji: "🥇", titulo: "Primeiro Badge Aprovado!", descricao: "O teu primeiro badge foi aprovado. Parabéns pelo esforço!" },
  { id: "apr_3",   emoji: "🏅", titulo: "3 Badges Aprovados!",      descricao: "Já tens 3 badges aprovados. O teu perfil está a crescer!" },
  { id: "apr_5",   emoji: "💎", titulo: "5 Badges Aprovados!",      descricao: "5 badges aprovados! Estás a tornar-te num especialista!" },
  // Período: 3 candidaturas nos últimos 30 dias
  { id: "period_3_30d", emoji: "⚡", titulo: "3 em 30 dias!", descricao: "Submeteste 3 candidaturas no último mês. Que ritmo incrível!" },
];

const MARCOS_POR_ID = Object.fromEntries(MARCOS.map((m) => [m.id, m]));

// Avalia se um marco específico foi atingido, dados os totais.
function atingido(id, { total, aprovados, ultimos30d }) {
  switch (id) {
    case "cand_1":       return total >= 1;
    case "cand_3":       return total >= 3;
    case "cand_5":       return total >= 5;
    case "cand_10":      return total >= 10;
    case "apr_1":        return aprovados >= 1;
    case "apr_3":        return aprovados >= 3;
    case "apr_5":        return aprovados >= 5;
    case "period_3_30d": return ultimos30d >= 3;
    default:             return false;
  }
}

// Lê os marcos celebrados do localStorage. Aceita o formato antigo (array de
// strings) e o novo (array de { id, em }), normalizando para { id, em }.
function lerCelebrados(idutilizador) {
  try {
    const raw = JSON.parse(localStorage.getItem(`marcos_${idutilizador}`) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((x) => (typeof x === "string" ? { id: x, em: null } : x));
  } catch {
    return [];
  }
}

// Recebe a lista de candidaturas do utilizador e devolve os marcos NOVOS
// (ainda não celebrados), por ordem de definição — mostrados em sequência,
// tal como na app mobile. Persiste em localStorage por utilizador
// (equivalente à tabela SQLite `marcos_celebrados` do mobile).
export function verificarMarcos(idutilizador, candidaturas = []) {
  if (!idutilizador) return [];

  const lista = Array.isArray(candidaturas) ? candidaturas : [];
  const total = lista.length;
  const aprovados = lista.filter((c) => c.estado?.toUpperCase() === "APPROVED").length;

  const limite30d = new Date();
  limite30d.setDate(limite30d.getDate() - 30);
  const ultimos30d = lista.filter((c) => {
    const raw = c.datacriacao || c.datasubmissao;
    if (!raw) return false;
    const d = new Date(raw);
    return !isNaN(d.getTime()) && d > limite30d;
  }).length;

  const celebrados = lerCelebrados(idutilizador);
  const jaCelebrados = new Set(celebrados.map((c) => c.id));

  const novos = [];
  for (const m of MARCOS) {
    if (jaCelebrados.has(m.id)) continue;
    if (atingido(m.id, { total, aprovados, ultimos30d })) {
      novos.push(m);
      celebrados.push({ id: m.id, em: new Date().toISOString() });
    }
  }

  if (novos.length > 0) {
    localStorage.setItem(`marcos_${idutilizador}`, JSON.stringify(celebrados));
  }

  return novos;
}

// Lista os marcos já celebrados (para o perfil), com a data de celebração,
// mais recentes primeiro. Equivalente ao MilestoneService.listarCelebrados().
export function listarCelebrados(idutilizador) {
  if (!idutilizador) return [];
  return lerCelebrados(idutilizador)
    .filter((c) => MARCOS_POR_ID[c.id])
    .map((c) => ({ ...MARCOS_POR_ID[c.id], celebradoEm: c.em }))
    .sort((a, b) => new Date(b.celebradoEm || 0) - new Date(a.celebradoEm || 0));
}
