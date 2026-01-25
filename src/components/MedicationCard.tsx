import RiskBadge from "./RiskBadge";

type RiskLevel = "safe" | "caution" | "risk";

interface MedicationCardProps {
  name: string;
  laboratory: string;
  riskLevel: RiskLevel;
  riskText: string;
}

const MedicationCard = ({ name, laboratory, riskLevel, riskText }: MedicationCardProps) => {
  return (
    <div className="card-soft animate-scale-in hover:scale-[1.02] transition-transform cursor-pointer">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{laboratory}</p>
        </div>
        <RiskBadge level={riskLevel} text={riskText} />
      </div>
    </div>
  );
};

export default MedicationCard;
