import { AlertTriangle, CheckCircle, FileText, Pill, ExternalLink, Menu, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Medication {
  id: string;
  nome_principal: string | null;
  nome_alternativo: string | null;
  nome_completo: string | null;
  composicao: string | null;
  tem_risco_aplv: boolean | null;
  nivel_alerta: string | null;
  termos_encontrados: string[] | null;
  avisos: string[] | null;
  detalhes_criticos: string[] | null;
  detalhes_atencao: string[] | null;
  arquivo_url: string | null;
}

const MedicationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedication = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setMedication(data as unknown as Medication);
        // Increment access count
        await supabase
          .from("medications")
          .update({ access_count: (data.access_count || 0) + 1 })
          .eq("id", id);
      }
      setLoading(false);
    };
    fetchMedication();
  }, [id]);

  // Parse composicao into ingredient list
  const parseIngredients = (composicao: string | null, criticos: string[] | null, atencao: string[] | null) => {
    if (!composicao) return [];
    const parts = composicao
      .replace(/^\.?\s*Excipientes:\s*/i, "")
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);

    const criticalTerms = (criticos || []).join(" ").toLowerCase();
    const cautionTerms = (atencao || []).join(" ").toLowerCase();

    return parts.map((name) => {
      const lower = name.toLowerCase();
      const isCritical = criticalTerms.includes(lower) || criticalTerms.includes("lactose") && lower.includes("lactose");
      const isCaution = cautionTerms.includes(lower);
      if (isCritical) return { name, safe: false, warning: "Derivado do leite" };
      if (isCaution) return { name, safe: false, warning: "Atenção" };
      return { name, safe: true };
    });
  };

  const alertColor = medication?.nivel_alerta === "VERDE" ? "safe" : medication?.nivel_alerta === "AMARELO" ? "caution" : "risk";

  const alertLabel =
    medication?.nivel_alerta === "VERDE"
      ? "SEGURO: Sem derivados de leite detectados"
      : medication?.nivel_alerta === "AMARELO"
        ? "ATENÇÃO: Verificar composição com cuidado"
        : "ALERTA: Contém Excipientes Derivados do Leite";

  const ingredients = medication ? parseIngredients(medication.composicao, medication.detalhes_criticos as string[] | null, medication.detalhes_atencao as string[] | null) : [];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh]">
          <Sidebar isDrawer={true} onClose={() => setSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>

      <main className="flex-1 lg:ml-64 w-full">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
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
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !medication ? (
              <div className="text-center py-20 text-muted-foreground">
                Medicamento não encontrado.
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                {/* Left Column */}
                <div className="space-y-4 md:space-y-6 animate-fade-in">
                  <div className="aspect-square max-w-full md:max-w-xs bg-secondary rounded-lg md:rounded-2xl flex items-center justify-center">
                    <Pill className="w-20 h-20 md:w-24 md:h-24 text-muted-foreground/40" />
                  </div>

                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {medication.nome_principal || medication.nome_completo || "Sem nome"}
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground">
                      {medication.nome_alternativo || "Laboratório não informado"}
                    </p>
                  </div>

                  {/* Risk Status */}
                  <div className={`p-4 md:p-5 rounded-lg md:rounded-2xl border-2 ${
                    alertColor === "safe"
                      ? "bg-safe/10 border-safe/30"
                      : alertColor === "caution"
                        ? "bg-caution/10 border-caution/30"
                        : "bg-risk/10 border-risk/30"
                  }`}>
                    <div className="flex items-start gap-3">
                      {alertColor === "safe" ? (
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-safe flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 mt-0.5 ${alertColor === "caution" ? "text-caution" : "text-risk"}`} />
                      )}
                      <div>
                        <h3 className={`font-bold text-base md:text-lg ${
                          alertColor === "safe" ? "text-safe-foreground" : alertColor === "caution" ? "text-caution-foreground" : "text-risk-foreground"
                        }`}>
                          {alertLabel}
                        </h3>
                        {medication.avisos && (medication.avisos as string[]).length > 0 && (
                          <p className={`text-sm mt-1 ${
                            alertColor === "safe" ? "text-safe-foreground/80" : alertColor === "caution" ? "text-caution-foreground/80" : "text-risk-foreground/80"
                          }`}>
                            {(medication.avisos as string[])[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 md:space-y-6 animate-slide-in-right">
                  <div className="card-soft">
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
                      <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      Análise da Composição e Excipientes
                    </h2>

                    {ingredients.length > 0 ? (
                      <div className="space-y-3">
                        {ingredients.map((ingredient, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 md:p-4 rounded-lg md:rounded-xl transition-colors ${
                              ingredient.safe
                                ? "bg-secondary/50"
                                : "bg-risk/10 border border-risk/30"
                            }`}
                          >
                            <div className="flex items-center gap-2 md:gap-3">
                              {!ingredient.safe && (
                                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-risk flex-shrink-0" />
                              )}
                              <span
                                className={`font-medium ${
                                  ingredient.safe
                                    ? "text-muted-foreground"
                                    : "text-risk-foreground font-bold"
                                }`}
                              >
                                {ingredient.name}
                              </span>
                            </div>
                            {!ingredient.safe && (
                              <span className="text-xs md:text-sm text-risk-foreground/80">
                                {ingredient.warning}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Composição não disponível.</p>
                    )}

                    {medication.arquivo_url && (
                      <button className="mt-6 w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                        Visualizar Bula Original (PDF)
                      </button>
                    )}
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
            )}
          </div>
        </div>
      </main>

      <ChatWidget />
    </div>
  );
};

export default MedicationDetails;
