import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  ExternalLink,
  FileText,
  Info,
  Menu,
  AlertCircle,
  Milk,
  Pill,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMedication,
  getSafeAlternatives,
  recordMedicationView,
  medToRisk,
  parseTextField,
  MedicationDetail,
  SafeAlternative,
} from "@/services/medications";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const HEALTH_PROFESSIONAL_TYPES = ["farmaceutico", "medico"];

/** Separa a composição em princípios ativos e excipientes */
const parseComposicao = (raw: string): { ativos: string[]; excipientes: string[] } => {
  const excipienteSep = /\.\s*Excipientes?:/i;
  const parts = raw.split(excipienteSep);

  const parseItems = (str: string) =>
    str
      .split(/[;,]/)
      .map((s) => s.trim().replace(/\.$/, ""))
      .filter(Boolean);

  return {
    ativos: parseItems(parts[0] ?? ""),
    excipientes: parseItems(parts[1] ?? ""),
  };
};

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Ingredientes de origem láctea comuns em bulas (comparação sem acento) */
const MILK_TERMS = [
  "leite",
  "lactose",
  "caseina",
  "caseinato",
  "lactoalbumina",
  "lactoglobulina",
  "soro de leite",
  "whey",
  "manteiga",
  "lactulose",
];

const isMilkDerived = (ingredient: string, extraTerms: string[]) => {
  const n = normalize(ingredient);
  return [...MILK_TERMS, ...extraTerms.map(normalize)].some((t) => t && n.includes(t));
};

const formatDate = (raw: string | null) => {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
};

type Medication = MedicationDetail;

const RISK_CONFIG = {
  safe: {
    icon: CheckCircle,
    tone: "safe",
    surface: "bg-safe/10 border-safe/30",
    iconWrap: "bg-safe text-white",
    title: "text-safe-foreground",
    eyebrow: "Seguro para APLV",
    label: "Sem derivados do leite",
    description: "Não encontramos ingredientes derivados do leite de vaca na composição deste medicamento.",
    glow: "shadow-[0_1px_2px_hsl(var(--safe)/0.12),0_12px_32px_-12px_hsl(var(--safe)/0.45)]",
  },
  caution: {
    icon: AlertCircle,
    tone: "caution",
    surface: "bg-caution/10 border-caution/35",
    iconWrap: "bg-caution text-white",
    title: "text-caution-foreground",
    eyebrow: "Atenção",
    label: "Verifique com o farmacêutico",
    description: "Este medicamento tem ingredientes que podem conter traços de leite e precisam ser confirmados.",
    glow: "shadow-[0_1px_2px_hsl(var(--caution)/0.12),0_12px_32px_-12px_hsl(var(--caution)/0.45)]",
  },
  risk: {
    icon: AlertTriangle,
    tone: "risk",
    surface: "bg-risk/10 border-risk/35",
    iconWrap: "bg-risk text-white",
    title: "text-risk-foreground",
    eyebrow: "Não recomendado para APLV",
    label: "Contém derivados do leite",
    description: "Este medicamento contém ingredientes que podem causar reação em crianças com APLV.",
    glow: "shadow-[0_1px_2px_hsl(var(--risk)/0.12),0_12px_32px_-12px_hsl(var(--risk)/0.45)]",
  },
} as const;

/** Sombra em camadas, levemente tingida com a cor da marca */
const ELEVATED =
  "shadow-[0_1px_2px_hsl(var(--primary)/0.06),0_8px_24px_-8px_hsl(160_40%_15%/0.10)]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em] mb-3">{children}</p>
);

const MedicationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<SafeAlternative[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/dashboard");
      return;
    }

    const fetchMedication = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMedication(id);
        setMedication(data);
        recordMedicationView(id);
      } catch (err) {
        console.error("Erro ao carregar medicamento:", err);
        setError("Não foi possível carregar os detalhes do medicamento.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedication();
  }, [id, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("profile_type")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfileType(data?.profile_type ?? null));
  }, [user]);

  const isHealthProfessional = profileType !== null && HEALTH_PROFESSIONAL_TYPES.includes(profileType);

  const riskKey = medToRisk(medication?.tem_risco_aplv, medication?.nivel_alerta, medication?.avisos);

  // Sugere alternativas seguras quando o medicamento tem risco ou pede atenção
  useEffect(() => {
    setAlternatives([]);
    if (!medication || riskKey === "safe") return;
    let cancelled = false;
    setLoadingAlternatives(true);
    getSafeAlternatives(medication)
      .then((alts) => !cancelled && setAlternatives(alts))
      .catch((err) => console.error("Erro ao buscar alternativas:", err))
      .finally(() => !cancelled && setLoadingAlternatives(false));
    return () => {
      cancelled = true;
    };
  }, [medication, riskKey]);
  const risk = RISK_CONFIG[riskKey];
  const RiskIcon = risk.icon;

  const avisos = parseTextField(medication?.avisos ?? null);
  const termos = parseTextField(medication?.termos_encontrados ?? null);
  // "Nenhum termo..." vem do banco como texto, não como termo encontrado
  const termosReais = termos.filter((t) => !/^nenhum/i.test(t));
  const jaExibido = new Set(termosReais.map(normalize));
  const criticos = parseTextField(medication?.detalhes_criticos ?? null).filter((c) => !jaExibido.has(normalize(c)));
  const atencao = parseTextField(medication?.detalhes_atencao ?? null).filter((a) => !jaExibido.has(normalize(a)));
  const { ativos, excipientes } = medication?.composicao
    ? parseComposicao(medication.composicao)
    : { ativos: [], excipientes: [] };
  const excipientesLacteos = excipientes.filter((e) => isMilkDerived(e, termosReais));
  const dataAnalise = formatDate(medication?.data_extracao ?? null);

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh]">
          <Sidebar isDrawer={true} onClose={() => setSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>

      <main className="flex-1 lg:ml-64 w-full">
        <div className="w-full h-full px-4 py-4 md:p-6 lg:p-8 pb-28">
          <div className="w-full max-w-5xl mx-auto">
            {/* Topo */}
            <div className="flex items-center gap-3 mb-6 md:mb-8 animate-fade-in">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu"
                className={`lg:hidden p-2 rounded-xl bg-card ${ELEVATED} hover:bg-secondary active:scale-95 transition-transform ${focusRing}`}
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className={`group inline-flex items-center gap-2 rounded-full px-3 py-1.5 -ml-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary active:bg-secondary/70 transition-colors ${focusRing}`}
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-x-1" />
                Voltar para busca
              </button>
            </div>

            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-40 rounded-3xl" />
                <div className="grid lg:grid-cols-5 gap-6">
                  <Skeleton className="h-72 rounded-3xl lg:col-span-3" />
                  <Skeleton className="h-48 rounded-3xl lg:col-span-2" />
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-risk/10 flex items-center justify-center mb-5">
                  <AlertTriangle className="w-8 h-8 text-risk" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{error}</h3>
                <p className="text-sm text-muted-foreground mb-6">Tente novamente em instantes ou faça uma nova busca.</p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-105 active:scale-[0.98] transition-transform ${focusRing}`}
                >
                  Voltar para busca
                </button>
              </div>
            ) : medication ? (
              <div className="space-y-6">
                {/* Cabeçalho + veredito */}
                <section
                  className={`relative overflow-hidden rounded-3xl border bg-card ${risk.glow} animate-fade-in`}
                  aria-labelledby="med-nome"
                >
                  <div className="p-5 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-2xl bg-secondary flex items-center justify-center">
                        <Pill className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h1
                          id="med-nome"
                          className="text-2xl md:text-[2rem] font-extrabold text-foreground leading-tight tracking-[-0.03em] break-words"
                        >
                          {medication.nome_principal}
                        </h1>
                        {medication.nome_alternativo && (
                          <p className="text-sm md:text-base text-muted-foreground mt-1">{medication.nome_alternativo}</p>
                        )}
                        {medication.nome_completo && medication.nome_completo !== medication.nome_principal && (
                          <p className="text-xs text-muted-foreground/80 mt-1.5 leading-relaxed">{medication.nome_completo}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`border-t ${risk.surface} px-5 py-5 md:px-8 md:py-6`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-2xl flex items-center justify-center ${risk.iconWrap}`}>
                        <RiskIcon className="w-6 h-6" strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold uppercase tracking-[0.08em] ${risk.title} opacity-80`}>
                          {risk.eyebrow}
                        </p>
                        <h2 className={`text-lg md:text-xl font-extrabold ${risk.title} leading-snug tracking-[-0.02em]`}>
                          {risk.label}
                        </h2>
                        <p className={`text-sm ${risk.title} opacity-90 mt-1 leading-relaxed`}>{risk.description}</p>
                        {avisos.filter((a) => !/^status:/i.test(a)).length > 0 && (
                          <ul className={`mt-3 space-y-1 text-sm ${risk.title}`}>
                            {avisos
                              .filter((a) => !/^status:/i.test(a))
                              .map((a, i) => (
                                <li key={i} className="flex gap-2 leading-relaxed">
                                  <span aria-hidden className="mt-2 w-1 h-1 rounded-full bg-current shrink-0" />
                                  {a}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid lg:grid-cols-5 gap-6 items-start">
                  {/* Composição */}
                  <section className={`lg:col-span-3 rounded-3xl bg-card p-5 md:p-7 ${ELEVATED} animate-fade-in`}>
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <h2 className="text-lg md:text-xl font-extrabold text-foreground tracking-[-0.02em] flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-primary" />
                        Composição
                      </h2>
                      {excipientes.length > 0 && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            excipientesLacteos.length > 0 ? "bg-risk/15 text-risk-foreground" : "bg-safe/15 text-safe-foreground"
                          }`}
                        >
                          <Milk className="w-3.5 h-3.5" />
                          {excipientesLacteos.length > 0
                            ? `${excipientesLacteos.length} de origem láctea`
                            : "Nenhum de origem láctea"}
                        </span>
                      )}
                    </div>

                    {medication.composicao ? (
                      <div className="space-y-6">
                        {ativos.length > 0 && (
                          <div>
                            <SectionLabel>Princípio ativo</SectionLabel>
                            <div className="flex flex-wrap gap-2">
                              {ativos.map((item, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/25 text-sm font-semibold text-foreground leading-snug"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {excipientes.length > 0 && (
                          <div>
                            <SectionLabel>Excipientes ({excipientes.length})</SectionLabel>
                            <ul className="flex flex-wrap gap-2">
                              {excipientes.map((item, i) => {
                                const lacteo = isMilkDerived(item, termosReais);
                                return (
                                  <li
                                    key={i}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm leading-snug border ${
                                      lacteo
                                        ? "bg-risk/10 border-risk/40 text-risk-foreground font-semibold"
                                        : "bg-secondary/70 border-transparent text-foreground/80"
                                    }`}
                                  >
                                    {lacteo && <Milk className="w-3.5 h-3.5" aria-label="Origem láctea" />}
                                    {item}
                                  </li>
                                );
                              })}
                            </ul>
                            {excipientesLacteos.length > 0 && (
                              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                                <Milk className="w-3.5 h-3.5 text-risk" />
                                Destacados: ingredientes de origem láctea.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Composição detalhada não disponível. Consulte a bula original.
                      </p>
                    )}

                    {/* Resultado da verificação de termos */}
                    <div className="mt-6 pt-5 border-t border-border/60">
                      <SectionLabel>Ingredientes com leite encontrados</SectionLabel>
                      {termosReais.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {termosReais.map((t, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-risk/10 border border-risk/40 text-sm font-semibold text-risk-foreground"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/80 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-safe shrink-0" />
                          Nenhum ingrediente derivado do leite foi identificado na bula.
                        </p>
                      )}
                    </div>

                    {/* Análise da IA — oculta para farmacêuticos e médicos */}
                    {!isHealthProfessional && (criticos.length > 0 || atencao.length > 0) && (
                      <div className="mt-6 space-y-3">
                        {criticos.length > 0 && (
                          <div className="p-4 rounded-2xl bg-risk/10 border border-risk/30">
                            <p className="text-[11px] font-bold text-risk-foreground uppercase tracking-[0.08em] mb-1.5">
                              Pontos críticos
                            </p>
                            <div className="text-sm text-risk-foreground space-y-1 leading-relaxed">
                              {criticos.map((c, i) => <p key={i}>{c}</p>)}
                            </div>
                          </div>
                        )}
                        {atencao.length > 0 && (
                          <div className="p-4 rounded-2xl bg-caution/10 border border-caution/30">
                            <p className="text-[11px] font-bold text-caution-foreground uppercase tracking-[0.08em] mb-1.5">
                              Pontos de atenção
                            </p>
                            <div className="text-sm text-caution-foreground space-y-1 leading-relaxed">
                              {atencao.map((a, i) => <p key={i}>{a}</p>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Lateral */}
                  <aside className="lg:col-span-2 space-y-4 lg:sticky lg:top-8 animate-slide-in-right">
                    <div className={`rounded-3xl bg-card p-5 md:p-6 ${ELEVATED}`}>
                      <h2 className="text-base font-extrabold text-foreground tracking-[-0.01em] mb-1">Bula oficial</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        Confira a composição completa no documento original do fabricante.
                      </p>
                      <a
                        href={medication.arquivo_url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!medication.arquivo_url}
                        onClick={(e) => !medication.arquivo_url && e.preventDefault()}
                        className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-primary text-primary-foreground font-bold shadow-[0_1px_2px_hsl(var(--primary)/0.3),0_8px_20px_-8px_hsl(var(--primary)/0.7)] hover:brightness-105 active:scale-[0.98] transition-transform ${focusRing} aria-disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:shadow-none`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver bula original (PDF)
                      </a>
                      {dataAnalise && (
                        <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Bula analisada em {dataAnalise}
                        </p>
                      )}
                    </div>

                    <div className="rounded-3xl bg-caution/10 border border-caution/30 p-5 flex gap-3">
                      <Info className="w-5 h-5 text-caution-foreground shrink-0 mt-0.5" />
                      <p className="text-sm text-caution-foreground leading-relaxed">
                        <strong className="font-bold">Importante:</strong> esta análise usa dados públicos das bulas e
                        não substitui a orientação do médico ou farmacêutico. Confirme sempre antes de dar qualquer
                        medicamento.
                      </p>
                    </div>
                  </aside>
                </div>

                {riskKey !== "safe" && (
                  <section
                    aria-labelledby="alternativas-titulo"
                    className={`rounded-3xl bg-card p-5 md:p-7 ${ELEVATED} animate-fade-in`}
                  >
                    <div className="flex items-start gap-3 mb-5">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-safe/15 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-safe-foreground" />
                      </div>
                      <div>
                        <h2
                          id="alternativas-titulo"
                          className="text-lg md:text-xl font-extrabold text-foreground tracking-[-0.02em]"
                        >
                          Alternativas sem leite
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          Outros fabricantes com o mesmo princípio ativo, sem derivados do leite na bula.
                        </p>
                      </div>
                    </div>

                    {loadingAlternatives ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-[76px] rounded-2xl" />
                        ))}
                      </div>
                    ) : alternatives.length > 0 ? (
                      <>
                        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {alternatives.map((alt) => (
                            <li key={alt.id}>
                              <Link
                                to={`/medication/${alt.id}`}
                                className={`group h-full flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 hover:border-safe/50 hover:bg-safe/5 active:scale-[0.98] transition-[transform,background-color,border-color] duration-150 ${focusRing}`}
                              >
                                <div className="w-9 h-9 shrink-0 rounded-xl bg-safe/15 flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-safe-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-foreground leading-snug line-clamp-1">
                                    {alt.nome_principal}
                                  </p>
                                  {alt.nome_alternativo && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{alt.nome_alternativo}</p>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/60 transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:translate-x-1 group-hover:text-safe-foreground" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-4 text-xs text-muted-foreground leading-relaxed flex gap-1.5">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                          Dose, forma (comprimido, gotas, xarope) e indicação podem ser diferentes. Só troque o
                          medicamento com orientação do médico ou farmacêutico.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed rounded-2xl bg-secondary/60 p-4">
                        Não encontramos na nossa base outro medicamento seguro com o mesmo princípio ativo. Converse
                        com o médico ou farmacêutico sobre opções sem leite, como versões manipuladas.
                      </p>
                    )}
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <ChatWidget />
    </div>
  );
};

export default MedicationDetails;
