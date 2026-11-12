// Exclusão da conta e dos dados pessoais a pedido do titular (LGPD, art. 18, VI).
// Só o próprio usuário autenticado pode excluir a própria conta.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tabelas com dados do usuário (coluna user_id). Algumas não têm chave estrangeira com
// ON DELETE CASCADE, por isso são apagadas explicitamente antes do usuário.
const USER_TABLES = [
  "babies",
  "suggestions",
  "feedback",
  "solicitado_inclusao",
  "user_consents",
  "user_onboarding",
  "user_roles",
  "profiles",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    const { data: caller, error: callerError } = token ? await admin.auth.getUser(token) : { data: null, error: true };
    if (callerError || !caller?.user) return json({ success: false, error: "Unauthorized" }, 401);

    const userId = caller.user.id;
    const failures: string[] = [];
    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      // Tabela inexistente neste ambiente não impede a exclusão
      if (error && error.code !== "42P01" && error.code !== "PGRST205") failures.push(`${table}: ${error.message}`);
    }
    if (failures.length) {
      console.error("delete-account: falha ao apagar dados", userId, failures);
      return json({ success: false, error: "Não foi possível apagar todos os dados. Tente novamente." }, 500);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("delete-account: falha ao excluir usuário", userId, deleteError.message);
      return json({ success: false, error: "Não foi possível excluir a conta. Tente novamente." }, 500);
    }

    console.log("delete-account: conta excluída", userId);
    return json({ success: true });
  } catch (err) {
    console.error("delete-account: erro inesperado", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
