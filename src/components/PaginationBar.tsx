import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

/** Números de página exibidos: 1 … atual-1 atual atual+1 … última */
const pageList = (page: number, total: number): (number | "gap")[] => {
  const wanted = new Set([1, total, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const navBtn = `inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border bg-card text-sm font-semibold text-foreground
  hover:border-primary/60 hover:bg-secondary active:scale-95 transition-transform duration-150 ${focusRing}
  disabled:opacity-40 disabled:pointer-events-none`;

const PaginationBar = ({ page, totalPages, onChange }: Props) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={navBtn}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <ul className="hidden sm:flex items-center gap-1.5">
          {pageList(page, totalPages).map((p, i) =>
            p === "gap" ? (
              <li key={`gap-${i}`} aria-hidden className="w-8 text-center text-muted-foreground">
                …
              </li>
            ) : (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => onChange(p)}
                  aria-current={p === page ? "page" : undefined}
                  aria-label={`Página ${p}`}
                  className={`min-w-10 h-10 px-3 rounded-full text-sm font-bold tabular-nums active:scale-95 transition-transform duration-150 ${focusRing} ${
                    p === page
                      ? "bg-primary text-primary-foreground shadow-[0_1px_2px_hsl(var(--primary)/0.3),0_6px_16px_-6px_hsl(var(--primary)/0.7)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              </li>
            ),
          )}
        </ul>

        <span className="sm:hidden px-3 text-sm font-semibold text-foreground tabular-nums">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className={navBtn}
          aria-label="Próxima página"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        Página {page} de {totalPages}
      </p>
    </nav>
  );
};

export default PaginationBar;
