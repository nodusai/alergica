import { supabase } from "@/integrations/supabase/client";

/** Envia o e-mail de redefinição de senha. O link leva para /redefinir-senha. */
export const requestPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  });
  if (error) throw error;
};

/** Define a nova senha do usuário (usado na sessão de recuperação aberta pelo link do e-mail). */
export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};
