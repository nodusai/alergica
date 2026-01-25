import { Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MedicationCard from "@/components/MedicationCard";

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
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header with Search */}
          <div className="mb-10 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Olá, Maria! 👋
            </h2>
            
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

          {/* Results Section */}
          <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h3 className="text-lg font-bold text-foreground mb-5">
              Resultados Recentes
            </h3>
            
            {/* Medication Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mockMedications.map((med, index) => (
                <div 
                  key={med.id} 
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <MedicationCard
                    name={med.name}
                    laboratory={med.laboratory}
                    riskLevel={med.riskLevel}
                    riskText={med.riskText}
                  />
                </div>
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
    </div>
  );
};

export default Dashboard;
