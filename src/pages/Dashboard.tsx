import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Menu, Plus, Construction } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MedicationCard from "@/components/MedicationCard";
import ProductCard from "@/components/ProductCard";
import RestaurantCard from "@/components/RestaurantCard";
import OnboardingModal from "@/components/OnboardingModal";

import ChatWidget from "@/components/ChatWidget";
import BottomNav from "@/components/BottomNav";
import type { ModuleType } from "@/components/BottomNav";
import HomeContent from "@/components/HomeContent";
import AddMedicationModal from "@/components/AddMedicationModal";
import AddProductModal from "@/components/AddProductModal";
import AddRestaurantModal from "@/components/AddRestaurantModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type RiskLevel = "safe" | "caution" | "risk";

const alertToRisk = (nivel: string | null): RiskLevel => {
  if (nivel === "VERDE") return "safe";
  if (nivel === "AMARELO") return "caution";
  return "risk";
};

const alertToText = (nivel: string | null, temRisco: boolean | null): string => {
  if (nivel === "VERDE") return "Seguro (Sem Leite)";
  if (nivel === "AMARELO") return "Atenção (Verificar)";
  return temRisco ? "Risco Alto (Contém Derivados)" : "Risco (Verificar Composição)";
};

const PROFILE_TEXTS: Record<string, { greeting: string; section: string; placeholder: string }> = {
  alergico: { greeting: "", section: "Mais Procurados", placeholder: "Qual item vamos conferir hoje?" },
  mamae: { greeting: "Mamãe", section: "Mais Procurados pelas Mães", placeholder: "Qual item vamos conferir hoje, mamãe?" },
  papai: { greeting: "Papai", section: "Mais Procurados pelos Pais", placeholder: "Qual item vamos conferir hoje, papai?" },
  farmaceutica: { greeting: "Farmacêutica", section: "Mais Procurados", placeholder: "Qual item vamos conferir hoje, farmacêutico(a)?" },
  medico: { greeting: "Médico(a)", section: "Mais Procurados", placeholder: "Qual item vamos conferir hoje, doutor(a)?" },
};

const MODULE_LABELS: Record<ModuleType, string> = {
  home: "Início",
  medications: "Medicamentos",
  products: "Produtos",
  restaurants: "Restaurantes",
  nutrition: "Nutrição",
};

const Dashboard = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState("");
  const [profileType, setProfileType] = useState("mamae");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>("home");
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Check admin role
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    if (user) checkAdmin();
  }, [user]);

  // Profile & onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      const { data } = await supabase.from("user_onboarding").select("id").eq("user_id", user.id).maybeSingle();
      if (!data) setShowOnboarding(true);

      const { data: profile } = await supabase.from("profiles").select("full_name, profile_type").eq("user_id", user.id).maybeSingle();
      if (profile?.full_name) setUserName(profile.full_name.split(" ")[0]);
      if (profile?.profile_type) setProfileType(profile.profile_type);
    };
    if (user) checkOnboarding();
  }, [user]);

  // Fetch items based on active module
  const fetchItems = useCallback(async () => {
    if (activeModule === "nutrition" || activeModule === "home" || activeModule === "products" || activeModule === "restaurants") {
      setItems([]);
      return;
    }

    const table = activeModule === "medications" ? "medications" : activeModule === "products" ? "products" : "restaurants";
    
    let query = supabase.from(table).select("*").order("access_count", { ascending: false }).limit(50);

    if (searchQuery.trim()) {
      query = query.or(`nome_principal.ilike.%${searchQuery.trim()}%,nome_completo.ilike.%${searchQuery.trim()}%`);
    }

    const { data } = await query;
    setItems(data || []);
  }, [activeModule, searchQuery]);

  useEffect(() => {
    if (user) fetchItems();
  }, [user, fetchItems]);

  const handleOnboardingComplete = async () => {
    if (user) {
      await supabase.from("user_onboarding").insert({ user_id: user.id });
    }
    setShowOnboarding(false);
  };

  const texts = PROFILE_TEXTS[profileType] || PROFILE_TEXTS.mamae;
  const greetingName = userName || texts.greeting;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeModule === "nutrition" || activeModule === "products" || activeModule === "restaurants") {
      const moduleLabel = MODULE_LABELS[activeModule];
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Construction className="w-16 h-16 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Em Desenvolvimento</h3>
          <p className="text-muted-foreground max-w-md">
            O módulo de {moduleLabel} está sendo construído com muito carinho e estará disponível em breve! 💜
          </p>
        </div>
      );
    }

    if (activeModule === "medications") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
          {items.map((med, index) => (
            <Link to={`/medication/${med.id}`} key={med.id} style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
              <MedicationCard
                name={med.nome_principal || "Sem nome"}
                laboratory={med.nome_alternativo || ""}
                riskLevel={alertToRisk(med.nivel_alerta)}
                riskText={alertToText(med.nivel_alerta, med.tem_risco_aplv)}
              />
            </Link>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen w-full bg-background flex">
      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh]">
          <Sidebar isDrawer={true} onClose={() => setSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>

      <main className="flex-1 lg:ml-64 w-full">
        <div className="w-full h-full p-4 md:p-6 lg:p-8 pb-24">
          <div className="w-full max-w-4xl lg:max-w-7xl mx-auto">
            {/* Mobile menu button + greeting (always visible) */}
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6 gap-3 animate-fade-in">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 rounded-md bg-card">
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground text-center pr-2 mr-2 flex-1">
                Olá, {greetingName}! 👋
              </h2>
            </div>

            {activeModule === "home" ? (
              <HomeContent onModuleChange={(m) => { setActiveModule(m); setSearchQuery(""); }} />
            ) : (
              <>
                {/* Search */}
                <div className="mb-4 md:mb-6 lg:mb-10 animate-fade-in">
                  <div className="relative">
                    <Search className="absolute left-3 md:left-4 lg:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={texts.placeholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-3 md:py-4 lg:py-5 px-8 md:px-8 lg:px-10 text-sm md:text-base lg:text-lg rounded-xl md:rounded-2xl lg:rounded-2xl border-2 border-input bg-card shadow-soft transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>

                

                {/* Results Section */}
                <section className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
                  <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-5">
                    <h3 className="text-base md:text-lg lg:text-lg font-bold text-foreground">
                      {activeModule === "nutrition" ? "Nutrição" : `${texts.section} - ${MODULE_LABELS[activeModule]}`}
                    </h3>
                    {isAdmin && activeModule !== "nutrition" && (
                      <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1">
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </Button>
                    )}
                  </div>

                  {items.length === 0 && activeModule !== "nutrition" ? (
                    <p className="text-muted-foreground text-center py-10">
                      {searchQuery ? "Nenhum resultado encontrado." : "Nenhum item cadastrado ainda."}
                    </p>
                  ) : (
                    renderContent()
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      <ChatWidget />
      <BottomNav activeModule={activeModule} onModuleChange={(m) => { setActiveModule(m); setSearchQuery(""); }} />

      {/* Admin Modals */}
      <AddMedicationModal open={showAddModal && activeModule === "medications"} onOpenChange={setShowAddModal} onSuccess={fetchItems} />
      <AddProductModal open={showAddModal && activeModule === "products"} onOpenChange={setShowAddModal} onSuccess={fetchItems} />
      <AddRestaurantModal open={showAddModal && activeModule === "restaurants"} onOpenChange={setShowAddModal} onSuccess={fetchItems} />
    </div>
  );
};

export default Dashboard;
