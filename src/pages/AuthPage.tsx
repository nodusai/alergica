import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import mascotImage from "@/assets/mascot.png";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<"login" | "cadastro">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          <p className="text-xl font-medium text-foreground/80 leading-relaxed">
            Seu guia seguro para medicamentos e APLV.
          </p>
          <p className="text-muted-foreground mt-3">
            Cuide com confiança. Consulte com tranquilidade.
          </p>
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
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("cadastro")}
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
            <form className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className="input-soft w-full pl-12"
                  />
                </div>
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
                    className="input-soft w-full pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Esqueci minha senha
                </a>
              </div>

              <button type="submit" className="btn-primary w-full">
                Entrar
              </button>
            </form>
          )}

          {/* Cadastro Form */}
          {activeTab === "cadastro" && (
            <form className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Maria Silva"
                    className="input-soft w-full pl-12"
                  />
                </div>
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
                    className="input-soft w-full pl-12"
                  />
                </div>
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
                    className="input-soft w-full pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
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
                    className="input-soft w-full pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                Criar Conta
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            {activeTab === "login" ? (
              <>
                Não tem uma conta?{" "}
                <button 
                  onClick={() => setActiveTab("cadastro")}
                  className="text-primary font-semibold hover:underline"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{" "}
                <button 
                  onClick={() => setActiveTab("login")}
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
