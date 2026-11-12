import { supabase } from "@/integrations/supabase/client";

/**
 * Bulas guardadas pelo AlerGica no Supabase Storage (bucket público "bulas").
 * Caminho: `<medication_id>/<sha256>.pdf` — o nome muda quando o conteúdo muda,
 * então links antigos nunca mostram uma versão diferente da registrada.
 */
export const BULA_BUCKET = "bulas";
export const MAX_BULA_BYTES = 20 * 1024 * 1024;

export const bulaPublicUrl = (path: string) => supabase.storage.from(BULA_BUCKET).getPublicUrl(path).data.publicUrl;

const sha256Hex = async (file: Blob) => {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

/** O arquivo começa com "%PDF" (não confia só na extensão) */
const looksLikePdf = async (file: Blob) => new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()).startsWith("%PDF");

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
