import RiskBadge from "./RiskBadge";

type RiskLevel = "safe" | "caution" | "risk";

interface ProductCardProps {
  name: string;
  subtitle: string;
  riskLevel: RiskLevel;
  riskText: string;
}

const ProductCard = ({ name, subtitle, riskLevel, riskText }: ProductCardProps) => {
  return (
    <div className="card-soft animate-scale-in hover:scale-[1.02] transition-transform cursor-pointer p-3 sm:p-4 md:p-5 lg:p-6 w-full">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm md:text-base lg:text-lg font-bold text-foreground line-clamp-2">{name}</h3>
          <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <RiskBadge level={riskLevel} text={riskText} />
      </div>
    </div>
  );
};

export default ProductCard;
