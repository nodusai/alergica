/**
 * Direitos do titular (LGPD, art. 18): registro de consentimento, acesso/portabilidade e eliminação.
 */
import { supabase } from "@/integrations/supabase/client";
import { LEGAL, type ConsentType } from "@/config/legal";

export type ConsentRecord = {
  type: ConsentType;
  version: string;
  granted: boolean;
  at: string;
};

/** Consentimentos dados no cadastro, no formato salvo nos metadados do usuário (auth). */
export const buildSignupConsents = (): ConsentRecord[] => {
  const at = new Date().toISOString();
  return [
    { type: "termos_uso", version: LEGAL.termsVersion, granted: true, at },
    { type: "politica_privacidade", version: LEGAL.privacyVersion, granted: true, at },
    // Consentimento específico e destacado para dados de saúde (art. 11, I) — inclui dados de crianças (art. 14, §1º)
    { type: "dados_saude", version: LEGAL.privacyVersion, granted: true, at },
  ];
};

// A tabela user_consents é criada pela migração 20261112000000_lgpd_consents.sql
// e ainda não está nos tipos gerados; por isso o acesso sem tipagem.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untyped = supabase as any;

/**
 * Grava os consentimentos no histórico (tabela user_consents).
 * O registro principal fica nos metadados do usuário (feito no cadastro); este é o log de auditoria.
 * Falhas não bloqueiam o fluxo.
 */
export const logConsents = async (userId: string, consents: ConsentRecord[]) => {
  const { error } = await untyped.from("user_consents").insert(
    consents.map((c) => ({
      user_id: userId,
      consent_type: c.type,
      version: c.version,
      granted: c.granted,
      created_at: c.at,
    })),
  );
  if (error) console.error("Não foi possível registrar o histórico de consentimento:", error.message);
};

/** Consentimentos registrados nos metadados do usuário logado. */
export const getMyConsents = async (): Promise<ConsentRecord[]> => {
  const { data } = await supabase.auth.getUser();
  const raw = data.user?.user_metadata?.lgpd_consents;
  return Array.isArray(raw) ? (raw as ConsentRecord[]) : [];
};

/** Junta todos os dados pessoais do usuário em um objeto (acesso e portabilidade — art. 18, II e V). */
export const exportMyData = async () => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");

  const own = async (table: string) => {
    const { data, error } = await untyped.from(table).select("*").eq("user_id", user.id);
    return error ? { erro: "não foi possível ler esta tabela" } : data;
  };

  const [perfil, bebes, sugestoes, feedback, onboarding, consentimentos] = await Promise.all([
    own("profiles"),
    own("babies"),
    own("suggestions"),
    own("feedback"),
    own("user_onboarding"),
    own("user_consents"),
  ]);

  return {
    gerado_em: new Date().toISOString(),
    controlador: LEGAL.controllerName,
    conta: {
      id: user.id,
      email: user.email,
      criada_em: user.created_at,
      ultimo_login: user.last_sign_in_at,
      metadados: user.user_metadata,
    },
    perfil,
    bebes,
    sugestoes_e_suporte: sugestoes,
    feedback,
    onboarding,
    historico_de_consentimentos: consentimentos,
    armazenado_no_navegador: {
      descricao: "Sessão de login e cache de traduções de estudos ficam apenas neste aparelho (localStorage).",
    },
  };
};

/** Baixa os dados do usuário como arquivo JSON. */
export const downloadMyData = async () => {
  const payload = await exportMyData();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meus-dados-alergica-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** Exclui a conta e todos os dados pessoais (art. 18, VI) pela Edge Function delete-account. */
export const deleteMyAccount = async () => {
  const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? "Não foi possível excluir a conta.");
  await supabase.auth.signOut();
};
