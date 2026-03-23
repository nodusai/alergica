import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSessionRecoveryError = (message?: string) => {
  const normalizedMessage = message?.toLowerCase() ?? "";

  return [
    "invalid refresh token",
    "refresh token not found",
    "jwt expired",
    "session not found",
  ].some((term) => normalizedMessage.includes(term));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const clearSessionState = () => {
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  };

  const applySessionState = (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession) {
      setIsAdmin(false);
    }
  };

  const clearLocalSession = async () => {
    await supabase.auth.signOut({ scope: "local" });
    clearSessionState();
  };

  useEffect(() => {
    let isMounted = true;

    const syncSession = (nextSession: Session | null) => {
      if (!isMounted) return;

      applySessionState(nextSession);
      setLoading(false);
    };

    const recoverInvalidSession = async () => {
      await clearLocalSession();

      if (!isMounted) return;
      setLoading(false);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        syncSession(nextSession);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error && isSessionRecoveryError(error.message)) {
        await recoverInvalidSession();
        return;
      }

      syncSession(session);
    }).catch(async () => {
      await recoverInvalidSession();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        if (!error) {
          setIsAdmin(data);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminRole();
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string) => {
    // const redirectUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // emailRedirectTo: redirectUrl, // Desabilitado: login automático após cadastro
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error && !isSessionRecoveryError(error.message)) {
      throw error;
    }

    if (error) {
      await clearLocalSession();
      return;
    }

    clearSessionState();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
