import { AlertTriangle, FileText, Pill, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";

// Mock ingredient data
const mockIngredients = [
  { name: "Dipirona Sódica", safe: true },
  { name: "Sacarina Sódica", safe: true },
  { name: "Água Purificada", safe: true },
  { name: "Lactose Monohidratada", safe: false, warning: "Derivado do leite" },
  { name: "Estearato de Magnésio", safe: false, warning: "Pode conter traços de leite" },
  { name: "Aroma de Framboesa", safe: true },
  { name: "Corante Amarelo", safe: true },
];

const MedicationDetails = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar with Meu Perfil active */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <span>← Voltar para busca</span>
          </button>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Product Overview */}
            <div className="space-y-6 animate-fade-in">
              {/* Product Image Placeholder */}
              <div className="aspect-square max-w-xs bg-secondary rounded-2xl flex items-center justify-center">
                <Pill className="w-24 h-24 text-muted-foreground/40" />
              </div>

              {/* Product Title */}
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Dipirona Sódica Gotas
                </h1>
                <p className="text-muted-foreground">Laboratório Medley</p>
              </div>

              {/* Risk Status Summary Box */}
              <div className="p-5 rounded-2xl bg-risk/10 border-2 border-risk/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-risk flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-risk-foreground text-lg">
                      ALERTA: Contém Excipientes Derivados do Leite
                    </h3>
                    <p className="text-risk-foreground/80 text-sm mt-1">
                      Este medicamento contém ingredientes que podem causar reação em crianças com APLV.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Composition Analysis */}
            <div className="space-y-6 animate-slide-in-right">
              <div className="card-soft">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Análise da Composição e Excipientes
                </h2>

                {/* Ingredients List */}
                <div className="space-y-3">
                  {mockIngredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                        ingredient.safe 
                          ? "bg-secondary/50" 
                          : "bg-risk/10 border border-risk/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {!ingredient.safe && (
                          <AlertTriangle className="w-5 h-5 text-risk flex-shrink-0" />
                        )}
                        <span className={`font-medium ${
                          ingredient.safe 
                            ? "text-muted-foreground" 
                            : "text-risk-foreground font-bold"
                        }`}>
                          {ingredient.name}
                        </span>
                      </div>
                      {!ingredient.safe && (
                        <span className="text-sm text-risk-foreground/80 bg-risk/10 px-3 py-1 rounded-full">
                          {ingredient.warning}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* View Original Bula Button */}
                <button className="mt-6 w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors">
                  <ExternalLink className="w-5 h-5" />
                  Visualizar Bula Original (PDF)
                </button>
              </div>

              {/* Info Note */}
              <div className="p-5 rounded-2xl bg-caution/10 border border-caution/30">
                <p className="text-sm text-caution-foreground">
                  <strong>Nota:</strong> Esta análise é baseada em dados públicos. 
                  Sempre consulte a bula oficial e seu médico antes de administrar qualquer medicamento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ChatWidget />
    </div>
  );
};

export default MedicationDetails;
