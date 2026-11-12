import { useId, useRef, useState } from "react";
import { Check, Pill, Plus, ScanSearch, Utensils } from "lucide-react";
import {
  FEATURED_DRUG,
  FEATURED_FOOD,
  parseAllergyInfo,
  type AllergenGroup,
  type AllergySelection,
} from "@/lib/allergens";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type Props = {
  value: AllergySelection;
  onChange: (next: AllergySelection) => void;
};

/**
 * Seleção de alergias: 10 alimentares + 10 classes de medicamentos e "Outros" (texto livre).
 * O que for escrito em "Outros" é reconhecido na hora e mostrado abaixo do campo.
 */
const AllergyPicker = ({ value, onChange }: Props) => {
  const otherId = useId();
  const otherRef = useRef<HTMLTextAreaElement>(null);
  const [otherOpen, setOtherOpen] = useState(!!value.other.trim());
  const parsed = parseAllergyInfo(value.other);
  const fromOther = new Set(parsed.groups.map((g) => g.id));

  const toggle = (kind: "food" | "drug", id: string) => {
    const list = value[kind];
    onChange({ ...value, [kind]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] });
  };

  const openOther = () => {
    setOtherOpen(true);
    requestAnimationFrame(() => otherRef.current?.focus());
  };

  // Chamado como função (não como <Group/>) para não remontar os botões a cada tecla
  const Group = ({ title, icon: Icon, kind, groups }: { title: string; icon: React.ElementType; kind: "food" | "drug"; groups: AllergenGroup[] }) => (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-bold text-foreground mb-2.5">
        <Icon className="w-4 h-4 text-[hsl(152_55%_30%)] dark:text-primary" /> {title}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {groups.map((g) => {
          const viaOther = !value[kind].includes(g.id) && fromOther.has(g.id);
          const checked = value[kind].includes(g.id) || viaOther;
          return (
            <button
              key={g.id}
              type="button"
              role="checkbox"
              aria-checked={checked}
              title={viaOther ? "Reconhecido no campo Outros" : undefined}
              onClick={() => (viaOther ? openOther() : toggle(kind, g.id))}
              className={`group flex items-start gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left active:scale-[0.98] transition-[transform,background-color,border-color] duration-150 ${focusRing} ${
                checked ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span
                className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
                  checked ? "bg-primary border-primary text-primary-foreground" : "border-border group-hover:border-primary/60"
                }`}
              >
                {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground leading-snug">{g.label}</span>
                {(g.hint || viaOther) && (
                  <span className="block text-[12px] text-muted-foreground leading-snug mt-0.5">
                    {viaOther ? "reconhecido em Outros" : g.hint}
                  </span>
                )}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          aria-expanded={otherOpen}
          aria-controls={otherId}
          onClick={openOther}
          className={`flex items-center gap-2.5 rounded-xl border-2 border-dashed px-3 py-2.5 text-sm font-semibold active:scale-[0.98] transition-[transform,background-color,border-color] duration-150 ${focusRing} ${
            otherOpen ? "border-primary/60 bg-primary/5 text-foreground" : "border-border text-foreground/80 hover:border-primary/50"
          }`}
        >
          <Plus className="w-4 h-4" /> Outros
        </button>
      </div>
    </fieldset>
  );

  return (
    <div className="space-y-5">
      {Group({ title: "Alergias alimentares", icon: Utensils, kind: "food", groups: FEATURED_FOOD })}
      {Group({ title: "Alergias a medicamentos", icon: Pill, kind: "drug", groups: FEATURED_DRUG })}

      {otherOpen && (
        <div id={otherId} className="animate-fade-in">
          <label htmlFor={`${otherId}-txt`} className="block text-sm font-semibold text-foreground mb-1.5">
            Outras alergias (alimentos ou remédios)
          </label>
          <textarea
            id={`${otherId}-txt`}
            ref={otherRef}
            rows={2}
            value={value.other}
            onChange={(e) => onChange({ ...value, other: e.target.value })}
            placeholder="Separe por vírgula. Ex.: kiwi, tramadol, corante tartrazina"
            className="w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/60 resize-none transition-[border-color,box-shadow] duration-200 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
          {(parsed.groups.length > 0 || parsed.custom.length > 0) && (
            <div className="mt-2" aria-live="polite">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground mb-1.5">
                <ScanSearch className="w-3.5 h-3.5" /> Reconhecemos:
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {parsed.groups.map((g) => (
                  <li key={g.id} className="rounded-full bg-primary/15 px-3 py-1 text-[13px] font-semibold text-[hsl(152_55%_26%)] dark:text-primary">
                    {g.label}
                  </li>
                ))}
                {parsed.custom.map((c) => (
                  <li
                    key={c}
                    title="Não está no nosso catálogo de alergias; será procurado exatamente como escrito"
                    className="rounded-full border border-dashed border-border bg-secondary/60 px-3 py-1 text-[13px] font-medium text-foreground/80"
                  >
                    {c} <span className="text-muted-foreground">· como escrito</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllergyPicker;
