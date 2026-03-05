import RiskBadge from "./RiskBadge";
import { MapPin } from "lucide-react";

type RiskLevel = "safe" | "caution" | "risk";

interface RestaurantCardProps {
  name: string;
  description: string;
  address?: string;
  riskLevel: RiskLevel;
  riskText: string;
}

const RestaurantCard = ({ name, description, address, riskLevel, riskText }: RestaurantCardProps) => {
  return (
    <div className="card-soft animate-scale-in hover:scale-[1.02] transition-transform cursor-pointer p-3 sm:p-4 md:p-5 lg:p-6 w-full">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm md:text-base lg:text-lg font-bold text-foreground line-clamp-2">{name}</h3>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{description}</p>
          {address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {address}
            </p>
          )}
        </div>
        <RiskBadge level={riskLevel} text={riskText} />
      </div>
    </div>
  );
};

export default RestaurantCard;
