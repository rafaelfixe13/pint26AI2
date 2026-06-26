export const buildEmailSignatureHtml = ({
  nome,
  cargo,
  email,
  badgeName,
  badgeImage,
}) => {
  const safeName = (nome || 'Seu nome').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeCargo = (cargo || 'Função').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeEmail = (email || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeBadgeName = (badgeName || 'Badge').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeBadgeImage = (badgeImage || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `
<div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 560px; padding: 16px 0;">
  <div style="border-top: 2px solid #dbeafe; padding-top: 12px; margin-top: 8px;">
    <div style="font-size: 15px; font-weight: 700; color: #1d4ed8;">${safeName}</div>
    <div style="font-size: 13px; color: #475569; margin-top: 2px;">${safeCargo}</div>
    <div style="font-size: 13px; color: #475569; margin-top: 2px;">${safeEmail}</div>
    <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; width: fit-content;">
      ${safeBadgeImage ? `<img src="${safeBadgeImage}" alt="${safeBadgeName}" style="width: 42px; height: 42px; border-radius: 999px; object-fit: cover;" />` : ''}
      <div style="font-size: 13px; color: #0f172a; font-weight: 600;">Badge: ${safeBadgeName}</div>
    </div>
  </div>
</div>`;
};
