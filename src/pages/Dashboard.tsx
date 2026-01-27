import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, LogOut } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MedicationCard from "@/components/MedicationCard";
import OnboardingModal from "@/components/OnboardingModal";
import APLVInfoCarousel from "@/components/APLVInfoCarousel";
import ChatWidget from "@/components/ChatWidget";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const mockMedications = [
  {
    id: 1,
    name: "Dipirona Gotas",
    laboratory: "Medley",
    riskLevel: "safe" as const,
    riskText: "Seguro (Sem Leite)",
  },
  {
    id: 2,
    name: "Amoxicilina Suspensão",
    laboratory: "EMS",
    riskLevel: "caution" as const,
    riskText: "Atenção (Risco de Traços)",
  },
  {
    id: 3,
    name: "Vitamina D Gotas",
    laboratory: "Aché",
    riskLevel: "risk" as const,
    riskText: "Risco Alto (Contém Lactose)",
  },
  {
    id: 4,
    name: "Paracetamol Infantil",
    laboratory: "Novalgina",
    riskLevel: "safe" as const,
    riskText: "Seguro (Sem Leite)",
  },
  {
    id: 5,
    name: "Ibuprofeno Gotas",
    laboratory: "Neo Química",
    riskLevel: "caution" as const,
    riskText: "Atenção (Verificar Lote)",
  },
  {
    id: 6,
    name: "Polivitamínico",
    laboratory: "Sundown",
    riskLevel: "risk" as const,
    riskText: "Risco Alto (Derivados do Leite)",
  },
];

const Dashboard = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState("Mamãe");
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      
      // Check if user has completed onboarding
      const { data } = await supabase
        .from("user_onboarding")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!data) {
        setShowOnboarding(true);
      }

      // Get user name from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile?.full_name) {
        setUserName(profile.full_name.split(" ")[0]);
      }
    };

    if (user) {
      checkOnboarding();
    }
  }, [user]);

  const handleOnboardingComplete = async () => {
    if (user) {
      await supabase.from("user_onboarding").insert({ user_id: user.id });
    }
    setShowOnboarding(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Onboarding Modal */}
      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header with Search */}
          <div className="mb-10 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Olá, {userName}! 👋
              </h2>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <input
                type="text"
                placeholder="Qual medicamento vamos conferir hoje, mamãe?"
                className="w-full py-5 px-14 text-lg rounded-2xl border-2 border-input bg-card shadow-soft transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* APLV Info Carousel */}
          <APLVInfoCarousel />

          {/* Results Section */}
          <section className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <h3 className="text-lg font-bold text-foreground mb-5">
              Mais Procurados pelas Mães
            </h3>
            
            {/* Medication Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mockMedications.map((med, index) => (
                <Link 
                  to="/medication/1"
                  key={med.id} 
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <MedicationCard
                    name={med.name}
                    laboratory={med.laboratory}
                    riskLevel={med.riskLevel}
                    riskText={med.riskText}
                  />
                </Link>
              ))}
            </div>
          </section>

          {/* Info Section */}
          <section className="mt-10 p-6 rounded-2xl bg-secondary/50 border border-border animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h4 className="font-bold text-foreground mb-2">💡 Dica do dia</h4>
            <p className="text-muted-foreground text-sm">
              Sempre verifique a composição completa do medicamento na bula. 
              Nossa análise é baseada em dados públicos e pode não contemplar todas as variações de fórmulas.
            </p>
          </section>
        </div>
      </main>

      <ChatWidget />
    </div>
  );
};

export default Dashboard;
