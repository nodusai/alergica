import { useState, useEffect } from "react";
import { BookOpen, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

type Slide = {
  titulo: string;
  mensagem: string;
  referencia: string;
  url?: string;
  isNews?: boolean;
};

const aplvInfoData = [
  {
    titulo: "Medicamentos podem conter proteína do leite",
    mensagem: "Cerca de 23% dos medicamentos contêm lactose ou derivados do leite como excipientes. Sempre verifique a composição dos remédios com seu médico ou farmacêutico antes de administrar ao bebê ou consumir durante a amamentação.",
    referencia: "Estudo português - Excipientes presentes em medicamentos e alergia à proteína do leite de vaca (RCAAP, Portugal)"
  },
  {
    titulo: "A maioria das crianças supera a APLV",
    mensagem: "Cerca de 50% dos bebês com APLV melhoram após 1 ano, e mais de 75% superam a alergia até os 3 anos de idade. Mantenha o acompanhamento médico para avaliar a reintrodução segura do leite.",
    referencia: "Nestlé Health Science Brasil e CONITEC - Ministério da Saúde"
  },
  {
    titulo: "Mãe que amamenta também precisa fazer dieta de exclusão",
    mensagem: "Se o bebê tem APLV e é amamentado, a mãe deve eliminar leite e derivados da sua alimentação, pois pequenas quantidades da proteína podem passar pelo leite materno. A suplementação de cálcio e vitamina D é essencial.",
    referencia: "CONITEC 2022 e Clínica Pró-Saúde"
  },
  {
    titulo: "Cuidados em festas e escolas são essenciais",
    mensagem: "Sempre informe professores, cuidadores e responsáveis por festas sobre a APLV do seu filho. Leve alimentos seguros para a criança e oriente que ela não deve aceitar comida de outras pessoas sem sua autorização.",
    referencia: "Alergiaaoleitedevaca.com.br e Pediatria Descomplicada"
  },
  {
    titulo: "APLV não é o mesmo que intolerância à lactose",
    mensagem: "APLV é uma reação do sistema imunológico às proteínas do leite, enquanto intolerância à lactose é a dificuldade de digerir o açúcar do leite. São condições diferentes com tratamentos distintos.",
    referencia: "Alergiaaoleitedevaca.com.br e Nestlé Health Science"
  },
  {
    titulo: "Atenção aos rótulos: leite pode estar escondido",
    mensagem: "Leite e derivados podem aparecer nos rótulos como: caseína, lactoglobulina, lactoalbumina, soro de leite, whey protein. Sempre leia os rótulos completos e evite produtos com 'pode conter traços de leite'.",
    referencia: "Clínica Pró-Saúde e Material Danone Nutricia"
  },
  {
    titulo: "Contaminação cruzada é um risco real",
    mensagem: "Utensílios, tábuas de corte e até máquinas industriais podem conter traços de leite. Em casa, separe utensílios. Em padarias e supermercados, peça para fatiar alimentos longe de queijos e derivados.",
    referencia: "Pediatria Descomplicada"
  },
  {
    titulo: "Sintomas podem ser imediatos ou tardios",
    mensagem: "As reações podem surgir em minutos (urticária, vômitos, até choque anafilático) ou dias depois (cólicas, diarreia, sangue nas fezes). Conheça os sintomas do seu filho e mantenha medicações de emergência sempre à mão.",
    referencia: "Alergiaaoleitedevaca.com.br e CONITEC"
  },
  {
    titulo: "Cosméticos também podem conter leite",
    mensagem: "Sabonetes, shampoos e cremes podem ter proteínas do leite na composição. Para crianças com reações cutâneas, verifique sempre os rótulos de produtos de higiene e beleza.",
    referencia: "Clínica Pró-Saúde e Neocenter"
  },
  {
    titulo: "Aleitamento materno pode continuar com APLV",
    mensagem: "O leite materno é a melhor opção mesmo com APLV. A mãe deve seguir dieta de exclusão rigorosa, mas pode e deve continuar amamentando. O leite materno oferece proteção e nutrição ideal para o bebê.",
    referencia: "CONITEC 2022 e Ministério da Saúde"
  }
];

const APLVInfoCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(aplvInfoData);
  const [refreshing, setRefreshing] = useState(false);
  const { isAdmin } = useAuth();

  /** Normaliza artigos brutos da NewsAPI para o formato Slide */
  const normalizeArticles = (articles: any[]): Slide[] =>
    articles
      .filter((a: any) => a.url && a.title && !a.title.includes("[Removed]"))
      .slice(0, 10)
      .map((a: any) => ({
        titulo: a.title,
        mensagem: a.description ?? "",
        referencia: `${a.source?.name ?? a.source ?? ""} · ${a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("pt-BR") : ""}`,
        url: a.url,
        isNews: true,
      }));

  /** Fallback: chama NewsAPI direto via proxy Vite quando o backend Python está offline */
  const fetchNewsDirect = async (): Promise<Slide[]> => {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY as string | undefined;
    if (!apiKey) return [];

    const queries = [
      { q: "APLV bebê leite", language: "pt" },
      { q: "MSPI baby milk allergy", language: "en" },
    ];

    const seen = new Set<string>();
    const articles: any[] = [];

    for (const q of queries) {
      const params = new URLSearchParams({
        q: q.q,
        language: q.language,
        sortBy: "publishedAt",
        pageSize: "5",
        apiKey,
      });
      try {
        const res = await fetch(`/newsapi/v2/everything?${params}`);
        if (!res.ok) continue;
        const data = await res.json();
        for (const a of data.articles ?? []) {
          if (a.url && !seen.has(a.url)) {
            seen.add(a.url);
            articles.push(a);
          }
        }
      } catch {
        continue;
      }
    }

    return normalizeArticles(articles);
  };

  const fetchNews = async () => {
    try {
      // 1ª tentativa: backend Python
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const newsSlides: Slide[] = data.map((a: any) => ({
            titulo: a.title,
            mensagem: a.description ?? "",
            referencia: `${a.source} · ${new Date(a.publishedAt).toLocaleDateString("pt-BR")}`,
            url: a.url,
            isNews: true,
          }));
          setSlides([...newsSlides, ...aplvInfoData]);
          return;
        }
      }

      // 2ª tentativa: NewsAPI direto via proxy Vite
      const directSlides = await fetchNewsDirect();
      if (directSlides.length > 0) {
        setSlides([...directSlides, ...aplvInfoData]);
      }
    } catch (err) {
      console.error("fetchNews error", err);
      // mantém slides estáticos como fallback final
    }
  };

  const refreshNews = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="mb-6 md:mb-8 lg:mb-10 animate-fade-in" style={{ animationDelay: "0.05s" }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-5 gap-2 md:gap-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" />
          </div>
          <h3 className="text-xs md:text-base lg:text-lg font-bold text-foreground">
            Notícias
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground self-end md:self-auto">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNews}
              disabled={refreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <span>{current + 1}</span>
          <span>/</span>
          <span>{count}</span>
        </div>
      </div>

      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {slides.map((item, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full group"
                >
                  <Card className="card-soft h-full border-primary/10 bg-gradient-to-br from-card to-secondary/30 cursor-pointer transition-all duration-200 group-hover:border-primary/30 group-hover:shadow-md">
                    <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col h-full">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary mb-1">Notícia</span>
                      <h4 className="text-sm md:text-base lg:text-lg font-bold text-foreground mb-2 md:mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {item.titulo}
                      </h4>
                      <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-3 md:mb-4 flex-1 line-clamp-4">
                        {item.mensagem}
                      </p>
                      <div className="pt-3 md:pt-4 border-t border-border/50 flex items-end justify-between gap-2">
                        <p className="text-xs text-muted-foreground/80 italic">
                          🗞️ {item.referencia}
                        </p>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-primary/50 group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ) : (
                <Card className="card-soft h-full border-primary/10 bg-gradient-to-br from-card to-secondary/30">
                  <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col h-full">
                    <h4 className="text-sm md:text-base lg:text-lg font-bold text-foreground mb-2 md:mb-3 line-clamp-2">
                      {item.titulo}
                    </h4>
                    <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-3 md:mb-4 flex-1 line-clamp-4">
                      {item.mensagem}
                    </p>
                    <div className="pt-3 md:pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground/80 italic">
                        📚 {item.referencia}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex items-center justify-center gap-2 mt-6">
          <CarouselPrevious className="static translate-y-0 bg-card border-primary/20 hover:bg-primary/10 hover:border-primary/40" />
          <div className="flex gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? "bg-primary w-6"
                    : "bg-primary/30 hover:bg-primary/50"
                }`}
                onClick={() => api?.scrollTo(index)}
              />
            ))}
          </div>
          <CarouselNext className="static translate-y-0 bg-card border-primary/20 hover:bg-primary/10 hover:border-primary/40" />
        </div>
      </Carousel>
    </section>
  );
};

export default APLVInfoCarousel;
