import { supabase } from "@/integrations/supabase/client";
import { activeKeysOf, type MedicationDetail } from "@/services/medications";
import type { CatalogEntry } from "@/lib/bulaMatch";

/**
 * Bulas guardadas pelo AlerGica no Supabase Storage (bucket público "bulas").
 * Caminho: `<medication_id>/<sha256>.pdf` — o nome muda quando o conteúdo muda,
 * então links antigos nunca mostram uma versão diferente da registrada.
 */
export const BULA_BUCKET = "bulas";
export const MAX_BULA_BYTES = 20 * 1024 * 1024;

export const bulaPublicUrl = (path: string) => supabase.storage.from(BULA_BUCKET).getPublicUrl(path).data.publicUrl;

/**
 * SHA-256 em JavaScript puro. Usado quando `crypto.subtle` não existe — o navegador só o
 * oferece em conexão segura (https ou localhost); abrindo o app pelo IP da rede ele some.
 */
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
  0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
  0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

export const sha256Js = (data: Uint8Array): string => {
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const bitLen = data.length * 8;
  const padded = new Uint8Array(((data.length + 9 + 63) >> 6) << 6);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 2 ** 32));
  view.setUint32(padded.length - 4, bitLen >>> 0);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    h[0] += a;
    h[1] += b;
    h[2] += c;
    h[3] += d;
    h[4] += e;
    h[5] += f;
    h[6] += g;
    h[7] += hh;
  }
  return [...h].map((x) => x.toString(16).padStart(8, "0")).join("");
};

export const sha256Hex = async (file: Blob) => {
  const buf = await file.arrayBuffer();
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return sha256Js(new Uint8Array(buf));
};

/** O arquivo começa com "%PDF" (não confia só na extensão) */
export const looksLikePdf = async (file: Blob) => new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()).startsWith("%PDF");

export type BulaUploadResult = "primeira" | "atualizada" | "igual";

export class BulaSetupMissingError extends Error {}

/**
 * Envia uma nova versão da bula (administrador). Se o conteúdo for idêntico ao atual,
 * nada muda ("igual"). Caso contrário, registra a versão e marca para nova análise.
 */
export const uploadBula = async (medicationId: string, file: File): Promise<BulaUploadResult> => {
  if (file.size > MAX_BULA_BYTES) throw new Error("O PDF passa de 20 MB.");
  if (!(await looksLikePdf(file))) throw new Error("O arquivo não é um PDF.");

  const sha = await sha256Hex(file);
  const path = `${medicationId}/${sha}.pdf`;
  const { error: upErr } = await supabase.storage
    .from(BULA_BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: false, cacheControl: "31536000" });
  // "já existe" é normal: mesmo conteúdo enviado de novo
  if (upErr && !/exist|duplicate/i.test(upErr.message)) {
    if (/bucket not found/i.test(upErr.message)) throw new BulaSetupMissingError(upErr.message);
    throw upErr;
  }

  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { code?: string; message: string } | null }>)("admin_set_bula", {
    _med_id: medicationId,
    _path: path,
    _sha256: sha,
    _origem: "admin",
  });
  if (error) {
    if (error.code === "PGRST202" || error.code === "42883") throw new BulaSetupMissingError(error.message);
    throw new Error(error.message);
  }
  return data as BulaUploadResult;
};

/** A análise da bula nova foi conferida: o remédio volta à classificação normal */
export const markBulaAnalyzed = async (medicationId: string) => {
  const { error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>)("admin_mark_bula_analisada", { _med_id: medicationId });
  if (error) throw new Error(error.message);
};

/**
 * Catálogo para identificar bulas (administrador): nome, laboratório, princípios ativos
 * e o hash da bula já guardada. Se o banco ainda não tiver as colunas de bula, segue sem o hash.
 */
export const getBulaCatalog = async (): Promise<CatalogEntry[]> => {
  const load = async (cols: string) => {
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("medications")
        .select(cols as "id")
        .order("nome_principal", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + 999);
      if (error) return { rows, error };
      rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
      if (!data || data.length < 1000) break;
    }
    return { rows, error: null };
  };
  const base = "id, nome_principal, nome_alternativo, composicao";
  let r = await load(`${base}, bula_sha256`);
  if (r.error && (r.error.code === "42703" || r.error.code === "PGRST204")) r = await load(base);
  if (r.error) throw r.error;
  return r.rows.map((m) => ({
    id: String(m.id),
    nome_principal: String(m.nome_principal ?? ""),
    nome_alternativo: (m.nome_alternativo as string | null) ?? null,
    actives: activeKeysOf(m as unknown as MedicationDetail),
    bula_sha256: (m.bula_sha256 as string | null | undefined) ?? null,
  }));
};
