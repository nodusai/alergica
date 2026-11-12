import { Pill, ScanSearch, Utensils } from "lucide-react";
import { buildUserAllergies, type AllergySelection } from "@/lib/allergens";

const Chips = ({ items, muted = false }: { items: string[]; muted?: boolean }) => (
  <ul className="flex flex-wrap gap-1.5">
    {items.map((t) => (
      <li
        key={t}
        className={
          muted
            ? "rounded-full border border-dashed border-border bg-secondary/60 px-3 py-1 text-[13px] font-medium text-foreground/80"
            : "rounded-full bg-primary/15 px-3 py-1 text-[13px] font-semibold text-[hsl(152_55%_26%)] dark:text-primary"
        }
      >
        {t}
      </li>
    ))}
  </ul>
);

const Row = ({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) => (
  <div>
    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground mb-1.5">
      <Icon className="w-3.5 h-3.5" /> {label}
    </p>
    {children}
  </div>
);

/** Alergias do perfil, organizadas por tipo — exatamente o que as análises verificam */
const AllergySummary = ({ value }: { value: AllergySelection }) => {
  const a = buildUserAllergies(value);
  if (a.empty) {
    return (
      <p className="text-[15px] text-muted-foreground/70 italic">
        Não informado.{" "}
        <span className="not-italic text-[13px]">
          Sem alergias cadastradas, as análises verificam <strong className="text-foreground">leite (APLV)</strong>.
        </span>
      </p>
    );
  }
  const food = a.groups.filter((g) => g.kind === "alimento").map((g) => g.label);
  const drug = a.groups.filter((g) => g.kind === "medicamento").map((g) => g.label);
  return (
    <div className="space-y-3">
      {food.length > 0 && (
        <Row icon={Utensils} label="Alimentos">
          <Chips items={food} />
        </Row>
      )}
      {drug.length > 0 && (
        <Row icon={Pill} label="Medicamentos">
          <Chips items={drug} />
        </Row>
      )}
      {a.custom.length > 0 && (
        <Row icon={ScanSearch} label="Outros (procurados como escritos)">
          <Chips items={a.custom} muted />
        </Row>
      )}
    </div>
  );
};

export default AllergySummary;
