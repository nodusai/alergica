import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import mascotImage from "@/assets/mascot.png";

// Validation schemas
const emailSchema = z.string().trim().email({ message: "Email inválido" });
const passwordSchema = z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres" });
const nameSchema = z.string().trim().min(2, { message: "Nome deve ter no mínimo 2 caracteres" });

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<"login" | "cadastro">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos" 
          : error.message,
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
    setLoading(false);
    
    if (error) {
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
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vinda ao AlerGica!",
      });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Half - Welcome Section */}
      <div className="hidden lg:flex w-1/2 gradient-welcome flex-col items-center justify-center p-12">
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
              className="relative w-72 h-72 object-contain mx-auto animate-float"
            />
          </div>
          
          {/* Tagline */}
          <div className="text-center">
            <p className="text-xl font-medium text-foreground/80 leading-relaxed">
              Eu sou o AlerGica,
            </p>
            <p className="text-xl font-medium text-foreground/80 leading-relaxed">
              seu ajudante para cuidar do seu bem-estar.
            </p>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Aqui você vai consultar alimentos e remédios para evitar sustos e ficar seguro.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Vamos lá?
            </p>
            <p className="text-2xl mt-2">😊</p>
          </div>
        </div>
      </div>

      {/* Right Half - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md animate-slide-in-right">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-extrabold text-foreground">
              Aler<span className="text-primary">Gica</span>
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 p-1.5 bg-secondary rounded-xl">
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
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
