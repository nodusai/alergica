import { supabase } from "@/integrations/supabase/client";

export type ProfileSummary = {
  full_name: string | null;
  profile_type: string | null;
  gender: string | null;
};

/** Dados mínimos do perfil para o menu lateral. */
export const getProfileSummary = async (userId: string): Promise<ProfileSummary | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, profile_type, gender" as "full_name, profile_type")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileSummary | null) ?? null;
};
