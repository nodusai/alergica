import { useState, useEffect, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MailCheck,
  MapPin,
  Pill,
  ScanLine,
  ShieldCheck,
  User,
} from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { requestPasswordReset } from "@/services/auth";
import { buildSignupConsents, logConsents } from "@/services/privacy";
import mascotImage from "@/assets/mascot.png";

// ─── Opções ──────────────────────────────────────────────────────────────────
const PROFILE_TYPES = [
  { value: "mae", label: "Mãe" },
  { value: "pai", label: "Pai" },
  { value: "alergica", label: "Sou a pessoa alérgica" },
  { value: "farmaceutico", label: "Farmacêutico(a)" },
  { value: "medico", label: "Médico(a)" },
];

const GENDER_OPTIONS = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "nao_binario", label: "Não-binário" },
  { value: "prefiro_nao_dizer", label: "Prefiro não informar" },
];

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const FEATURES = [
  { icon: ShieldCheck, title: "Análise das bulas oficiais", text: "Verde, amarelo ou vermelho: saiba na hora se o remédio tem leite." },
  { icon: Pill, title: "Alternativas sem leite", text: "Outros fabricantes com o mesmo princípio ativo, quando houver." },
  { icon: ScanLine, title: "Rótulos por foto", text: "Fotografe os ingredientes de um alimento e receba a análise." },
];

// ─── Validação ───────────────────────────────────────────────────────────────
const emailSchema = z.string().trim().email({ message: "Informe um e-mail válido" });
const passwordSchema = z.string().min(8, { message: "A senha precisa ter no mínimo 8 caracteres" });
const nameSchema = z.string().trim().min(2, { message: "Informe seu nome completo" });

/** Idade em anos completos a partir de "AAAA-MM-DD" */
const ageFrom = (iso: string) => {
  const birth = new Date(`${iso}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

// ─── Estilos compartilhados ──────────────────────────────────────────────────
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const inputBase =
  "w-full h-12 rounded-xl border-2 bg-card text-[15px] text-foreground placeholder:text-muted-foreground/60 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";
const inputBorder = (hasError: boolean) => (hasError ? "border-destructive" : "border-input");
const linkCls = `font-semibold text-[hsl(152_55%_32%)] dark:text-primary underline-offset-4 hover:underline rounded ${focusRing}`;

type Mode = "login" | "cadastro" | "recuperar";

// ─── Componentes auxiliares ──────────────────────────────────────────────────
const Field = ({
  id,
  label,
  optional,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) => (
  <div>
    <label htmlFor={id} className="flex items-baseline justify-between text-sm font-semibold text-foreground mb-1.5">
      {label}
      {optional && <span className="text-xs font-medium text-muted-foreground">opcional</span>}
    </label>
    {children}
    {error ? (
      <p id={`${id}-erro`} className="text-[13px] text-destructive mt-1.5">
        {error}
      </p>
    ) : (
      hint && <p className="text-[13px] text-muted-foreground mt-1.5">{hint}</p>
    )}
  </div>
);

const IconInput = ({
  id,
  icon: Icon,
  error,
  trailing,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  icon: React.ElementType;
  error?: string;
  trailing?: ReactNode;
}) => (
  <div className="relative">
    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground pointer-events-none" />
    <input
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-erro` : undefined}
      className={`${inputBase} ${inputBorder(!!error)} pl-11 ${trailing ? "pr-12" : "pr-4"}`}
      {...props}
    />
    {trailing}
  </div>
);

const PasswordToggle = ({ shown, onToggle }: { shown: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={shown ? "Ocultar senha" : "Mostrar senha"}
    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-transform ${focusRing}`}
  >
    {shown ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
  </button>
);

const SectionTitle = ({ step, children }: { step: string; children: ReactNode }) => (
  <div className="flex items-center gap-2.5 pt-2">
    <span className="w-6 h-6 rounded-full bg-primary/20 text-[11px] font-extrabold text-foreground flex items-center justify-center">
      {step}
    </span>
    <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">{children}</h3>
  </div>
);

const ConsentCheckbox = ({
  id,
  checked,
  onChange,
  error,
  highlight,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: boolean;
  highlight?: boolean;
  children: ReactNode;
}) => (
  <label
    htmlFor={id}
    className={`group flex gap-3 rounded-2xl border-2 p-3.5 cursor-pointer transition-[border-color,background-color] duration-200 ${
      error
        ? "border-destructive/60 bg-destructive/5"
        : checked
          ? "border-primary/60 bg-primary/[0.07]"
          : highlight
            ? "border-caution/40 bg-caution/[0.07] hover:border-caution/70"
            : "border-border hover:border-primary/40"
    }`}
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="peer sr-only"
    />
    <span
      aria-hidden
      className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-transform duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 group-active:scale-90 ${
        checked ? "bg-primary border-primary" : "bg-card border-muted-foreground/40"
      }`}
    >
      <Check className={`w-3.5 h-3.5 text-primary-foreground ${checked ? "opacity-100" : "opacity-0"}`} strokeWidth={3} />
    </span>
    <span className="text-[13.5px] leading-relaxed text-foreground/90">{children}</span>
  </label>
);

// ─── Painel da marca ─────────────────────────────────────────────────────────
const BrandPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="relative z-10 w-full max-w-lg">
      <p className="text-2xl font-extrabold tracking-[-0.02em] text-foreground">
        Aler<span className="text-[hsl(152_55%_38%)] dark:text-primary">Gica</span>
      </p>

      <div className={`flex ${mobile ? "flex-col items-center text-center" : "items-end gap-6"} mt-10`}>
        <div className="relative shrink-0">
          <div className="absolute inset-4 bg-primary/30 rounded-full blur-3xl" aria-hidden />
          <img
            src={mascotImage}
            alt="Mascote do AlerGica: uma lupa sorridente com um escudo"
            className={`relative object-contain animate-float ${mobile ? "w-40 h-40" : "w-36 h-36 xl:w-44 xl:h-44"}`}
          />
        </div>
      </div>

      <h1
        className={`font-display font-bold text-foreground tracking-[-0.03em] leading-[1.05] mt-8 ${
          mobile ? "text-[2.1rem] text-center" : "text-[2.6rem] xl:text-[3.1rem]"
        }`}
      >
        Remédios e alimentos seguros para quem tem <span className="text-[hsl(152_55%_34%)] dark:text-primary">APLV</span>.
      </h1>
      <p className={`text-base xl:text-lg text-foreground/75 leading-[1.7] mt-4 ${mobile ? "text-center" : "max-w-md"}`}>
        Eu sou a AlerGica. Leio as bulas e os rótulos por você e mostro o que tem leite escondido — com menos sustos e
        mais segurança no dia a dia.
      </p>

      <ul className="mt-8 space-y-3">
        {FEATURES.map(({ icon: Icon, title, text }, i) => (
          <li
            key={title}
            className="flex gap-3.5 items-start rounded-2xl bg-card/70 backdrop-blur-sm border border-white/60 dark:border-border p-3.5 shadow-[0_1px_2px_hsl(160_40%_15%/0.05),0_8px_20px_-12px_hsl(160_40%_15%/0.25)] animate-fade-in"
            style={{ animationDelay: `${0.15 + i * 0.08}s`, animationFillMode: "both" }}
          >
            <span className="w-10 h-10 shrink-0 rounded-xl bg-primary/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[hsl(152_55%_30%)] dark:text-primary" />
            </span>
            <span>
              <span className="block text-[15px] font-bold text-foreground leading-snug">{title}</span>
              <span className="block text-sm text-muted-foreground leading-relaxed">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 flex items-center gap-2 text-[13px] text-foreground/70">
        <Lock className="w-4 h-4 shrink-0" />
        Seus dados são tratados conforme a LGPD e nunca são vendidos.
      </p>
    </div>
  );

const brandSurface =
    "relative overflow-hidden grain bg-[radial-gradient(80%_60%_at_0%_0%,hsl(152_76%_65%/0.45)_0%,transparent_60%),radial-gradient(70%_55%_at_100%_100%,hsl(160_60%_40%/0.22)_0%,transparent_65%),radial-gradient(45%_35%_at_90%_10%,hsl(40_95%_70%/0.30)_0%,transparent_70%)] bg-[hsl(140_40%_96%)] dark:bg-[hsl(160_30%_10%)]";


// ─── Página ──────────────────────────────────────────────────────────────────
const AuthPage = () => {
  // "/?modo=cadastro" abre direto no cadastro (útil para links de divulgação)
  const [searchParams] = useSearchParams();
  const initialMode: Mode = searchParams.get("modo") === "cadastro" ? "cadastro" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showWelcome, setShowWelcome] = useState(initialMode === "login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileType, setProfileType] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [profession, setProfession] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptHealth, setAcceptHealth] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setResetSentTo(null);
  };

  const clearError = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const r = emailSchema.safeParse(email);
    if (!r.success) next.email = r.error.errors[0].message;
    if (!password) next.password = "Informe sua senha";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      let description = error.message;
      if (error.message === "Invalid login credentials") description = "E-mail ou senha incorretos.";
      else if (error.message.toLowerCase().includes("email not confirmed"))
        description = "Confirme seu e-mail pelo link que enviamos antes de entrar.";
      toast({ variant: "destructive", title: "Não foi possível entrar", description });
      return;
    }
    navigate("/dashboard");
  };

  // ── Recuperar senha ──
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = emailSchema.safeParse(email);
    if (!r.success) {
      setErrors({ email: r.error.errors[0].message });
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setResetSentTo(email.trim());
    } catch {
      toast({ variant: "destructive", title: "Não foi possível enviar", description: "Tente novamente em instantes." });
    } finally {
      setLoading(false);
    }
  };

  // ── Cadastro ──
  const validateSignup = () => {
    const next: Record<string, string> = {};
    const n = nameSchema.safeParse(fullName);
    if (!n.success) next.fullName = n.error.errors[0].message;
    const em = emailSchema.safeParse(email);
    if (!em.success) next.email = em.error.errors[0].message;
    const pw = passwordSchema.safeParse(password);
    if (!pw.success) next.password = pw.error.errors[0].message;
    if (password !== confirmPassword) next.confirmPassword = "As senhas não coincidem";
    if (!profileType) next.profileType = "Escolha uma opção";
    if (!birthDate) next.birthDate = "Informe sua data de nascimento";
    else if (ageFrom(birthDate) < 18)
      next.birthDate = "A conta deve ser criada por um adulto. Menores de 18 anos podem usar com a conta de um responsável.";
    if (!acceptTerms) next.acceptTerms = "Para criar a conta, aceite os Termos e a Política de Privacidade";
    if (!acceptHealth) next.acceptHealth = "Esta autorização é necessária para o AlerGica funcionar";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    setLoading(true);
    const consents = buildSignupConsents();
    const { error } = await signUp(email.trim(), password, fullName.trim(), { lgpd_consents: consents });
    if (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Não foi possível criar a conta",
        description: error.message.includes("already registered")
          ? "Este e-mail já está cadastrado. Tente entrar."
          : error.message,
      });
      return;
    }

    const { error: loginError } = await signIn(email.trim(), password);
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await Promise.all([
        supabase.from("profiles").upsert(
          {
            user_id: userData.user.id,
            profile_type: profileType,
            birth_date: birthDate || null,
            gender: gender || null,
            city: city.trim() || null,
            state: uf || null,
            profession: profession.trim() || null,
          } as never,
          { onConflict: "user_id" },
        ),
        logConsents(userData.user.id, consents),
      ]);
    }
    setLoading(false);

    if (loginError) {
      toast({ variant: "destructive", title: "Conta criada", description: "Agora entre com seu e-mail e senha." });
      switchMode("login");
    } else {
      navigate("/dashboard");
    }
  };

  const titles: Record<Mode, { title: string; subtitle: string }> = {
    login: { title: "Que bom ter você aqui", subtitle: "Entre para consultar remédios e produtos com segurança." },
    cadastro: { title: "Crie sua conta", subtitle: "Leva menos de 2 minutos. Campos sem marcação são obrigatórios." },
    recuperar: { title: "Recuperar senha", subtitle: "Enviaremos um link para você criar uma nova senha." },
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-background">
      {/* Boas-vindas no celular */}
      {showWelcome && (
        <section className={`lg:hidden min-h-screen px-6 pt-10 pb-32 ${brandSurface}`}>
          <BrandPanel mobile />
          {/* Botão fixo no rodapé: sempre visível sem precisar rolar */}
          <div className="fixed inset-x-0 bottom-0 z-30 px-6 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[hsl(140_40%_96%)] via-[hsl(140_40%_96%/0.92)] to-transparent dark:from-[hsl(160_30%_10%)] dark:via-[hsl(160_30%_10%/0.92)]">
            <button onClick={() => setShowWelcome(false)} className="btn-primary w-full h-14 py-0 text-lg">
              Começar
            </button>
          </div>
        </section>
      )}

      {/* Painel da marca no desktop */}
      <aside className={`hidden lg:flex sticky top-0 h-screen items-center justify-center px-12 xl:px-20 ${brandSurface}`}>
        <div className="animate-fade-in">
          <BrandPanel />
        </div>
      </aside>

      {/* Formulários */}
      <main
        className={`${showWelcome ? "hidden lg:flex" : "flex"} min-h-screen flex-col items-center justify-center px-5 py-10 md:px-10`}
      >
        <div className="w-full max-w-[440px] animate-fade-in">
          {/* Topo no celular */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <button
              onClick={() => setShowWelcome(true)}
              aria-label="Voltar para a apresentação"
              className={`p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-transform ${focusRing}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <p className="text-xl font-extrabold tracking-[-0.02em] text-foreground">
              Aler<span className="text-[hsl(152_55%_38%)] dark:text-primary">Gica</span>
            </p>
            <span className="w-9" />
          </div>

          {mode !== "recuperar" && (
            <div role="tablist" aria-label="Entrar ou cadastrar" className="relative grid grid-cols-2 p-1 mb-8 rounded-2xl bg-secondary">
              <span
                aria-hidden
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-card shadow-[0_1px_2px_hsl(160_40%_15%/0.08),0_4px_12px_-4px_hsl(160_40%_15%/0.15)] transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
                  mode === "cadastro" ? "translate-x-full" : "translate-x-0"
                }`}
              />
              {(["login", "cadastro"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`relative z-10 h-11 rounded-xl text-sm font-bold transition-colors active:scale-[0.97] ${focusRing} ${
                    mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>
          )}

          <header className="mb-7">
            <h2 className="font-display text-[1.9rem] font-bold tracking-[-0.03em] leading-tight text-foreground">
              {titles[mode].title}
            </h2>
            <p className="text-[15px] text-muted-foreground mt-1.5 leading-relaxed">{titles[mode].subtitle}</p>
          </header>

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} noValidate className="space-y-5">
              <Field id="login-email" label="E-mail" error={errors.email}>
                <IconInput
                  id="login-email"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  error={errors.email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                />
              </Field>
              <Field id="login-senha" label="Senha" error={errors.password}>
                <IconInput
                  id="login-senha"
                  icon={Lock}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={password}
                  error={errors.password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
                  }}
                  trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
                />
              </Field>
              <div className="flex justify-end -mt-2">
                <button type="button" onClick={() => switchMode("recuperar")} className={`text-sm ${linkCls}`}>
                  Esqueci minha senha
                </button>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full h-12 py-0 disabled:opacity-60">
                {loading ? "Entrando..." : "Entrar"}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Ainda não tem conta?{" "}
                <button type="button" onClick={() => switchMode("cadastro")} className={linkCls}>
                  Cadastre-se grátis
                </button>
              </p>
            </form>
          )}

          {/* ── RECUPERAR SENHA ── */}
          {mode === "recuperar" &&
            (resetSentTo ? (
              <div className="rounded-3xl border border-primary/30 bg-primary/[0.07] p-6 text-center animate-fade-in">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/25 flex items-center justify-center mb-4">
                  <MailCheck className="w-7 h-7 text-foreground" />
                </div>
                <p className="font-bold text-foreground">Verifique seu e-mail</p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Se houver uma conta com <strong className="text-foreground">{resetSentTo}</strong>, você vai receber um link
                  para criar uma nova senha. Confira também a caixa de spam.
                </p>
                <button type="button" onClick={() => switchMode("login")} className="btn-primary w-full h-12 py-0 mt-6">
                  Voltar para o login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} noValidate className="space-y-5">
                <Field id="reset-email" label="E-mail da conta" error={errors.email}>
                  <IconInput
                    id="reset-email"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    error={errors.email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                  />
                </Field>
                <button type="submit" disabled={loading} className="btn-primary w-full h-12 py-0 disabled:opacity-60">
                  {loading ? "Enviando..." : "Enviar link"}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-lg py-2 active:scale-[0.98] transition-transform ${focusRing}`}
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar para o login
                </button>
              </form>
            ))}

          {/* ── CADASTRO ── */}
          {mode === "cadastro" && (
            <form onSubmit={handleSignup} noValidate className="space-y-5">
              <SectionTitle step="1">Acesso</SectionTitle>
              <Field id="nome" label="Nome completo" error={errors.fullName}>
                <IconInput
                  id="nome"
                  icon={User}
                  autoComplete="name"
                  placeholder="Maria Silva"
                  value={fullName}
                  error={errors.fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearError("fullName");
                  }}
                />
              </Field>
              <Field id="cad-email" label="E-mail" error={errors.email}>
                <IconInput
                  id="cad-email"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  error={errors.email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="cad-senha" label="Senha" error={errors.password} hint="Mínimo de 8 caracteres">
                  <IconInput
                    id="cad-senha"
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Crie uma senha"
                    value={password}
                    error={errors.password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError("password");
                    }}
                    trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
                  />
                </Field>
                <Field id="cad-confirma" label="Confirmar senha" error={errors.confirmPassword}>
                  <IconInput
                    id="cad-confirma"
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    error={errors.confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError("confirmPassword");
                    }}
                  />
                </Field>
              </div>

              <SectionTitle step="2">Sobre você</SectionTitle>
              <fieldset>
                <legend className="text-sm font-semibold text-foreground mb-2">Quem é você?</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {PROFILE_TYPES.map((pt) => {
                    const active = profileType === pt.value;
                    return (
                      <button
                        key={pt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setProfileType(pt.value);
                          clearError("profileType");
                        }}
                        className={`h-10 px-4 rounded-full border-2 text-sm font-semibold active:scale-95 transition-transform duration-150 ${focusRing} ${
                          active
                            ? "bg-primary border-primary text-primary-foreground"
                            : `bg-card text-foreground/80 hover:border-primary/50 ${errors.profileType ? "border-destructive/60" : "border-border"}`
                        }`}
                      >
                        {pt.label}
                      </button>
                    );
                  })}
                </div>
                {errors.profileType && <p className="text-[13px] text-destructive mt-1.5">{errors.profileType}</p>}
              </fieldset>
              <Field
                id="nascimento"
                label="Data de nascimento"
                error={errors.birthDate}
                hint="Usada só para confirmar que a conta é de um adulto."
              >
                <IconInput
                  id="nascimento"
                  icon={Calendar}
                  type="date"
                  autoComplete="bday"
                  value={birthDate}
                  max={new Date().toISOString().slice(0, 10)}
                  error={errors.birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value);
                    clearError("birthDate");
                  }}
                />
              </Field>
              <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-3">
                <Field id="cidade" label="Cidade" optional>
                  <IconInput
                    id="cidade"
                    icon={MapPin}
                    autoComplete="address-level2"
                    placeholder="Sua cidade"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </Field>
                <Field id="uf" label="UF">
                  <select
                    id="uf"
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className={`${inputBase} border-input px-3`}
                  >
                    <option value="">—</option>
                    {BR_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="sexo" label="Sexo" optional>
                  <select
                    id="sexo"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`${inputBase} border-input px-4`}
                  >
                    <option value="">Prefiro não informar</option>
                    {GENDER_OPTIONS.filter((g) => g.value !== "prefiro_nao_dizer").map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="profissao" label="Profissão" optional>
                  <IconInput
                    id="profissao"
                    icon={Briefcase}
                    autoComplete="organization-title"
                    placeholder="Ex.: Professora"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                  />
                </Field>
              </div>

              <SectionTitle step="3">Privacidade</SectionTitle>
              <div className="space-y-3">
                <ConsentCheckbox
                  id="aceite-termos"
                  checked={acceptTerms}
                  error={!!errors.acceptTerms}
                  onChange={(v) => {
                    setAcceptTerms(v);
                    clearError("acceptTerms");
                  }}
                >
                  Li e aceito os{" "}
                  <Link to="/termos" target="_blank" className={linkCls}>
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link to="/privacidade" target="_blank" className={linkCls}>
                    Política de Privacidade
                  </Link>
                  .
                </ConsentCheckbox>
                {errors.acceptTerms && <p className="text-[13px] text-destructive -mt-1">{errors.acceptTerms}</p>}

                <ConsentCheckbox
                  id="aceite-saude"
                  highlight
                  checked={acceptHealth}
                  error={!!errors.acceptHealth}
                  onChange={(v) => {
                    setAcceptHealth(v);
                    clearError("acceptHealth");
                  }}
                >
                  <strong className="font-bold">Autorizo o uso dos meus dados de saúde</strong> (como alergias) e, se eu
                  cadastrar, dos dados das crianças sob minha responsabilidade, só para o AlerGica indicar remédios e
                  produtos seguros. Posso revogar quando quiser, excluindo minha conta.
                </ConsentCheckbox>
                {errors.acceptHealth && <p className="text-[13px] text-destructive -mt-1">{errors.acceptHealth}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full h-12 py-0 disabled:opacity-60">
                {loading ? "Criando conta..." : "Criar conta"}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{" "}
                <button type="button" onClick={() => switchMode("login")} className={linkCls}>
                  Entrar
                </button>
              </p>
            </form>
          )}

          <footer className="mt-10 pt-6 border-t border-border/70 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link to="/privacidade" className={`hover:text-foreground ${focusRing} rounded`}>
              Política de Privacidade
            </Link>
            <span aria-hidden>·</span>
            <Link to="/termos" className={`hover:text-foreground ${focusRing} rounded`}>
              Termos de Uso
            </Link>
            <span aria-hidden>·</span>
            <span>© {new Date().getFullYear()} AlerGica</span>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
