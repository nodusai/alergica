import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Search, Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MedicationCard from "@/components/MedicationCard";
import OnboardingModal from "@/components/OnboardingModal";
import APLVInfoCarousel from "@/components/APLVInfoCarousel";
import ChatWidget from "@/components/ChatWidget";
import ExpandableTabs, { ModuleTab } from "@/components/ExpandableTabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getPopularMedications,
  getRecentMedications,
  getMedicationsByRisk,
  searchMedications,
  medToRisk,
  MedRow,
} from "@/services/medications";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import ProductScanner from "@/components/ProductScanner";


type RiskLevel = "safe" | "caution" | "risk";

const RISK_TEXT: Record<string, string> = {
  safe: "Seguro (Sem Leite)",
  caution: "Atenção (Verificar)",
  risk: "Risco (Contém Leite)",
};

const RISK_FILTER_LABELS: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "safe", label: "Seguro" },
  { value: "caution", label: "Atenção" },
  { value: "risk", label: "Risco" },
];

const MedCardSkeleton = () => (
  <div className="card-soft p-4 space-y-3">
    <Skeleton className="h-5 w-3/4 rounded-lg" />
    <Skeleton className="h-4 w-1/2 rounded-lg" />
    <Skeleton className="h-6 w-1/3 rounded-full" />
  </div>
);

const PlaceholderModule = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
    <p className="text-5xl mb-4">🚧</p>
    <h3 className="text-lg font-bold text-foreground mb-2">{label}</h3>
    <p className="text-muted-foreground text-sm">Em desenvolvimento. Em breve disponível!</p>
  </div>
);

const Dashboard = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfileType, setUserProfileType] = useState<string | null>(null);
  const [userName, setUserName] = useState("Mamãe");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleTab>("inicio");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MedRow[]>([]);
  const [popularMedications, setPopularMedications] = useState<MedRow[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [searching, setSearching] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [medTabMeds, setMedTabMeds] = useState<MedRow[]>([]);
  const [loadingMedTab, setLoadingMedTab] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      const [onboardingRes, profileRes, popular] = await Promise.all([
        supabase.from("user_onboarding").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name, profile_type").eq("user_id", user.id).maybeSingle(),
        getPopularMedications().catch(() => [] as MedRow[]),
      ]);

      if (profileRes.data?.profile_type) setUserProfileType(profileRes.data.profile_type);
      if (!onboardingRes.data) setShowOnboarding(true);
      if (profileRes.data?.full_name) setUserName(profileRes.data.full_name.split(" ")[0]);
      setPopularMedications(popular);
      setLoadingPopular(false);
    };

    init();
  }, [user]);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchDebounce.current = setTimeout(async () => {
      const q = searchQuery.trim();
      const data = await searchMedications(q).catch(() => [] as MedRow[]);
      setSearchResults(data);
      setSearching(false);
    }, 400);

    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (activeModule !== "medicamentos") return;
    setLoadingMedTab(true);
    setMedTabMeds([]);
    const loader =
      riskFilter === "all"
        ? getRecentMedications(50)
        : getMedicationsByRisk(riskFilter);
    loader
      .then(setMedTabMeds)
      .catch(() => {})
      .finally(() => setLoadingMedTab(false));
  }, [activeModule, riskFilter]);

  const handleOnboardingComplete = async () => {
    if (user) await supabase.from("user_onboarding").insert({ user_id: user.id });
    setShowOnboarding(false);
  };

  const filteredSearchResults =
    riskFilter === "all"
      ? searchResults
      : searchResults.filter((m) => medToRisk(m.tem_risco_aplv, m.nivel_alerta, m.avisos) === riskFilter);

  const displayMeds = searchQuery.trim() ? filteredSearchResults : popularMedications;
  const sectionTitle = searchQuery.trim() ? "Resultados da Busca" : "Mais Procurados";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex">
      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} profileType={userProfileType} />

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh]">
          <Sidebar isDrawer={true} onClose={() => setSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>

      <main className="flex-1 lg:ml-64 w-full">
        <div className="w-full h-full p-4 md:p-6 lg:p-8 pb-24 lg:pb-28">
          <div className="w-full max-w-4xl lg:max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-4 md:mb-6 lg:mb-10 animate-fade-in">
              <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6 gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 rounded-md bg-card">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground text-center pr-2 mr-2 flex-1">
                  Olá, {userName}! 👋
                </h2>
              </div>

              {activeModule === "medicamentos" && (
                <div className="relative">
                  <Search className="absolute left-3 md:left-4 lg:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar medicamento..."
                    className="w-full py-3 md:py-4 lg:py-5 px-8 md:px-8 lg:px-10 text-sm md:text-base lg:text-lg rounded-xl md:rounded-2xl border-2 border-input bg-card shadow-soft transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground/60"
                  />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              )}
            </div>

            {/* Início module */}
            {activeModule === "inicio" && (
              <>
                {!searchQuery.trim() && <APLVInfoCarousel />}
                <section className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 lg:mb-5">
                    {sectionTitle}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                    {loadingPopular && !searchQuery.trim()
                      ? Array.from({ length: 6 }).map((_, i) => <MedCardSkeleton key={i} />)
                      : displayMeds.map((med, index) => (
                          <Link
                            to={`/medication/${med.id}`}
                            key={med.id}
                            style={{ animationDelay: `${0.05 * index}s` }}
                          >
                            <MedicationCard
                              name={med.nome_principal}
                              laboratory={med.nome_alternativo ?? ""}
                              riskLevel={medToRisk(med.tem_risco_aplv, med.nivel_alerta, med.avisos)}
                              riskText={RISK_TEXT[medToRisk(med.tem_risco_aplv, med.nivel_alerta, med.avisos)] ?? med.nivel_alerta ?? ""}
                            />
                          </Link>
                        ))}
                    {!loadingPopular && displayMeds.length === 0 && searchQuery.trim() && (
                      <p className="col-span-full text-center text-muted-foreground py-8">
                        Nenhum medicamento encontrado para "{searchQuery}".
                      </p>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* Medicamentos module */}
            {activeModule === "medicamentos" && (() => {
              // Se há busca ativa, filtra client-side nos resultados da busca
              // Sem busca, medTabMeds já vem filtrado do servidor
              const filteredMeds = searchQuery.trim() ? filteredSearchResults : medTabMeds;
              const isLoading = searchQuery.trim() ? searching : loadingMedTab;

              return (
                <section className="animate-fade-in">
                  <div className="flex gap-2 flex-wrap mb-4">
                    {RISK_FILTER_LABELS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setRiskFilter(f.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
                          riskFilter === f.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                    {isLoading
                      ? Array.from({ length: 3 }).map((_, i) => <MedCardSkeleton key={i} />)
                      : filteredMeds.map((med, index) => (
                          <Link
                            to={`/medication/${med.id}`}
                            key={med.id}
                            style={{ animationDelay: `${0.05 * index}s` }}
                          >
                            <MedicationCard
                              name={med.nome_principal}
                              laboratory={med.nome_alternativo ?? ""}
                              riskLevel={medToRisk(med.tem_risco_aplv, med.nivel_alerta, med.avisos)}
                              riskText={RISK_TEXT[medToRisk(med.tem_risco_aplv, med.nivel_alerta, med.avisos)] ?? med.nivel_alerta ?? ""}
                            />
                          </Link>
                        ))}
                    {!isLoading && filteredMeds.length === 0 && (
                      <p className="col-span-full text-center text-muted-foreground py-8">
                        {searchQuery.trim()
                          ? `Nenhum medicamento encontrado para "${searchQuery}".`
                          : "Nenhum medicamento encontrado."}
                      </p>
                    )}
                  </div>
                </section>
              );
            })()}

            {activeModule === "produtos" && <ProductScanner />}
            {activeModule === "restaurantes" && <PlaceholderModule label="Módulo de Restaurantes" />}
            {activeModule === "nutricao" && <PlaceholderModule label="Módulo de Nutrição" />}
          </div>
        </div>
      </main>

      <ExpandableTabs activeTab={activeModule} onTabChange={setActiveModule} />
      <ChatWidget />
    </div>
  );
};

export default Dashboard;
