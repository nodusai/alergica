/**
 * Análise de rótulos de alimentos (módulo Produtos).
 *
 * 1. n8n (IA) — quando VITE_N8N_WEBHOOK_URL está configurado e responde no formato esperado.
 * 2. Reserva local — leitura do texto da foto no próprio aparelho (Tesseract.js) + regras de leite.
 *    A foto não sai do aparelho. Por segurança, a leitura local só AFIRMA quando encontra leite;
 *    quando não encontra, o resultado é "inconclusivo" — nunca "seguro".
 */

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined;

/** Resposta esperada do n8n */
export type AiScanResult = {
  safe: boolean;
  product?: string;
  allergens?: string[];
  details?: string;
};

export type LocalVerdict = "contains" | "traces" | "inconclusive";

export type LocalScanResult = {
  verdict: LocalVerdict;
  /** Termos lácteos encontrados no texto */
  found: string[];
  /** Confiança média da leitura (0–100) */
  confidence: number;
  /** Leitura fraca demais para concluir qualquer coisa */
  lowQuality: boolean;
  text: string;
};

export type ScanOutcome =
  | { source: "ai"; result: AiScanResult }
  | { source: "local"; result: LocalScanResult };

// ─── Regras de leite no texto do rótulo ──────────────────────────────────────

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

/** Termos que indicam leite ou derivados em rótulos brasileiros */
export const MILK_TERMS = [
  "leite",
  "lactose",
  "caseina",
  "caseinato",
  "lactoalbumina",
  "lactoglobulina",
  "soro de leite",
  "whey",
  "manteiga",
  "creme de leite",
  "queijo",
  "requeijao",
  "iogurte",
  "lacteo",
  "lactea",
  "lacteos",
  "gordura do leite",
  "nata",
];

/** Leitura abaixo desta confiança é tratada como foto ruim */
export const MIN_CONFIDENCE = 70;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const termRegex = (t: string) => new RegExp(`(^|[^a-z])${escape(t)}([^a-z]|$)`);

/** Distância de edição (Levenshtein) com corte em 2 — suficiente para erros de leitura */
const editDistance = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
};

/** Troca confusões típicas da leitura automática (1→l, 0→o, |→l) para comparar palavras */
const ocrFix = (s: string) => s.replace(/[1|!]/g, "l").replace(/0/g, "o").replace(/3/g, "e").replace(/5/g, "s");

/**
 * O termo aparece no texto? Termos de uma palavra com 5+ letras aceitam 1 letra errada
 * ("le1te", "lelte", "lactcse"), porque a leitura de rótulos curvos ou inclinados erra letras.
 * Na dúvida, o erro vai para o lado seguro (indicar leite).
 */
const hasTerm = (text: string, term: string) => {
  if (termRegex(term).test(text)) return true;
  if (term.includes(" ") || term.length < 5) return false;
  return ocrFix(text)
    .split(/[^a-z]+/)
    .some((tok) => tok.length >= term.length - 1 && tok.length <= term.length + 1 && editDistance(tok, term) <= 1);
};

/**
 * Classifica o texto lido do rótulo.
 * - "contains": algum termo lácteo aparece fora de trechos de "pode conter" / "não contém".
 * - "traces": termo lácteo só aparece em "pode conter ...".
 * - "inconclusive": nenhum termo encontrado (não significa que é seguro).
 */
export const classifyLabelText = (raw: string): Pick<LocalScanResult, "verdict" | "found"> => {
  const t = norm(raw);
  // "pode conter" com pequenas falhas de leitura ("pode conler", "podem conter")
  const tracesRe = /podem? co[nm]\w{1,4}r?([^.]*)/g;
  const tracesParts = [...t.matchAll(tracesRe)].map((m) => m[1]);
  const traceTerms = MILK_TERMS.filter((w) => tracesParts.some((p) => hasTerm(p, w)));

  const body = t
    .replace(tracesRe, " ")
    .replace(/nao contem[^.]*/g, " ")
    // "zero lactose" / "sem lactose" descrevem o produto, não são ingredientes
    .replace(/(zero|sem|0 ?%|baixo teor de|reduzido em) lactose/g, " ");
  const found = MILK_TERMS.filter((w) => hasTerm(body, w));

  if (found.length) return { verdict: "contains", found };
  if (traceTerms.length) return { verdict: "traces", found: traceTerms };
  return { verdict: "inconclusive", found: [] };
};

// ─── Análises ────────────────────────────────────────────────────────────────

export const isAiConfigured = () => !!N8N_WEBHOOK_URL;

const analyzeWithAi = async (image: Blob): Promise<AiScanResult> => {
  if (!N8N_WEBHOOK_URL) throw new Error("Webhook de análise não configurado");
  const formData = new FormData();
  formData.append("image", image, "produto.jpg");
  const response = await fetch(N8N_WEBHOOK_URL, { method: "POST", body: formData, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`n8n respondeu ${response.status}`);
  const data = await response.json();
  // Só aceita resposta com veredito explícito; nunca inventa um resultado
  if (typeof data?.safe !== "boolean") throw new Error("Resposta inválida da análise");
  return data as AiScanResult;
};

// ─── Preparação da imagem (canvas) ───────────────────────────────────────────

/** Lado maior usado na leitura: fotos pequenas são ampliadas, fotos grandes reduzidas (velocidade) */
const TARGET_SIDE = 2000;

const newCanvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/** Tons de cinza + contraste esticado (ignora 1% dos extremos). Melhora muito letra escura em fundo colorido. */
const toGrayContrast = (src: CanvasImageSource, w: number, h: number) => {
  const c = newCanvas(w, h);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    d[i] = g;
    hist[g | 0]++;
  }
  const total = d.length / 4;
  let lo = 0, hi = 255, acc = 0;
  for (; lo < 255 && (acc += hist[lo]) < total * 0.01; lo++);
  acc = 0;
  for (; hi > 0 && (acc += hist[hi]) < total * 0.01; hi--);
  const range = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.min(255, Math.max(0, ((d[i] - lo) * 255) / range));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return c;
};

const rotated = (src: HTMLCanvasElement, deg: number, size?: number) => {
  const scale = size ? size / Math.max(src.width, src.height) : 1;
  const w = src.width * scale, h = src.height * scale;
  const rad = (deg * Math.PI) / 180;
  const cw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
  const ch = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
  const c = newCanvas(cw, ch);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(rad);
  ctx.drawImage(src, -w / 2, -h / 2, w, h);
  return c;
};

/**
 * Estima a inclinação do texto (perfil de projeção): gira uma miniatura de -20° a +20°
 * e escolhe o ângulo em que as linhas de texto ficam mais "nítidas" na horizontal.
 * Testado: foto de rótulo inclinada → -10°, leitura passou de 40% para ~80%.
 */
export const estimateSkew = (gray: HTMLCanvasElement) => {
  let best = { angle: 0, score: -1 };
  for (let a = -20; a <= 20; a++) {
    const c = rotated(gray, a, 500);
    const { data, width: w, height: h } = c.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height);
    let score = 0, prev = 0;
    for (let y = 0; y < h; y++) {
      let ink = 0;
      for (let x = 0; x < w; x++) ink += 255 - data[(y * w + x) * 4];
      if (y > 0) score += (ink - prev) ** 2;
      prev = ink;
    }
    if (score > best.score) best = { angle: a, score };
  }
  return best.angle;
};

/** Foto pronta para leitura: tamanho padronizado, cinza com contraste e texto endireitado */
const prepareForOcr = async (image: Blob) => {
  const bmp = await createImageBitmap(image);
  const scale = TARGET_SIDE / Math.max(bmp.width, bmp.height);
  const gray = toGrayContrast(bmp, bmp.width * scale, bmp.height * scale);
  bmp.close();
  const angle = estimateSkew(gray);
  return { canvas: angle ? rotated(gray, angle) : gray, angle };
};

const analyzeLocally = async (image: Blob, onProgress?: (p: number) => void): Promise<LocalScanResult> => {
  // Carregado só quando necessário (biblioteca e dados de idioma pesam alguns MB)
  const { createWorker, PSM } = await import("tesseract.js");
  let pass = 0;
  const PASSES = 2;
  const worker = await createWorker("por", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.((pass + m.progress) / PASSES);
    },
  });
  try {
    const { canvas } = await prepareForOcr(image);
    const read = async (psm: string) => {
      await worker.setParameters({ tessedit_pageseg_mode: psm as never });
      const { data } = await worker.recognize(canvas);
      const confidence = Math.round(data.confidence);
      // Confiança alta com pouquíssimo texto é falsa (nada foi lido de verdade)
      const letters = data.text.replace(/[^\p{L}]/gu, "").length;
      const lowQuality = confidence < MIN_CONFIDENCE || letters < 40;
      return { ...classifyLabelText(data.text), confidence, lowQuality, text: data.text };
    };

    // 1ª leitura: bloco de texto único (melhor para listas de ingredientes)
    const first = await read(PSM.SINGLE_BLOCK);
    if (first.verdict === "contains" || (!first.lowQuality && first.verdict === "traces")) return first;

    // 2ª leitura com segmentação automática; fica com a que encontrou leite ou leu melhor
    pass = 1;
    const second = await read(PSM.AUTO);
    const rank = (r: LocalScanResult) =>
      (r.verdict === "contains" ? 2000 : r.verdict === "traces" ? 1000 : 0) + (r.lowQuality ? 0 : 500) + r.confidence;
    return rank(second) > rank(first) ? second : first;
  } finally {
    await worker.terminate();
  }
};

/** n8n primeiro; se não estiver configurado ou falhar, leitura local. Lança erro só se as duas falharem. */
export const analyzeLabel = async (image: Blob, onProgress?: (p: number) => void): Promise<ScanOutcome> => {
  if (isAiConfigured()) {
    try {
      return { source: "ai", result: await analyzeWithAi(image) };
    } catch (err) {
      console.warn("Análise por IA indisponível, usando leitura local:", err);
    }
  }
  return { source: "local", result: await analyzeLocally(image, onProgress) };
};
