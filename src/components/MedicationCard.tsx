import { ChevronRight, Pill } from "lucide-react";
import RiskBadge from "./RiskBadge";

type RiskLevel = "safe" | "caution" | "risk";

interface MedicationCardProps {
  name: string;
  laboratory: string;
  riskLevel: RiskLevel;
  riskText: string;
}

const ICON_TONE: Record<RiskLevel, string> = {
  safe: "bg-safe/15 text-safe-foreground",
  caution: "bg-caution/15 text-caution-foreground",
  risk: "bg-risk/15 text-risk-foreground",
};

const MedicationCard = ({ name, laboratory, riskLevel, riskText }: MedicationCardProps) => {
  return (
    <div className="h-full rounded-2xl bg-card border border-border/60 p-4 md:p-5 w-full animate-scale-in shadow-[0_1px_2px_hsl(var(--primary)/0.06),0_8px_24px_-12px_hsl(160_40%_15%/0.12)] group-hover:border-primary/40 group-focus-visible:border-primary transition-colors duration-200">
      <div className="flex items-start gap-3 md:gap-4">
        <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${ICON_TONE[riskLevel]}`}>
          <Pill className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] md:text-base font-bold text-foreground leading-snug line-clamp-2 tracking-[-0.01em]">
            {name}
          </h3>
          {laboratory && (
            <p className="text-xs md:text-[13px] text-muted-foreground mt-0.5 line-clamp-1">{laboratory}</p>
          )}
          <div className="mt-3">
            <RiskBadge level={riskLevel} text={riskText} />
          </div>
        </div>
        <ChevronRight className="w-5 h-5 shrink-0 self-center text-muted-foreground/50 transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </div>
  );
};

export default MedicationCard;
