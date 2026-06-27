// Cálculo de expiração de badges para o consultor.
// Adaptado de um ExpiracaoService (Dart): soma `expiremeses` à data de conquista,
// limitando o dia ao último dia do mês de destino (evita o rollover do setMonth do JS).

// Último dia de um mês (mês em base 1). Equivalente a DateUtils.getDaysInMonth.
export function diasNoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

// Soma meses preservando o "fim do mês": 31/jan + 1 mês -> 28/29 fev (não 03/mar).
export function somarMeses(data, meses) {
  let ano = data.getFullYear();
  let mes = data.getMonth() + 1 + Number(meses); // base 1
  while (mes > 12) { mes -= 12; ano++; }
  const dia = Math.min(data.getDate(), diasNoMes(ano, mes));
  return new Date(ano, mes - 1, dia);
}

// Recebe candidaturas (já enriquecidas com expiremeses) e devolve a lista dos
// badges aprovados que expiram dentro de `limiteDias` (ou já expiraram),
// ordenada do mais urgente para o menos urgente.
export function calcularExpiracoes(candidaturas, limiteDias = 60) {
  const hoje = new Date();
  const hojeSemHoras = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  return (Array.isArray(candidaturas) ? candidaturas : [])
    .map((c) => {
      if (c?.estado?.toUpperCase() !== "APPROVED") return null; // só badges conquistados
      const meses = Number(c.expiremeses) || 0;
      if (meses <= 0) return null; // não expira

      const raw = c.dataaprovacao || c.datacriacao; // data de conquista
      if (!raw) return null;
      const base = new Date(raw);
      if (isNaN(base)) return null;

      const dataExpiracao = somarMeses(base, meses);
      const diasRestantes = Math.round((dataExpiracao - hojeSemHoras) / 86400000);
      if (diasRestantes > limiteDias) return null;

      return {
        idbadge: c.idbadge,
        idcandidatura: c.idcandidatura,
        nome: c.nome || c.badge_nome || "Badge",
        dataExpiracao,
        diasRestantes,
        expirado: diasRestantes < 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}
