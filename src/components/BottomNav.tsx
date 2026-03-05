import { useNavigate } from "react-router-dom";
import { Pill, ShoppingBag, UtensilsCrossed, Apple } from "lucide-react";
import { ExpandableTabs, Tab } from "@/components/ui/expandable-tabs";

const BottomNav = () => {
  const navigate = useNavigate();

  const tabs: Tab[] = [
    { label: "Medicamentos", icon: Pill, onClick: () => navigate("/medications") },
    { label: "Produtos", icon: ShoppingBag, onClick: () => navigate("/products") },
    { label: "Restaurante", icon: UtensilsCrossed, onClick: () => navigate("/restaurants") },
    { label: "Nutrição", icon: Apple, onClick: () => navigate("/nutrition") },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center">
      <ExpandableTabs tabs={tabs} />
    </div>
  );
};

export default BottomNav;
