import { supabase } from "@/integrations/supabase/client";

/** Mensagens enviadas pelo botão de ajuda (Suporte, Sugestão, Feedback) — só administradores. */

export type MessageKind = "suporte" | "sugestao" | "feedback";
export type MessageStatus = "novo" | "em_andamento" | "resolvido";

export type AdminMessage = {
  id: string;
  /** Tabela de origem (necessária para atualizar o status) */
  source: "suggestions" | "feedback";
  kind: MessageKind;
  content: string;
  status: MessageStatus;
  created_at: string;
  status_updated_at: string | null;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
};

export const KIND_LABELS: Record<MessageKind, string> = {
  suporte: "Suporte",
  sugestao: "Sugestão",
  feedback: "Feedback",
};

export const STATUS_LABELS: Record<MessageStatus, string> = {
  novo: "Nova",
  em_andamento: "Em andamento",
  resolvido: "Resolvida",
};

/** O banco ainda não recebeu o script supabase/manual/2026-11-12_mensagens_admin.sql */
export class AdminSetupMissingError extends Error {}
/** O usuário logado não é administrador */
export class AdminForbiddenError extends Error {}

const fail = (error: { code?: string; message: string }): never => {
  if (error.code === "PGRST202" || error.code === "42883" || error.code === "42703" || error.code === "PGRST204")
    throw new AdminSetupMissingError(error.message);
  if (error.code === "42501") throw new AdminForbiddenError(error.message);
  throw new Error(error.message);
};

/** Todas as mensagens, mais recentes primeiro (até 1000), com nome e e-mail de quem enviou. */
export const listAdminMessages = async (): Promise<AdminMessage[]> => {
  const { data, error } = await (supabase.rpc as unknown as (fn: string) => Promise<{ data: unknown; error: { code?: string; message: string } | null }>)(
    "admin_list_messages",
  );
  if (error) fail(error);
  return (data as AdminMessage[]) ?? [];
};

export const updateMessageStatus = async (msg: Pick<AdminMessage, "id" | "source">, status: MessageStatus) => {
  const { error } = await supabase
    .from(msg.source)
    .update({ status, status_updated_at: new Date().toISOString() } as never)
    .eq("id", msg.id);
  if (error) fail(error);
};
