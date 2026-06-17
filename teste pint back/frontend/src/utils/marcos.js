// Marcos (milestones) que disparam uma celebração
const MARCOS_BADGES = [1, 5, 10, 15, 20, 25];
const MARCOS_PONTOS = [100, 500];
const ID_RANKING = "ranking_1";

export function verificarMarcos(idutilizador, { totalBadges = 0, totalPontos = 0, primeiroRanking = false } = {}) {
  if (!idutilizador) return null;
  const key = `marcos_${idutilizador}`;
  const primeiraVez = localStorage.getItem(key) === null;
  let celebrados = JSON.parse(localStorage.getItem(key) || "[]");

  const novos = [];

  MARCOS_BADGES.forEach((m) => {
    const id = `badges_${m}`;
    if (totalBadges >= m && !celebrados.includes(id)) {
      novos.push({ id, tipo: "badges", valor: m });
    }
  });

  MARCOS_PONTOS.forEach((m) => {
    const id = `pontos_${m}`;
    if (totalPontos >= m && !celebrados.includes(id)) {
      novos.push({ id, tipo: "pontos", valor: m });
    }
  });

  // 1º lugar no ranking
  if (primeiroRanking) {
    if (!celebrados.includes(ID_RANKING)) novos.push({ id: ID_RANKING, tipo: "ranking", valor: 1 });
  } else {
    celebrados = celebrados.filter((c) => c !== ID_RANKING);
  }

  // Persistir o estado
  localStorage.setItem(key, JSON.stringify([...celebrados, ...novos.map((n) => n.id)]));

  // Na primeira vez não celebra conquistas pré-existentes
  if (primeiraVez || novos.length === 0) return null;

  // Prioridade: ranking > pontos > badges; depois maior valor
  const ordem = { ranking: 3, pontos: 2, badges: 1 };
  return novos.sort((a, b) => (ordem[b.tipo] - ordem[a.tipo]) || (b.valor - a.valor))[0];
}
