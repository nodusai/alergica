import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getAllergySelection } from "@/services/profile";
import { buildUserAllergies, effectiveAllergies, EMPTY_SELECTION, type UserAllergies } from "@/lib/allergens";

export const USER_ALLERGIES_KEY = "user-allergies";

/**
 * Alergias do perfil. `effective` é o que as análises usam: sem nenhuma alergia
 * cadastrada, verifica leite (APLV), o foco do app. `personalized` indica que o
 * usuário informou alergias (os textos deixam de falar só em leite).
 */
export const useUserAllergies = () => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: [USER_ALLERGIES_KEY, user?.id],
    queryFn: () => getAllergySelection(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const selection = query.data ?? EMPTY_SELECTION;
  const profile: UserAllergies = buildUserAllergies(selection);
  return {
    selection,
    profile,
    effective: effectiveAllergies(profile),
    personalized: !profile.empty,
    /** Ainda carregando: não mostrar classificação personalizada antes da hora */
    loading: !!user && query.isLoading,
  };
};
