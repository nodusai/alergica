/** Partículas que não contam como nome ("Maria de Souza" → 2 nomes: Maria, Souza) */
const PARTICLES = new Set(["de", "da", "do", "das", "dos", "e", "di", "del", "van", "von"]);

const capitalize = (w: string) => w.charAt(0).toLocaleUpperCase("pt-BR") + w.slice(1).toLocaleLowerCase("pt-BR");

/**
 * Os dois primeiros nomes, com as partículas entre eles e capitalização corrigida.
 * "CAROLINE LIMA MARQUES" → "Caroline Lima" · "maria de souza santos" → "Maria de Souza"
 */
export const shortName = (fullName: string | null | undefined): string => {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let names = 0;
  for (const w of words) {
    const lower = w.toLocaleLowerCase("pt-BR");
    if (PARTICLES.has(lower)) {
      if (names > 0) out.push(lower);
      continue;
    }
    out.push(capitalize(w));
    if (++names === 2) break;
  }
  // Não termina com partícula solta ("Maria de")
  while (out.length && PARTICLES.has(out[out.length - 1])) out.pop();
  return out.join(" ");
};

/** Iniciais para o avatar: "Caroline Lima" → "CL" */
export const initials = (name: string): string =>
  name
    .split(" ")
    .filter((w) => !PARTICLES.has(w.toLocaleLowerCase("pt-BR")))
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase("pt-BR"))
    .join("");

/** Nome de exibição a partir do e-mail quando não há nome: "carol.lima@x.com" → "Carol Lima" */
export const nameFromEmail = (email: string | null | undefined): string =>
  shortName((email ?? "").split("@")[0].replace(/[._-]+/g, " ").replace(/\d+/g, " "));

/**
 * Nome curto do usuário, na ordem: nome do perfil → nome do cadastro (metadados) → e-mail.
 * Use em todas as telas para que o nome seja sempre o mesmo.
 */
export const displayName = (
  profileName: string | null | undefined,
  user: { email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined,
): string =>
  shortName(profileName) ||
  shortName(user?.user_metadata?.full_name as string | undefined) ||
  nameFromEmail(user?.email);

/** Só o primeiro nome (saudações) */
export const firstName = (name: string): string => name.split(" ")[0] ?? "";
