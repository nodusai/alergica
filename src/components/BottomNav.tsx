import { Home, Pill, ShoppingBag, UtensilsCrossed, Apple } from "lucide-react";
import { ExpandableTabs, Tab } from "@/components/ui/expandable-tabs";

export type ModuleType = "home" | "medications" | "products" | "restaurants" | "nutrition";

const MODULE_INDEX: Record<ModuleType, number> = {
  home: 0,
  medications: 1,
  products: 2,
  restaurants: 3,
  nutrition: 4,
};

const INDEX_MODULE: ModuleType[] = ["home", "medications", "products", "restaurants", "nutrition"];

interface BottomNavProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

const BottomNav = ({ activeModule, onModuleChange }: BottomNavProps) => {
  const tabs: Tab[] = [
    { label: "Início", icon: Home },
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
