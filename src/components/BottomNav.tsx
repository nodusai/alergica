import { Pill, ShoppingBag, UtensilsCrossed, Apple } from "lucide-react";
import { ExpandableTabs, Tab } from "@/components/ui/expandable-tabs";

export type ModuleType = "medications" | "products" | "restaurants" | "nutrition";

const MODULE_INDEX: Record<ModuleType, number> = {
  medications: 0,
  products: 1,
  restaurants: 2,
  nutrition: 3,
};

const INDEX_MODULE: ModuleType[] = ["medications", "products", "restaurants", "nutrition"];

interface BottomNavProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

const BottomNav = ({ activeModule, onModuleChange }: BottomNavProps) => {
  const tabs: Tab[] = [
    { label: "Medicamentos", icon: Pill },
    { label: "Produtos", icon: ShoppingBag },
    { label: "Restaurante", icon: UtensilsCrossed },
    { label: "Nutrição", icon: Apple },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center">
      <ExpandableTabs
        tabs={tabs}
        selected={MODULE_INDEX[activeModule]}
        onSelect={(index) => onModuleChange(INDEX_MODULE[index])}
      />
    </div>
  );
};

export default BottomNav;
