import { API_BASE } from "../api";

// Define o consentimento RGPD no backend e atualiza o utilizador no localStorage.
export async function definirRgpd(idutilizador, valor) {
  const res = await fetch(`${API_BASE}/utilizadores/${idutilizador}/rgpd`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rgpd: valor }),
  });
  if (!res.ok) throw new Error("Falha ao atualizar consentimento RGPD.");
  const u = JSON.parse(localStorage.getItem("utilizador") || "{}");
  u.rgpd = valor;
  localStorage.setItem("utilizador", JSON.stringify(u));
  return valor;
}

export const temRgpd = () =>
  JSON.parse(localStorage.getItem("utilizador") || "{}")?.rgpd === true;
