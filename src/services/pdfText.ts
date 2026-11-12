/**
 * Lê o texto de um PDF no próprio navegador (pdf.js). Carregado só quando usado.
 * PDFs escaneados (imagem) não têm texto: o resultado vem vazio.
 */
export type PdfText = { head: string; full: string; pages: number };

export const extractPdfText = async (file: Blob, maxPages = 40): Promise<PdfText> => {
  const pdfjs = await import("pdfjs-dist");
  const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const texts: string[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, maxPages); i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      texts.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
    }
    return { head: texts[0] ?? "", full: texts.join("\n"), pages: doc.numPages };
  } finally {
    await doc.destroy();
  }
};
