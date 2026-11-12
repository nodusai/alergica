import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const iconBtn = `w-10 h-10 shrink-0 rounded-xl bg-card border border-border/70 flex items-center justify-center text-foreground
  shadow-[0_1px_2px_hsl(160_40%_15%/0.06)] hover:bg-secondary hover:border-primary/40 active:scale-95 transition-transform duration-150 ${focusRing}`;

/** Cabeçalho padrão das páginas internas: menu (celular), voltar, título e subtítulo. */
const PageHeader = ({
  title,
  subtitle,
  onOpenMenu,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  onOpenMenu: () => void;
  actions?: ReactNode;
}) => {
  const navigate = useNavigate();
  return (
    <header className="mb-8 md:mb-10 animate-fade-in">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onOpenMenu} aria-label="Abrir menu" className={`lg:hidden ${iconBtn}`}>
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/dashboard"))}
          aria-label="Voltar"
          className={iconBtn}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[2rem] md:text-[2.4rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground">
            {title}
          </h1>
          {subtitle && <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed max-w-2xl">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
};

export default PageHeader;
