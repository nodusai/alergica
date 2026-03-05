import { Heart, Shield, Pill, Search, Baby, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import mascot from "@/assets/mascot.png";

const profiles = [
  { icon: "💗", label: "Mamãe", desc: "Mães de crianças alérgicas" },
  { icon: "👶", label: "Papai", desc: "Pais de crianças alérgicas" },
  { icon: "💊", label: "Farmacêutica(o)", desc: "Verificação de medicamentos" },
  { icon: "🩺", label: "Médico(a)", desc: "Orientação a pacientes" },
];

const features = [
  { icon: Pill, title: "Medicamentos", desc: "Verifique se medicamentos são seguros para alérgicos" },
  { icon: Search, title: "Busca Inteligente", desc: "Encontre informações rapidamente com classificação por cores" },
  { icon: Shield, title: "Classificação de Risco", desc: "Sistema visual verde, amarelo e vermelho" },
  { icon: Baby, title: "Gerenciar Bebês", desc: "Cadastre e acompanhe o perfil de alergias dos seus filhos" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/30" />
        <div className="container relative mx-auto flex flex-col items-center text-center">
          <img
            src={mascot}
            alt="AlerGica Mascote"
            className="mb-6 h-32 w-32 animate-float drop-shadow-lg md:h-40 md:w-40"
          />
          <h1 className="animate-fade-in-up font-heading text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
            Aler<span className="text-gradient-primary">Gica</span>
          </h1>
          <p className="mt-4 max-w-xl animate-fade-in-up text-lg text-muted-foreground" style={{ animationDelay: "0.15s" }}>
            Plataforma inteligente para gerenciamento de alergias alimentares.
            Segurança e praticidade para sua família.
          </p>
          <div className="mt-8 flex gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" className="gap-2 rounded-full bg-primary font-bold text-primary-foreground shadow-lg hover:bg-primary/90">
              Começar agora
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full font-semibold">
              Saiba mais
            </Button>
          </div>
        </div>
      </section>

      {/* Risk Legend */}
      <section className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { color: "bg-safe", label: "Seguro", text: "text-safe-foreground" },
            { color: "bg-caution", label: "Atenção", text: "text-caution-foreground" },
            { color: "bg-risk", label: "Risco", text: "text-risk-foreground" },
          ].map((item) => (
            <div key={item.label} className={`${item.color} ${item.text} rounded-full px-5 py-2 text-sm font-bold shadow-md`}>
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Profiles */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <h2 className="mb-2 text-center font-heading text-2xl font-extrabold text-foreground md:text-3xl">
          Para quem é o AlerGica?
        </h2>
        <p className="mb-10 text-center text-muted-foreground">
          Criado para quem convive diariamente com alergias alimentares
        </p>
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {profiles.map((p) => (
            <div key={p.label} className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <span className="text-4xl">{p.icon}</span>
              <span className="mt-2 font-heading text-sm font-bold text-card-foreground">{p.label}</span>
              <span className="mt-1 text-center text-xs text-muted-foreground">{p.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/50 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center font-heading text-2xl font-extrabold text-foreground md:text-3xl">
            Funcionalidades
          </h2>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-card-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center">
        <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          Feito com <Heart className="h-4 w-4 text-risk" /> para famílias que convivem com alergias alimentares
        </p>
      </footer>
    </div>
  );
};

export default Index;
