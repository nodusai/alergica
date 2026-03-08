import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, FileText, Pill, ExternalLink, Menu, AlertCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { getMedication, recordMedicationView, medToRisk, parseTextField, MedicationDetail } from "@/services/medications";

type Medication = MedicationDetail;

const RISK_CONFIG = {
  safe: {
    bg: "bg-safe/10",
    border: "border-safe/30",
    icon: CheckCircle,
    iconColor: "text-safe",
    titleColor: "text-safe-foreground",
    label: "Seguro — Sem derivados do leite",
    description: "Este medicamento não contém ingredientes derivados do leite de vaca.",
  },
  caution: {
    bg: "bg-caution/10",
    border: "border-caution/30",
    icon: AlertCircle,
    iconColor: "text-caution",
    titleColor: "text-caution-foreground",
    label: "Atenção — Verificar com farmacêutico",
    description: "Este medicamento pode conter ingredientes que requerem verificação.",
  },
  risk: {
    bg: "bg-risk/10",
    border: "border-risk/30",
    icon: AlertTriangle,
    iconColor: "text-risk",
    titleColor: "text-risk-foreground",
    label: "Risco — Contém derivados do leite",
    description: "Este medicamento contém ingredientes que podem causar reação em crianças com APLV.",
  },
};

const MedicationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const riskKey = medToRisk(medication?.tem_risco_aplv, medication?.nivel_alerta, medication?.avisos);
  const riskConfig = RISK_CONFIG[riskKey];
  const RiskIcon = riskConfig.icon;

  const avisos = parseTextField(medication?.avisos ?? null);
  const termos = parseTextField(medication?.termos_encontrados ?? null);
  const criticos = parseTextField(medication?.detalhes_criticos ?? null);
  const atencao = parseTextField(medication?.detalhes_atencao ?? null);

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
        <div className="w-full h-full p-4 md:p-6 lg:p-8 pb-28">
          <div className="w-full max-w-4xl lg:max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-10 animate-fade-in">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md bg-card"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>← Voltar para busca</span>
              </button>
            </div>

            {loading ? (
              <div className="grid lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                <div className="space-y-4">
                  <Skeleton className="aspect-square max-w-xs rounded-2xl" />
                  <Skeleton className="h-8 w-3/4 rounded-lg" />
                  <Skeleton className="h-5 w-1/2 rounded-lg" />
                  <Skeleton className="h-24 rounded-2xl" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-7 w-1/2 rounded-lg" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <AlertTriangle className="w-12 h-12 text-risk mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">{error}</h3>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="mt-4 px-6 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                  Voltar para busca
                </button>
              </div>
            ) : medication ? (
              <div className="grid lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                {/* Left Column */}
                <div className="space-y-4 md:space-y-6 animate-fade-in">
                  <div className="aspect-square max-w-full md:max-w-xs bg-secondary rounded-lg md:rounded-2xl flex items-center justify-center">
                    <Pill className="w-20 h-20 md:w-24 md:h-24 text-muted-foreground/40" />
                  </div>

                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                      {medication.nome_principal}
                    </h1>
                    {medication.nome_alternativo && (
                      <p className="text-sm text-muted-foreground mb-1">{medication.nome_alternativo}</p>
                    )}
                    {medication.nome_completo && medication.nome_completo !== medication.nome_principal && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{medication.nome_completo}</p>
                    )}
                  </div>

                  {/* Risk box */}
                  <div className={`p-4 md:p-5 rounded-lg md:rounded-2xl ${riskConfig.bg} border-2 ${riskConfig.border}`}>
                    <div className="flex items-start gap-3">
                      <RiskIcon className={`w-5 h-5 md:w-6 md:h-6 ${riskConfig.iconColor} flex-shrink-0 mt-0.5`} />
                      <div>
                        <h3 className={`font-bold ${riskConfig.titleColor} text-base md:text-lg`}>
                          {riskConfig.label}
                        </h3>
                        <div className={`text-sm ${riskConfig.titleColor}/80 mt-1 space-y-1`}>
                          {avisos.length > 0
                            ? avisos.map((a, i) => <p key={i}>{a}</p>)
                            : <p>{riskConfig.description}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {termos.length > 0 && (
                    <div className="p-4 rounded-xl bg-secondary/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Termos identificados
                      </p>
                      <div className="text-sm text-foreground space-y-1">
                        {termos.map((t, i) => <p key={i}>{t}</p>)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4 md:space-y-6 animate-slide-in-right">
                  <div className="card-soft">
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
                      <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      Análise da Composição
                    </h2>

                    {medication.composicao ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {medication.composicao}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Composição detalhada não disponível.
                      </p>
                    )}

                    {criticos.length > 0 && (
                      <div className="mt-4 p-4 rounded-xl bg-risk/10 border border-risk/30">
                        <p className="text-xs font-semibold text-risk uppercase tracking-wide mb-1">
                          Detalhes críticos
                        </p>
                        <div className="text-sm text-risk-foreground space-y-1">
                          {criticos.map((c, i) => <p key={i}>{c}</p>)}
                        </div>
                      </div>
                    )}

                    {atencao.length > 0 && (
                      <div className="mt-4 p-4 rounded-xl bg-caution/10 border border-caution/30">
                        <p className="text-xs font-semibold text-caution uppercase tracking-wide mb-1">
                          Detalhes de atenção
                        </p>
                        <div className="text-sm text-caution-foreground space-y-1">
                          {atencao.map((a, i) => <p key={i}>{a}</p>)}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => medication.arquivo_url && window.open(medication.arquivo_url, "_blank")}
                      disabled={!medication.arquivo_url}
                      className="mt-6 w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Visualizar Bula Original (PDF)
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-caution/10 border border-caution/30">
                    <p className="text-sm text-caution-foreground">
                      <strong>Nota:</strong> Esta análise é baseada em dados públicos.
                      Sempre consulte a bula oficial e seu médico antes de administrar
                      qualquer medicamento.
                    </p>
                  </div>
                </div>
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
