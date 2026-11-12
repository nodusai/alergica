#!/usr/bin/env node
/**
 * Sincroniza as bulas em PDF com o Supabase Storage (bucket "bulas").
 *
 * Para cada PDF: calcula o SHA-256. Se for igual à versão guardada, não faz nada.
 * Se for diferente, envia como `<id>/<sha256>.pdf`, registra em bula_versoes e
 * marca o remédio para nova análise (bula_reanalisar = true) — o app passa a
 * mostrar "Atenção" até a análise ser conferida.
 *
 * Uso (na raiz do projeto):
 *   npm run bulas:sync -- --dir <pasta>       PDFs nomeados <medication_id>.pdf
 *   npm run bulas:sync -- --from-urls         copia o PDF de arquivo_url dos remédios
 *                                             que ainda não têm cópia (versão já analisada)
 *   Opções: --dry-run (só mostra o que faria)  --limit <n>  --delay <ms> (padrão 1500)
 *
 * Precisa de SUPABASE_SERVICE_ROLE_KEY no ambiente (painel do Supabase → Settings → API).
 * NUNCA coloque essa chave no código, no .env versionado ou no frontend.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(name);

const DIR = opt("--dir");
const FROM_URLS = has("--from-urls");
const DRY = has("--dry-run");
const LIMIT = Number(opt("--limit") ?? Infinity);
const DELAY = Number(opt("--delay") ?? 1500);
const BUCKET = "bulas";
const MAX_BYTES = 20 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || (!DIR && !FROM_URLS)) {
  console.error(
    "Uso: SUPABASE_SERVICE_ROLE_KEY=... npm run bulas:sync -- (--dir <pasta> | --from-urls) [--dry-run] [--limit n] [--delay ms]",
  );
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const isPdf = (buf) => buf.subarray(0, 4).toString("latin1") === "%PDF";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stats = { iguais: 0, novas: 0, atualizadas: 0, falhas: 0 };

/**
 * Guarda uma versão. `original = true` quando o PDF é o mesmo documento já analisado
 * (cópia do arquivo_url): não exige nova análise.
 */
const store = async (med, buf, origem, original) => {
  if (!isPdf(buf)) throw new Error("não é PDF (o link pode ter expirado ou ter sido bloqueado)");
  if (buf.length > MAX_BYTES) throw new Error("PDF maior que 20 MB");
  const sha = sha256(buf);
  if (med.bula_sha256 === sha) {
    stats.iguais++;
    return "igual";
  }
  const path = `${med.id}/${sha}.pdf`;
  const tipo = med.bula_sha256 ? "atualizada" : "nova";
  if (DRY) {
    stats[tipo === "nova" ? "novas" : "atualizadas"]++;
    return `${tipo} (simulação)`;
  }
  const up = await db.storage.from(BUCKET).upload(path, buf, { contentType: "application/pdf", upsert: true, cacheControl: "31536000" });
  if (up.error) throw new Error(`upload: ${up.error.message}`);
  const upd = await db
    .from("medications")
    .update({
      bula_path: path,
      bula_sha256: sha,
      bula_atualizada_em: new Date().toISOString(),
      bula_origem: origem,
      bula_reanalisar: !original,
    })
    .eq("id", med.id);
  if (upd.error) throw new Error(`banco: ${upd.error.message}`);
  await db.from("bula_versoes").insert({ medication_id: med.id, bula_path: path, bula_sha256: sha, origem });
  stats[tipo === "nova" ? "novas" : "atualizadas"]++;
  return tipo + (original ? "" : " → marcada para nova análise");
};

const loadMeds = async (ids) => {
  const out = [];
  const cols = "id, nome_principal, arquivo_url, bula_sha256";
  if (ids) {
    for (let i = 0; i < ids.length; i += 200) {
      const { data, error } = await db.from("medications").select(cols).in("id", ids.slice(i, i + 200));
      if (error) throw error;
      out.push(...data);
    }
    return out;
  }
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("medications").select(cols).is("bula_path", null).not("arquivo_url", "is", null).range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
};

const run = async () => {
  if (DIR) {
    const files = (await readdir(DIR)).filter((f) => extname(f).toLowerCase() === ".pdf");
    const byId = new Map(files.map((f) => [basename(f, extname(f)), f]).filter(([id]) => UUID.test(id)));
    const ignored = files.length - byId.size;
    if (ignored) console.warn(`${ignored} arquivo(s) ignorado(s): o nome deve ser <medication_id>.pdf`);
    const meds = await loadMeds([...byId.keys()]);
    const found = new Set(meds.map((m) => m.id));
    for (const id of byId.keys()) if (!found.has(id)) console.warn(`✗ ${byId.get(id)}: remédio não encontrado`);
    for (const med of meds.slice(0, LIMIT)) {
      try {
        const r = await store(med, await readFile(join(DIR, byId.get(med.id))), "script", false);
        console.log(`✓ ${med.nome_principal}: ${r}`);
      } catch (e) {
        stats.falhas++;
        console.error(`✗ ${med.nome_principal}: ${e.message}`);
      }
    }
  }

  if (FROM_URLS) {
    const meds = (await loadMeds()).slice(0, LIMIT);
    console.log(`${meds.length} remédio(s) com link e sem cópia guardada.`);
    for (const med of meds) {
      try {
        const res = await fetch(med.arquivo_url, { signal: AbortSignal.timeout(30000), redirect: "follow" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const r = await store(med, Buffer.from(await res.arrayBuffer()), "original", true);
        console.log(`✓ ${med.nome_principal}: ${r}`);
      } catch (e) {
        stats.falhas++;
        console.error(`✗ ${med.nome_principal}: ${e.message}`);
      }
      await sleep(DELAY); // educado com o servidor de origem
    }
  }

  console.log(
    `\nResumo${DRY ? " (simulação)" : ""}: ${stats.novas} nova(s), ${stats.atualizadas} atualizada(s), ` +
      `${stats.iguais} sem mudança, ${stats.falhas} falha(s).`,
  );
  if (stats.atualizadas && !DRY) console.log("Remédios com bula atualizada ficam em Atenção até a análise ser conferida.");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
