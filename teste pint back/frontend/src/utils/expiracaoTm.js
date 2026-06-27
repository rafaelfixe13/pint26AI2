export function obterInfoExpiracao(dataConquista, expiremeses, limiteDias = 3) {
  if (!expiremeses || !dataConquista) return null;

  const exp = new Date(dataConquista);
  exp.setMonth(exp.getMonth() + Number(expiremeses));
  const agora = new Date();
  const diasRestantes = Math.ceil((exp - agora) / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) {
    return { cls: 'tm-estado-expirado', texto: 'Expirado' };
  }

  if (diasRestantes <= limiteDias) {
    return { cls: 'tm-estado-aviso', texto: `Expira em ${diasRestantes} dias` };
  }

  return null;
}

export function filtrarBadgesProximosExpiracao(badges, limiteDias = 3) {
  return (Array.isArray(badges) ? badges : [])
    .map((badge) => {
      const info = obterInfoExpiracao(badge?.dataconquista, badge?.expiremeses, limiteDias);
      if (!info) return null;
      return { ...badge, texto: info.texto, cls: info.cls };
    })
    .filter(Boolean);
}
