import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Pill, ShoppingBag, UtensilsCrossed } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import MedicationCard from "@/components/MedicationCard";
import ProductCard from "@/components/ProductCard";
import RestaurantCard from "@/components/RestaurantCard";
import APLVInfoCarousel from "@/components/APLVInfoCarousel";
import type { ModuleType } from "@/components/BottomNav";

type RiskLevel = "safe" | "caution" | "risk";

const alertToRisk = (nivel: string | null): RiskLevel => {
  if (nivel === "VERDE") return "safe";
  if (nivel === "AMARELO") return "caution";
  return "risk";
};

const alertToText = (nivel: string | null, temRisco: boolean | null): string => {
  if (nivel === "VERDE") return "Seguro (Sem Leite)";
  if (nivel === "AMARELO") return "Atenção (Verificar)";
  return temRisco ? "Risco Alto (Contém Derivados)" : "Risco (Verificar Composição)";
};

const CAROUSEL_IMAGES = [
  { src: "/placeholder.svg", alt: "Banner 1" },
  { src: "/placeholder.svg", alt: "Banner 2" },
  { src: "/placeholder.svg", alt: "Banner 3" },
];

interface HomeContentProps {
  onModuleChange: (module: ModuleType) => void;
}

const HomeContent = ({ onModuleChange }: HomeContentProps) => {
  const [emblaRef] = useEmblaCarousel({ loop: true });
  const [topMeds, setTopMeds] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topRestaurants, setTopRestaurants] = useState<any[]>([]);

  useEffect(() => {
    const fetchTop = async () => {
      const [meds, prods, rests] = await Promise.all([
        supabase.from("medications").select("*").order("access_count", { ascending: false }).limit(3),
        supabase.from("products").select("*").order("access_count", { ascending: false }).limit(3),
        supabase.from("restaurants").select("*").order("access_count", { ascending: false }).limit(3),
      ]);
      setTopMeds(meds.data || []);
      setTopProducts(prods.data || []);
      setTopRestaurants(rests.data || []);
    };
    fetchTop();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* APLV Info as "Novidades" */}
      <APLVInfoCarousel />

      {/* Image Carousel */}
      <section>
        <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
          <div className="flex">
            {CAROUSEL_IMAGES.map((img, i) => (
              <div key={i} className="flex-[0_0_100%] min-w-0">
                <div className="aspect-[16/7] bg-secondary rounded-2xl flex items-center justify-center">
                  <img src={img.src} alt={img.alt} className="w-24 h-24 opacity-30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Medications */}
      {topMeds.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Top Medicamentos</h3>
            </div>
            <button onClick={() => onModuleChange("medications")} className="flex items-center gap-1 text-xs text-primary font-medium">
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topMeds.map((med) => (
              <Link to={`/medication/${med.id}`} key={med.id}>
                <MedicationCard
                  name={med.nome_principal || "Sem nome"}
                  laboratory={med.nome_alternativo || ""}
                  riskLevel={alertToRisk(med.nivel_alerta)}
                  riskText={alertToText(med.nivel_alerta, med.tem_risco_aplv)}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Top Produtos</h3>
            </div>
            <button onClick={() => onModuleChange("products")} className="flex items-center gap-1 text-xs text-primary font-medium">
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topProducts.map((prod) => (
              <div key={prod.id}>
                <ProductCard
                  name={prod.nome_principal || "Sem nome"}
                  subtitle={prod.nome_alternativo || ""}
                  riskLevel={alertToRisk(prod.nivel_alerta)}
                  riskText={alertToText(prod.nivel_alerta, prod.tem_risco_aplv)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Restaurants */}
      {topRestaurants.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Top Restaurantes</h3>
            </div>
            <button onClick={() => onModuleChange("restaurants")} className="flex items-center gap-1 text-xs text-primary font-medium">
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topRestaurants.map((rest) => (
              <div key={rest.id}>
                <RestaurantCard
                  name={rest.nome_principal || "Sem nome"}
                  description={rest.descricao || ""}
                  address={rest.endereco || undefined}
                  riskLevel={alertToRisk(rest.nivel_alerta)}
                  riskText={alertToText(rest.nivel_alerta, false)}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomeContent;
