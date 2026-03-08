import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Calendar, MapPin, Briefcase, MailCheck } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import mascotImage from "@/assets/mascot.png";

const PROFILE_TYPES = [
  { value: "alergica", label: "Pessoa Alérgica" },
  { value: "mae", label: "Mãe da Pessoa Alérgica" },
  { value: "pai", label: "Pai da Pessoa Alérgica" },
  { value: "farmaceutico", label: "Farmacêutico(a)" },
  { value: "medico", label: "Médico(a)" },
];

const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "nao_binario", label: "Não-binário" },
  { value: "prefiro_nao_dizer", label: "Prefiro não informar" },
];

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

// Validation schemas
const emailSchema = z.string().trim().email({ message: "Email inválido" });
const passwordSchema = z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres" });
const nameSchema = z.string().trim().min(2, { message: "Nome deve ter no mínimo 2 caracteres" });

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<"login" | "cadastro">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeFading, setWelcomeFading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileType, setProfileType] = useState("mae");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [profession, setProfession] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Mobile welcome animation
  // Removed automatic timeout, now manual with button

  const handleContinue = () => {
    setWelcomeFading(true);
    setTimeout(() => {
      setShowWelcome(false);
      setWelcomeFading(false);
    }, 500); // Match transition duration
  };

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    if (!password) {
      newErrors.password = "Senha é obrigatória";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors: Record<string, string> = {};

    const nameResult = nameSchema.safeParse(fullName);
    if (!nameResult.success) {
      newErrors.fullName = nameResult.error.errors[0].message;
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    if (!birthDate) newErrors.birthDate = "Data de nascimento é obrigatória";
    if (!gender) newErrors.gender = "Sexo é obrigatório";
    if (!city.trim()) newErrors.city = "Cidade é obrigatória";
    if (!uf) newErrors.uf = "Estado é obrigatório";
    if (!profession.trim()) newErrors.profession = "Profissão é obrigatória";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      let description = error.message;
      if (error.message === "Invalid login credentials") {
        description = "Email ou senha incorretos";
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        description = "Você ainda não confirmou seu e-mail. Verifique sua caixa de entrada e clique no link de confirmação.";
      }
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description,
      });
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    
    setLoading(true);
    const { error } = await signUp(email, password, fullName);

    if (error) {
      setLoading(false);
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = "Este email já está cadastrado. Tente fazer login.";
      }
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: message,
      });
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase
          .from("profiles")
          .upsert({
            user_id: userData.user.id,
            profile_type: profileType,
            birth_date: birthDate || null,
            gender: gender || null,
            city: city.trim() || null,
            state: uf || null,
            profession: profession.trim() || null,
          }, { onConflict: "user_id" });
      }
      setLoading(false);
      setRegisteredEmail(email);
      setEmailSent(true);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Mobile Welcome Screen */}
      {showWelcome && (
        <div className={`lg:hidden w-full gradient-welcome flex flex-col items-center justify-center p-6 md:p-12 transition-opacity duration-500 ${
          welcomeFading ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className="max-w-md text-center animate-fade-in">
            {/* Logo */}
            <h1 className="text-4xl font-extrabold text-primary-foreground mb-8">
              Aler<span className="text-primary">Gica</span>
            </h1>
            
            {/* Mascot */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-110" />
              <img 
                src={mascotImage} 
                alt="AlerGica mascot - uma simpática ursa enfermeira" 
                className="relative w-48 h-48 md:w-72 md:h-72 object-contain mx-auto animate-float"
              />
            </div>
            
            {/* Tagline */}
            <div className="text-center">
              <p className="text-xl font-medium text-foreground/90 leading-relaxed">
                 Eu sou a AlerGica,
              </p>
              <p className="text-xl font-medium text-foreground/90 leading-relaxed">
                a assistente estratégica para sua saúde e bem-estar.
              </p>
              <br />
              <p className="text-xl font-medium text-foreground/90 leading-relaxed">
                Com nossa tecnologia, você consulta <span className="text-primary font-semibold">medicamentos</span> e <span className="text-primary font-semibold">alimentos</span>, descobrindo alérgenos ocultos, para que você viva com mais segurança e menos sustos.
              </p>
              
              {/* Continue Button */}
              <div className="mt-8">
                <Button 
                  onClick={handleContinue}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Left Half - Welcome Section */}
      <div 
        className={`hidden lg:flex gradient-welcome flex-col items-center justify-center p-6 md:p-12 transition-all duration-1000 ease-out ${
          isAnimated ? 'w-1/2' : 'w-full'
        }`}
      >
        <div className="max-w-md text-center animate-fade-in">
          {/* Logo */}
          <h1 className="text-4xl font-extrabold text-primary-foreground mb-8">
            Aler<span className="text-primary">Gica</span>
          </h1>
          
          {/* Mascot */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-110" />
            <img 
              src={mascotImage} 
              alt="AlerGica mascot - uma simpática ursa enfermeira" 
              className="relative w-48 h-48 md:w-72 md:h-72 object-contain mx-auto animate-float"
            />
          </div>
          
          {/* Tagline */}
          <div className="text-center">
            <p className="text-xl font-medium text-foreground/80 leading-relaxed">
                 Eu sou a AlerGica,
              </p>
              <p className="text-xl font-medium text-foreground/80 leading-relaxed">
                a assistente estratégica para sua saúde e bem-estar.
              </p>
              <p className="text-xl font-medium text-foreground/80 leading-relaxed">
                Com nossa tecnologia, você consulta <span className="text-primary font-semibold">medicamentos</span> e <span className="text-primary font-semibold">alimentos</span>, descobrindo alérgenos ocultos, para que você viva com mais segurança e menos sustos.
              </p>
              <p className="text-2xl mt-2">😊</p>
          </div>
        </div>
      </div>

      {/* Auth Forms - Mobile and Desktop */}
      <div 
        className={`flex items-center justify-center p-4 md:p-6 lg:p-12 bg-background transition-all duration-1000 ease-out ${
          showWelcome ? 'hidden lg:flex' : 'flex'
        } ${
          isAnimated ? 'w-full lg:w-1/2 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full'
        } ${isAnimated ? '' : 'lg:hidden'}`}
      >
        <div className={`w-full max-w-md transition-all duration-700 delay-500 ${
          isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-extrabold text-foreground">
              Aler<span className="text-primary">Gica</span>
            </h1>
          </div>

          {/* Tela de confirmação de e-mail */}
          {emailSent && (
            <div className="flex flex-col items-center text-center animate-fade-in space-y-6 py-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <MailCheck className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Verifique seu e-mail</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Enviamos um link de confirmação para:
                </p>
                <p className="font-semibold text-foreground mt-1">{registeredEmail}</p>
              </div>
              <div className="w-full p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 leading-relaxed text-left">
                <p className="font-semibold text-foreground mb-2">O que fazer agora:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Abra o e-mail que enviamos</li>
                  <li>Clique no link de confirmação</li>
                  <li>Volte aqui e faça o login</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground">
                Não recebeu? Verifique a pasta de spam ou{" "}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  tente novamente
                </button>
                .
              </p>
              <Button
                onClick={() => { setEmailSent(false); setActiveTab("login"); }}
                variant="outline"
                className="w-full"
              >
                Ir para o login
              </Button>
            </div>
          )}

          {/* Tabs + formulários + footer — ocultados na tela de confirmação */}
          {!emailSent && (<><div className="flex gap-2 mb-8 p-1.5 bg-secondary rounded-xl">
            <button
              onClick={() => { setActiveTab("login"); setErrors({}); }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveTab("cadastro"); setErrors({}); }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === "cadastro"
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cadastro
            </button>
          </div>

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`input-soft w-full pl-12 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`input-soft w-full pl-12 pr-12 ${errors.password ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
              </div>

              <div className="text-right">
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Esqueci minha senha
                </a>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          )}

          {/* Cadastro Form */}
          {activeTab === "cadastro" && (
            <form onSubmit={handleSignup} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Maria Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`input-soft w-full pl-12 ${errors.fullName ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`input-soft w-full pl-12 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`input-soft w-full pl-12 pr-12 ${errors.password ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`input-soft w-full pl-12 pr-12 ${errors.confirmPassword ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Quem é você?</label>
                <select
                  value={profileType || ""}
                  onChange={(e) => setProfileType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>Selecione uma opção</option>
                  {PROFILE_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>

              {/* Data de nascimento */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data de Nascimento <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`input-soft w-full pl-12 ${errors.birthDate ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.birthDate && <p className="text-sm text-destructive mt-1">{errors.birthDate}</p>}
              </div>

              {/* Sexo */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Sexo <span className="text-destructive">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.gender ? "border-destructive" : "border-border"}`}
                >
                  <option value="" disabled>Selecione</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender}</p>}
              </div>

              {/* Cidade e Estado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cidade <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Sua cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`input-soft w-full pl-12 ${errors.city ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Estado <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary h-[46px] ${errors.uf ? "border-destructive" : "border-border"}`}
                  >
                    <option value="" disabled>UF</option>
                    {BR_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.uf && <p className="text-sm text-destructive mt-1">{errors.uf}</p>}
                </div>
              </div>

              {/* Profissão */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Profissão <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Ex: Engenheira, Professora..."
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className={`input-soft w-full pl-12 ${errors.profession ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.profession && <p className="text-sm text-destructive mt-1">{errors.profession}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? "Criando conta..." : "Criar Conta"}
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            {activeTab === "login" ? (
              <>
                Não tem uma conta?{" "}
                <button
                  onClick={() => { setActiveTab("cadastro"); setErrors({}); }}
                  className="text-primary font-semibold hover:underline"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{" "}
                <button
                  onClick={() => { setActiveTab("login"); setErrors({}); }}
                  className="text-primary font-semibold hover:underline"
                >
                  Fazer login
                </button>
              </>
            )}
          </p>
          </>)}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
