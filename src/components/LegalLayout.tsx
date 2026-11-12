import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LEGAL } from "@/config/legal";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Layout das páginas públicas de documentos legais (Política de Privacidade e Termos de Uso). */
const LegalLayout = ({
  title,
  version,
  intro,
  children,
}: {
  title: string;
  version: string;
  intro: ReactNode;
  children: ReactNode;
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${title} · AlerGica`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border/70">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 -ml-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-transform ${focusRing}`}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <Link to="/" className={`text-xl font-extrabold tracking-[-0.02em] text-foreground rounded ${focusRing}`}>
            Aler<span className="text-[hsl(152_55%_38%)] dark:text-primary">Gica</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 md:py-14">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
          Versão {version} · vigente desde {LEGAL.effectiveDate}
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.05] text-foreground mt-3">
          {title}
        </h1>
        <div className="text-lg text-foreground/75 leading-[1.7] mt-5">{intro}</div>

        <article className="legal-doc mt-10">{children}</article>

        <footer className="mt-14 pt-6 border-t border-border/70 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <Link to="/privacidade" className={`hover:text-foreground rounded ${focusRing}`}>
            Política de Privacidade
          </Link>
          <span aria-hidden>·</span>
          <Link to="/termos" className={`hover:text-foreground rounded ${focusRing}`}>
            Termos de Uso
          </Link>
          <span aria-hidden>·</span>
          <span>Encarregado de dados: {LEGAL.dpoEmail}</span>
        </footer>
      </main>
    </div>
  );
};

export default LegalLayout;
