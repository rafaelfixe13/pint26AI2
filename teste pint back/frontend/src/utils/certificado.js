import { jsPDF } from "jspdf";

// Carrega uma imagem (URL ou base64) como dataURL para embeber no PDF.
// Devolve null se não for possível (ex.: CORS).
function loadImageDataUrl(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    if (src.startsWith("data:")) return resolve(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}


export async function gerarCertificadoPDF(cert) {
  const {
    nome, badgeNome, nivel, area, serviceline, pontos, data, imagemurl,
  } = cert;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const cx = W / 2;

  // Fundo branco
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");

  // Molduras
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(3);
  doc.rect(22, 22, W - 44, H - 44);
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(1);
  doc.rect(32, 32, W - 64, H - 64);

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(29, 78, 216);
  doc.text("Softinsa", cx, 84, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  doc.text("PLATAFORMA DE BADGES", cx, 100, { align: "center" });

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text("CERTIFICADO DE CONQUISTA", cx, 150, { align: "center" });

  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(2);
  doc.line(cx - 64, 164, cx + 64, 164);

  // Corpo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(90, 90, 90);
  doc.text("Este certificado reconhece que", cx, 205, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(29, 78, 216);
  doc.text(nome || "-", cx, 240, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(90, 90, 90);
  doc.text("concluiu com sucesso o badge", cx, 272, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42);
  const badgeLine = nivel ? `${badgeNome} - ${nivel}` : (badgeNome || "-");
  doc.text(badgeLine, cx, 300, { align: "center" });

  const sub = [serviceline, area].filter(Boolean).join("   •   ");
  if (sub) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(130, 130, 130);
    doc.text(sub, cx, 320, { align: "center" });
  }

  // Imagem do badge (se possível)
  const imgData = await loadImageDataUrl(imagemurl);
  if (imgData) {
    try { doc.addImage(imgData, "PNG", cx - 30, 338, 60, 60); } catch { /* ignora */ }
  }

  // Pontos
  if (pontos != null) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(180, 83, 9);
    doc.text(`${pontos} pontos`, cx, imgData ? 416 : 360, { align: "center" });
  }

  // Rodapé
  const footY = H - 70;
  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(1);
  doc.line(70, footY, W - 70, footY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  const dataStr = data ? new Date(data).toLocaleDateString("pt-PT") : "-";
  doc.text(`Emitido em: ${dataStr}`, 80, footY + 20);
  doc.text("Softinsa  •  Credencial verificada", W - 80, footY + 20, { align: "right" });

  doc.setProperties({
    title: `Certificado - ${badgeNome || "Badge"} - ${nome || ""}`.trim(),
  });

  // Abre num novo separador (o visualizador permite descarregar)
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
  return blobUrl;
}
