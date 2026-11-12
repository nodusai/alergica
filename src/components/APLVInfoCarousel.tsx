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
import { getRecentStudies, type Study } from "@/services/studies";

type Slide = {
  titulo: string;
  mensagem: string;
  referencia: string;
  url: string;
  /** Etiqueta exibida acima do título */
  tag: string;
  isStudy?: boolean;
};

/**
 * Conteúdo educativo fixo. Cada item resume uma fonte real e verificável
 * (diretriz, consenso, norma ou estudo publicado) e linka para ela.
 */
const aplvInfoData: Slide[] = ([
  {
    titulo: "Medicamentos podem ter derivados do leite",
    mensagem:
      "Um levantamento publicado em 2024 encontrou excipientes derivados do leite (como lactose) em 62,6% dos antiasmáticos e 39% dos anti-inflamatórios analisados. Confira a bula e consulte o farmacêutico.",
    referencia: "Scientific Reports, 2024 — Risks of dairy derived excipients in medications",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11228012/",
  },
  {
    titulo: "Lactose pode vir contaminada com proteína do leite",
    mensagem:
      "A lactose usada em remédios pode conter traços de proteína do leite. Há relatos de reações com inaladores em pó, vacina oral contra pólio e probióticos em pessoas com APLV.",
    referencia: "Annals of Medicine, 2021 — Milk related excipients in medications",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8480826/",
  },
  {
    titulo: "A maioria das crianças supera a APLV",
    mensagem:
      "Grande parte das crianças desenvolve tolerância nos primeiros anos de vida. A reintrodução do leite deve ser testada periodicamente, sempre com acompanhamento médico.",
    referencia: "Consenso Brasileiro sobre Alergia Alimentar 2018 — SBP e ASBAI",
    url: "https://www.sbp.com.br/imprensa/detalhe/nid/sbp-e-asbai-publicam-atualizacao-do-consenso-brasileiro-sobre-alergia-alimentar",
  },
  {
    titulo: "Mãe que amamenta faz a dieta de exclusão",
    mensagem:
      "Quando o bebê com APLV é amamentado, a mãe deve excluir leite e derivados da própria dieta. Nesse caso, recomenda-se suplementação de cálcio e vitamina D para a mãe.",
    referencia: "Consenso Brasileiro sobre Alergia Alimentar 2018 — Parte 2 (SBP/ASBAI)",
    url: "https://www.sbp.com.br/flip/consenso-alergia-alimentar-parte-02/21/",
  },
  {
    titulo: "Sintomas podem ser imediatos ou tardios",
    mensagem:
      "Nas reações mediadas por IgE, os sintomas aparecem em minutos e podem chegar à anafilaxia. Nas não mediadas por IgE, surgem horas ou dias depois, com sintomas gastrointestinais, por exemplo.",
    referencia: "Consenso Brasileiro sobre Alergia Alimentar 2018 — Parte 1 (SBP/ASBAI)",
    url: "https://portaldeboaspraticas.iff.fiocruz.br/biblioteca/consenso-brasileiro-sobre-alergia-alimentar-2018-parte-1-etiopatogenia-clinica",
  },
  {
    titulo: "Leia os avisos de alergênicos no rótulo",
    mensagem:
      "No Brasil, alimentos embalados devem informar \"ALÉRGICOS: CONTÉM LEITE\" ou \"PODE CONTER LEITE\" (risco de contaminação cruzada). Para APLV, os dois avisos indicam que o produto deve ser evitado.",
    referencia: "Anvisa — Rotulagem de alimentos alergênicos (RDC 26/2015, atualizada pela RDC 727/2022)",
    url: "https://bibliotecadigital.anvisa.gov.br/jspui/bitstream/anvisa/213/1/Rotulagem%20de%20alimentos%20alerg%c3%aanicos_5ed_2017.pdf",
  },
  {
    titulo: "APLV não é intolerância à lactose",
    mensagem:
      "Intolerância à lactose é a dificuldade de digerir o açúcar do leite. APLV é uma reação do sistema imunológico à proteína. Produtos \"zero lactose\" continuam tendo proteína do leite e não são seguros para APLV.",
    referencia: "Anvisa — Perguntas e respostas sobre rotulagem de lactose (2017)",
    url: "https://bibliotecadigital.anvisa.gov.br/jspui/bitstream/anvisa/214/1/Rotulagem%20de%20lactose_2017.pdf",
  },
  {
    titulo: "Leite de cabra não é alternativa",
    mensagem:
      "A diretriz internacional da World Allergy Organization não recomenda leite de outros mamíferos (como cabra ou ovelha) na APLV, por causa da reatividade cruzada e de questões nutricionais.",
    referencia: "WAO DRACMA Guideline, atualização XVI — WAO Journal, 2024",
    url: "https://doi.org/10.1016/j.waojou.2024.100931",
  },
  {
    titulo: "Qual fórmula usar quando não há amamentação",
    mensagem:
      "Para bebês com APLV que não são amamentados, a diretriz da WAO sugere fórmula extensamente hidrolisada (ou hidrolisada de arroz) como primeira opção. As de aminoácidos e de soja vêm como segunda e terceira opções.",
    referencia: "WAO DRACMA Guideline, atualização XII — WAO Journal, 2024",
    url: "https://doaj.org/article/285a6288c5ed4634bb1fb844db9e157c",
  },
  {
    titulo: "O SUS oferece fórmulas para APLV",
    mensagem:
      "Desde 2018, fórmulas à base de soja, extensamente hidrolisadas e de aminoácidos foram incorporadas ao SUS para crianças de 0 a 24 meses com APLV. Procure a unidade de saúde com a prescrição.",
    referencia: "CONITEC/Ministério da Saúde — Portaria SCTIE nº 67/2018",
    url: "https://www.gov.br/conitec/pt-br/midias/relatorios/2018/recomendacao/relatorio_formulasnutricionais_aplv.pdf",
  },
] satisfies Omit<Slide, "tag">[]).map((s) => ({ ...s, tag: "Fonte científica" }));

const formatDate = (iso?: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "";

const CATEGORY_LABEL: Record<Study["category"], { tag: string; tema: string }> = {
  formulas: { tag: "Estudo · Fórmulas", tema: "fórmulas infantis para APLV" },
  medicamentos: { tag: "Estudo · Medicamentos", tema: "medicamentos e vacinas em pessoas com APLV" },
};

const studyToSlide = (s: Study): Slide => ({
  titulo: s.title,
  mensagem: `Sobre ${CATEGORY_LABEL[s.category].tema}${s.journal ? `. Revista ${s.journal}` : ""}. Artigo em inglês.`,
  referencia: ["PubMed", formatDate(s.publishedAt), s.translated ? "tradução automática" : ""].filter(Boolean).join(" · "),
  url: s.url,
  tag: CATEGORY_LABEL[s.category].tag,
  isStudy: true,
});

const APLVInfoCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(aplvInfoData);
  const [refreshing, setRefreshing] = useState(false);
  const { isAdmin } = useAuth();

  const fetchNews = async () => {
    try {
      const studies = await getRecentStudies();
      if (studies.length > 0) setSlides([...studies.map(studyToSlide), ...aplvInfoData]);
    } catch (err) {
      console.error("Erro ao buscar estudos:", err);
      // mantém o conteúdo educativo como fallback
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

    const update = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <section className="mb-10 md:mb-12 animate-fade-in" style={{ animationDelay: "0.05s" }} aria-labelledby="estudos-titulo">
      <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="w-full">
        <div className="flex items-end justify-between gap-4 mb-4 md:mb-5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 id="estudos-titulo" className="text-lg md:text-xl font-extrabold text-foreground tracking-[-0.02em]">
                Estudos e informações
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pesquisas recentes sobre fórmulas e medicamentos na APLV.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshNews}
                disabled={refreshing}
                className="h-8 w-8 p-0"
                aria-label="Atualizar estudos"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
            <span className="hidden sm:inline text-xs font-semibold text-muted-foreground tabular-nums mr-1" aria-live="polite">
              {current + 1} / {count}
            </span>
            <CarouselPrevious className="static translate-y-0 h-9 w-9 bg-card border-border hover:bg-primary/10 hover:border-primary/40 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary" />
            <CarouselNext className="static translate-y-0 h-9 w-9 bg-card border-border hover:bg-primary/10 hover:border-primary/40 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary" />
          </div>
        </div>

        <CarouselContent className="-ml-3 md:-ml-4">
          {slides.map((item, index) => (
            <CarouselItem key={item.url + index} className="pl-3 md:pl-4 basis-[88%] sm:basis-1/2 lg:basis-1/3">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full group rounded-2xl active:scale-[0.98] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="h-full rounded-2xl border-border/60 bg-card shadow-[0_1px_2px_hsl(var(--primary)/0.06),0_8px_24px_-12px_hsl(160_40%_15%/0.12)] transition-colors duration-200 group-hover:border-primary/40">
                  <CardContent className="p-5 flex flex-col h-full">
                    <span
                      className={`self-start inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] mb-3 ${
                        item.isStudy ? "bg-primary/15 text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {item.tag}
                    </span>
                    <h4 className="text-[15px] md:text-base font-bold text-foreground leading-snug tracking-[-0.01em] mb-2 line-clamp-3">
                      {item.titulo}
                    </h4>
                    <p className="text-muted-foreground text-[13px] leading-relaxed flex-1 line-clamp-3">
                      {item.mensagem}
                    </p>
                    <div className="pt-3 mt-4 border-t border-border/50 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.referencia}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-foreground/80 group-hover:text-foreground shrink-0">
                        Ler
                        <ExternalLink className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default APLVInfoCarousel;
