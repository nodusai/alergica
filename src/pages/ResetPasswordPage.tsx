import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { updatePassword } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const inputCls =
  "w-full h-12 rounded-xl border-2 border-input bg-card pl-11 pr-12 text-[15px] placeholder:text-muted-foreground/60 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";

/** Página aberta pelo link de "Esqueci minha senha" enviado por e-mail. */
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // O link do e-mail abre uma sessão de recuperação (evento PASSWORD_RECOVERY)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setTimeout(() => setChecked(true), 1500);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("A senha precisa ter no mínimo 8 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");
    setError("");
    setSaving(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch {
      toast({ variant: "destructive", title: "Não foi possível salvar", description: "Peça um novo link e tente de novo." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-[420px] animate-fade-in">
        <p className="text-xl font-extrabold tracking-[-0.02em] text-foreground mb-8 text-center">
          Aler<span className="text-[hsl(152_55%_38%)] dark:text-primary">Gica</span>
        </p>

        {done ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-safe mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-foreground">Senha alterada</h1>
            <p className="text-muted-foreground mt-2">Pronto! Sua nova senha já está valendo.</p>
            <button onClick={() => navigate("/dashboard")} className="btn-primary w-full h-12 py-0 mt-8">
              Ir para o AlerGica
            </button>
          </div>
        ) : !ready && checked ? (
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-foreground">Link inválido ou expirado</h1>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              Peça um novo link em “Esqueci minha senha”, na tela de login.
            </p>
            <Link to="/" className={`btn-primary inline-flex items-center justify-center w-full h-12 py-0 mt-8`}>
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <header>
              <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-foreground">Crie uma nova senha</h1>
              <p className="text-muted-foreground mt-1.5">Use no mínimo 8 caracteres.</p>
            </header>
            {[
              { id: "nova-senha", label: "Nova senha", value: password, set: setPassword },
              { id: "confirmar-senha", label: "Confirmar nova senha", value: confirm, set: setConfirm },
            ].map((f, i) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-semibold text-foreground mb-1.5">
                  {f.label}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" />
                  <input
                    id={f.id}
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className={inputCls}
                  />
                  {i === 0 && (
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-transform ${focusRing}`}
                    >
                      {show ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={saving || !ready} className="btn-primary w-full h-12 py-0 disabled:opacity-60">
              {saving ? "Salvando..." : ready ? "Salvar nova senha" : "Validando link..."}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
