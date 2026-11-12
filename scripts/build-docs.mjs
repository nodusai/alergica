/**
 * build-docs.mjs — gera os PDFs da documentação do AlerGica.
 *
 * Uso:  npm run docs:pdf
 *
 * Lê cada docs/NN-*.md (com front-matter), converte para HTML com capa,
 * sumário e diagramas Mermaid, e imprime em PDF com o Chrome/Edge headless.
 * Saída: docs/pdf/<nome>.pdf  (HTML intermediário em docs/pdf/.build/, ignorado no git)
 *
 * Navegador: usa CHROME_PATH se definido; senão procura Chrome ou Edge nos caminhos padrão.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = join(ROOT, "docs");
const OUT = join(DOCS, "pdf");
const BUILD = join(OUT, ".build");
const CSS = readFileSync(join(DOCS, "assets", "doc.css"), "utf8");
const MASCOT = join(ROOT, "src", "assets", "mascot.png");
const MERMAID = join(ROOT, "node_modules", "mermaid", "dist", "mermaid.min.js");

// ---------------------------------------------------------------------------
// Navegador
// ---------------------------------------------------------------------------
const findBrowser = () => {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    console.error("Chrome/Edge não encontrado. Defina CHROME_PATH com o caminho do executável.");
    process.exit(1);
  }
  return found;
};

// ---------------------------------------------------------------------------
// Markdown → HTML
// ---------------------------------------------------------------------------
const parseFrontMatter = (src) => {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return { meta: {}, body: src };
  const meta = Object.fromEntries(
    m[1]
      .split(/\r?\n/)
      .map((l) => l.match(/^(\w+):\s*(.*)$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, "")]),
  );
  return { meta, body: src.slice(m[0].length) };
};

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const render = (body) => {
  const toc = [];
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const id = slugify(text);
    if (depth === 2 || depth === 3) toc.push({ depth, text, id });
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };
  renderer.code = ({ text, lang }) =>
    lang === "mermaid"
      ? `<figure class="diagram"><pre class="mermaid">${escapeHtml(text)}</pre></figure>\n`
      : `<pre class="code"><code>${escapeHtml(text)}</code></pre>\n`;
  renderer.table = function (token) {
    const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join("");
    const rows = token.rows
      .map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
  };
  // Blocos "> **Nota:**", "> **Atenção:**" viram caixas de destaque
  renderer.blockquote = function ({ tokens }) {
    const inner = this.parser.parse(tokens);
    const kind = /<strong>(Atenção|Importante|Aviso)/i.test(inner)
      ? "warn"
      : /<strong>(Dica|Nota)/i.test(inner)
        ? "note"
        : "quote";
    return `<aside class="callout callout-${kind}">${inner}</aside>\n`;
  };
  const html = marked.parse(body, { renderer, gfm: true });
  return { html, toc };
};

const page = ({ meta, html, toc, file }) => {
  const tocHtml = toc
    .map((t) => `<li class="toc-l${t.depth}"><a href="#${t.id}">${t.text}</a></li>`)
    .join("");
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${meta.titulo ?? file}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Nunito+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>${CSS}
@page { @bottom-left { content: "AlerGica · ${(meta.titulo ?? "").replace(/"/g, "")}"; } }
</style>
</head>
<body class="${meta.layout ?? ''}">
<section class="cover">
  <div class="cover-glow"></div>
  <div class="cover-top">
    <span class="brand">Aler<b>Gica</b></span>
    <span class="doc-kind">${meta.categoria ?? "Documentação"}</span>
  </div>
  <div class="cover-main">
    <img class="mascot" src="${pathToFileURL(MASCOT)}" alt="">
    <h1 class="cover-title">${meta.titulo ?? ""}</h1>
    <p class="cover-sub">${meta.subtitulo ?? ""}</p>
  </div>
  <dl class="cover-meta">
    <div><dt>Versão</dt><dd>${meta.versao ?? "—"}</dd></div>
    <div><dt>Atualizado em</dt><dd>${meta.atualizado ?? today}</dd></div>
    <div><dt>Público</dt><dd>${meta.publico ?? "—"}</dd></div>
    <div><dt>Classificação</dt><dd>${meta.classificacao ?? "Confidencial"}</dd></div>
  </dl>
</section>
<nav class="toc">
  <h2 class="toc-title">Sumário</h2>
  <ol>${tocHtml}</ol>
</nav>
<main class="content">
${html}
</main>
<script src="${pathToFileURL(MERMAID)}"></script>
<script>
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    fontFamily: "Nunito Sans, Segoe UI, sans-serif",
    themeVariables: {
      primaryColor: "#E3F8EE",
      primaryBorderColor: "#2E9E6B",
      primaryTextColor: "#16352A",
      lineColor: "#4E7A68",
      secondaryColor: "#FFF6E0",
      tertiaryColor: "#F4FAF7",
      fontSize: "16px"
    },
    flowchart: { curve: "basis", htmlLabels: true },
    sequence: { mirrorActors: false }
  });
  mermaid.run({ querySelector: ".mermaid" }).finally(() => { document.body.dataset.ready = "1"; });
</script>
</body>
</html>`;
};

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
mkdirSync(BUILD, { recursive: true });
const browser = findBrowser();
const sources = readdirSync(DOCS).filter((f) => /^\d{2}-.+\.md$/.test(f)).sort();

for (const file of sources) {
  const { meta, body } = parseFrontMatter(readFileSync(join(DOCS, file), "utf8"));
  const { html, toc } = render(body);
  const name = file.replace(/\.md$/, "");
  const htmlPath = join(BUILD, `${name}.html`);
  const pdfPath = join(OUT, `${name}.pdf`);
  writeFileSync(htmlPath, page({ meta, html, toc, file }));

  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--allow-file-access-from-files",
      "--virtual-time-budget=20000",
      "--run-all-compositor-stages-before-draw",
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "ignore" },
  );

  const kb = Math.round(statSync(pdfPath).size / 1024);
  console.log(`✔ ${relative(ROOT, pdfPath)} (${kb} KB)`);
}
