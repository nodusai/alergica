import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type RiskLevel = "safe" | "caution" | "risk";

interface RiskBadgeProps {
  level: RiskLevel;
  text: string;
}

const RiskBadge = ({ level, text }: RiskBadgeProps) => {
  const config = {
    safe: {
      className: "badge-safe",
      icon: CheckCircle,
    },
    caution: {
      className: "badge-caution",
      icon: AlertTriangle,
    },
    risk: {
      className: "badge-risk",
      icon: XCircle,
    },
  };

  const { className, icon: Icon } = config[level];

  return (
    <span className={className}>
      <Icon className="w-4 h-4" />
      {text}
    </span>
  );
};

export default RiskBadge;
