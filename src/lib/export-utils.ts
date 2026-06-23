// Client-only export helpers. Import dynamically inside event handlers.

export async function exportTableToExcel(tableEl: HTMLElement, filename: string, sheetName = "Sheet1") {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.table_to_book(tableEl, { sheet: sheetName });
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export async function exportElementToPdf(el: HTMLElement, filename: string, orientation: "portrait" | "landscape" = "landscape") {
  const mod = await import("html2pdf.js");
  const html2pdf = (mod as any).default || (mod as any);
  await html2pdf()
    .set({
      margin: 5,
      filename: filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation },
    })
    .from(el)
    .save();
}
