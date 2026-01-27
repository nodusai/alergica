import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, LogOut, Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MedicationCard from "@/components/MedicationCard";
import OnboardingModal from "@/components/OnboardingModal";
import APLVInfoCarousel from "@/components/APLVInfoCarousel";
import ChatWidget from "@/components/ChatWidget";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="min-h-screen w-full bg-background flex">
      {/* Onboarding Modal */}
      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer (controlled via state; trigger is a header button) */}
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh]">
          <Sidebar isDrawer={true} onClose={() => setSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 w-full">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <div className="w-full max-w-4xl lg:max-w-7xl mx-auto">
            {/* Header with Search */}
            <div className="mb-4 md:mb-6 lg:mb-10 animate-fade-in">
              <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6 gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 rounded-md bg-card">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground text-center pr-2 mr-2 flex-1">
                  Olá, {userName}! 👋
                </h2>
              </div>
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 md:left-4 lg:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Qual medicamento vamos conferir hoje, mamãe?"
                  className="w-full py-3 md:py-4 lg:py-5 px-8 md:px-8 lg:px-10 text-sm md:text-base lg:text-lg rounded-xl md:rounded-2xl lg:rounded-2xl border-2 border-input bg-card shadow-soft transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* APLV Info Carousel */}
            <APLVInfoCarousel />

            {/* Results Section */}
            <section className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <h3 className="text-base md:text-lg lg:text-lg font-bold text-foreground mb-3 md:mb-4 lg:mb-5">
                Mais Procurados pelas Mães
              </h3>

              {/* Medication Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
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
          </div>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
};

export default Dashboard;
