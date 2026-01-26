import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

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

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="mb-10 animate-fade-in" style={{ animationDelay: "0.05s" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Informações sobre APLV
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
        <CarouselContent className="-ml-4">
          {aplvInfoData.map((item, index) => (
            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/2">
              <Card className="card-soft h-full border-primary/10 bg-gradient-to-br from-card to-secondary/30">
                <CardContent className="p-6 flex flex-col h-full">
                  <h4 className="text-lg font-bold text-foreground mb-3 line-clamp-2">
                    {item.titulo}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                    {item.mensagem}
                  </p>
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground/80 italic">
                      📚 {item.referencia}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex items-center justify-center gap-2 mt-6">
          <CarouselPrevious className="static translate-y-0 bg-card border-primary/20 hover:bg-primary/10 hover:border-primary/40" />
          <div className="flex gap-1.5">
            {aplvInfoData.map((_, index) => (
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
