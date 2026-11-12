import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  getMedicationsPage,
  getMedicationsByRisk,
  searchMedications,
  medToRisk,
  MedRow,
  MEDS_PAGE_SIZE,
} from "@/services/medications";
import PaginationBar from "@/components/PaginationBar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import ProductScanner from "@/components/ProductScanner";
import { displayName, firstName } from "@/lib/names";


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

const MODULE_HEADERS: Partial<Record<ModuleTab, { title: string; subtitle: string }>> = {
  produtos: {
    title: "Verificar produto",
    subtitle: "Fotografe a lista de ingredientes de um alimento e descubra se ele tem leite ou derivados.",
  },
  restaurantes: { title: "Restaurantes", subtitle: "Lugares com opções seguras para quem tem APLV." },
  nutricao: { title: "Nutrição", subtitle: "Orientações e receitas sem leite para o dia a dia." },
};

const MED_LINK =
  "group block rounded-2xl active:scale-[0.98] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const MedCardSkeleton = () => (
  <div className="rounded-2xl bg-card border border-border/60 p-4 md:p-5 flex gap-3">
    <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-3/4 rounded-lg" />
      <Skeleton className="h-4 w-1/2 rounded-lg" />
      <Skeleton className="h-6 w-28 rounded-full" />
    </div>
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
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleTab>("inicio");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MedRow[]>([]);
  const [popularMedications, setPopularMedications] = useState<MedRow[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [searching, setSearching] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  // Módulo Remédios: em "Todos" guarda só a página atual (paginação no banco);
  // nos filtros de risco guarda a lista filtrada inteira (paginação no navegador).
  const [medTabMeds, setMedTabMeds] = useState<MedRow[]>([]);
  const [medTotal, setMedTotal] = useState(0);
  const [medPage, setMedPage] = useState(1);
  const [loadingMedTab, setLoadingMedTab] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const medListTop = useRef<HTMLDivElement | null>(null);

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
      // Nome: perfil → cadastro → e-mail (nunca um nome genérico como "Mamãe")
      setUserName(firstName(displayName(profileRes.data?.full_name, user)));
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
      // Limite maior: no módulo Remédios os resultados são paginados de 30 em 30
      const data = await searchMedications(q, 300).catch(() => [] as MedRow[]);
      setSearchResults(data);
      setSearching(false);
    }, 400);

    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [searchQuery]);

  // "Todos": busca no banco só a página atual
  useEffect(() => {
    if (activeModule !== "medicamentos" || riskFilter !== "all") return;
    let cancelled = false;
    setLoadingMedTab(true);
    getMedicationsPage(medPage)
      .then(({ items, total }) => {
        if (cancelled) return;
        setMedTabMeds(items);
        setMedTotal(total);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingMedTab(false));
    return () => {
      cancelled = true;
    };
  }, [activeModule, riskFilter, medPage]);

  // Filtros de risco: carrega a lista filtrada uma vez; trocar de página não busca de novo
  useEffect(() => {
    if (activeModule !== "medicamentos" || riskFilter === "all") return;
    let cancelled = false;
    setLoadingMedTab(true);
    setMedTabMeds([]);
    getMedicationsByRisk(riskFilter)
      .then((list) => {
        if (cancelled) return;
        setMedTabMeds(list);
        setMedTotal(list.length);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingMedTab(false));
    return () => {
      cancelled = true;
    };
  }, [activeModule, riskFilter]);

  const changeMedPage = (page: number) => {
    setMedPage(page);
    medListTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changeRiskFilter = (value: RiskLevel | "all") => {
    if (value === riskFilter) return;
    // Limpa a lista anterior já no clique, para não mostrar por um instante dados do filtro antigo
    setMedTabMeds([]);
    setMedTotal(0);
    setLoadingMedTab(true);
    setRiskFilter(value);
    setMedPage(1);
  };

  const handleOnboardingComplete = async () => {
    if (user) await supabase.from("user_onboarding").insert({ user_id: user.id });
    setShowOnboarding(false);
  };

  const filteredSearchResults =
    riskFilter === "all"
      ? searchResults
      : searchResults.filter((m) => medToRisk(m.tem_risco_aplv, m.nivel_alerta, m.avisos) === riskFilter);

  // Início mostra no máximo 12 resultados de busca; a lista completa fica no módulo Remédios
  const displayMeds = searchQuery.trim() ? filteredSearchResults.slice(0, 12) : popularMedications;
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
            <div className="mb-8 md:mb-10 animate-fade-in">
              <div className="flex items-center gap-3 mb-4 lg:hidden">
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu"
                  className="p-2 rounded-xl bg-card border border-border/60 hover:bg-secondary active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {activeModule === "inicio" || activeModule === "medicamentos" ? (
                <div className="relative overflow-hidden rounded-3xl border border-primary/15 px-5 py-6 md:px-8 md:py-8 bg-[radial-gradient(120%_120%_at_0%_0%,hsl(var(--primary)/0.16)_0%,transparent_55%),radial-gradient(90%_120%_at_100%_100%,hsl(var(--safe)/0.10)_0%,transparent_60%)] bg-card shadow-[0_1px_2px_hsl(var(--primary)/0.08),0_16px_40px_-20px_hsl(var(--primary)/0.45)]">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-[-0.03em] leading-tight">
                    {userName ? `Olá, ${userName}!` : "Olá!"} 👋
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-1.5 mb-5 md:mb-6 leading-relaxed max-w-xl">
                    {activeModule === "medicamentos"
                      ? "Encontre um medicamento e veja se ele contém derivados do leite."
                      : "Digite o nome do remédio para saber se ele é seguro para quem tem APLV."}
                  </p>

                  <div className="relative">
                    <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setMedPage(1);
                      }}
                      aria-label="Buscar medicamento"
                      placeholder={
                        activeModule === "medicamentos"
                          ? "Buscar medicamento..."
                          : "Ex.: dipirona, amoxicilina, ibuprofeno"
                      }
                      className="w-full py-4 md:py-[18px] pl-12 md:pl-14 pr-12 text-base md:text-lg rounded-2xl border-2 border-transparent bg-background/90 shadow-[0_1px_2px_hsl(160_40%_15%/0.06),0_6px_16px_-8px_hsl(160_40%_15%/0.15)] transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                    />
                    {searching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs md:text-[13px] text-muted-foreground" aria-label="Legenda dos resultados">
                    <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-safe" />Seguro: sem leite</li>
                    <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-caution" />Atenção: pode ter traços</li>
                    <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-risk" />Risco: contém leite</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{userName ? `Olá, ${userName}!` : "Olá!"} 👋</p>
                  <h2 className="font-display text-[2rem] md:text-[2.4rem] font-bold text-foreground tracking-[-0.03em] leading-[1.1] mt-1">
                    {MODULE_HEADERS[activeModule]?.title}
                  </h2>
                  <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                    {MODULE_HEADERS[activeModule]?.subtitle}
                  </p>
                </div>
              )}
            </div>

            {/* Início module */}
            {activeModule === "inicio" && (
              <>
                {!searchQuery.trim() && <APLVInfoCarousel />}
                <section className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
                  <div className="mb-4 md:mb-5">
                    <h3 className="text-lg md:text-xl font-extrabold text-foreground tracking-[-0.02em]">
                      {sectionTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {searchQuery.trim()
                        ? `${displayMeds.length} resultado${displayMeds.length === 1 ? "" : "s"} para "${searchQuery.trim()}"`
                        : "Os medicamentos que as famílias mais consultam."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {loadingPopular && !searchQuery.trim()
                      ? Array.from({ length: 6 }).map((_, i) => <MedCardSkeleton key={i} />)
                      : displayMeds.map((med, index) => (
                          <Link
                            to={`/medication/${med.id}`}
                            key={med.id}
                            style={{ animationDelay: `${0.05 * index}s` }}
                            className={MED_LINK}
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
              // Busca ativa: pagina os resultados da busca no navegador.
              // "Todos" sem busca: medTabMeds já é a página atual vinda do banco.
              // Filtro de risco sem busca: medTabMeds é a lista filtrada inteira.
              const hasQuery = !!searchQuery.trim();
              const serverPaged = !hasQuery && riskFilter === "all";
              const source = hasQuery ? filteredSearchResults : medTabMeds;
              const total = hasQuery ? filteredSearchResults.length : medTotal;
              const totalPages = Math.max(1, Math.ceil(total / MEDS_PAGE_SIZE));
              const page = Math.min(medPage, totalPages);
              const pageStart = (page - 1) * MEDS_PAGE_SIZE;
              const filteredMeds = serverPaged ? source : source.slice(pageStart, pageStart + MEDS_PAGE_SIZE);
              const isLoading = hasQuery ? searching : loadingMedTab;
              const fmt = (n: number) => n.toLocaleString("pt-BR");

              return (
                <section className="animate-fade-in">
                  <div ref={medListTop} className="scroll-mt-6 flex gap-2 flex-wrap mb-4">
                    {RISK_FILTER_LABELS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => changeRiskFilter(f.value)}
                        aria-pressed={riskFilter === f.value}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          riskFilter === f.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 tabular-nums" aria-live="polite">
                    {isLoading
                      ? "Carregando remédios..."
                      : total === 0
                        ? " "
                        : `Mostrando ${fmt(pageStart + 1)}–${fmt(Math.min(pageStart + MEDS_PAGE_SIZE, total))} de ${fmt(total)} ${total === 1 ? "remédio" : "remédios"}`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {isLoading
                      ? Array.from({ length: 9 }).map((_, i) => <MedCardSkeleton key={i} />)
                      : filteredMeds.map((med, index) => (
                          <Link
                            to={`/medication/${med.id}`}
                            key={med.id}
                            style={{ animationDelay: `${0.05 * index}s` }}
                            className={MED_LINK}
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
                  {!isLoading && <PaginationBar page={page} totalPages={totalPages} onChange={changeMedPage} />}
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
