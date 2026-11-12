import { Download, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const btn = `inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform ${focusRing}`;

/** O Chrome do Android não mostra PDF dentro da página: lá abrimos em nova aba */
const canEmbedPdf = () => typeof navigator !== "undefined" && !/Android/i.test(navigator.userAgent);

/** Bula em PDF dentro do app, com opções de abrir em nova aba e baixar */
const BulaViewer = ({
  open,
  onOpenChange,
  url,
  title,
  updatedAt,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title: string;
  updatedAt?: string | null;
}) => {
  const embed = canEmbedPdf();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[calc(100vw-1.5rem)] h-[90vh] p-3 sm:p-4 rounded-3xl bg-card flex flex-col gap-3">
        <div className="pr-8">
          <DialogTitle className="text-base font-extrabold leading-snug">Bula — {title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Cópia guardada pelo AlerGica{updatedAt ? ` · atualizada em ${updatedAt}` : ""}
          </DialogDescription>
        </div>

        {embed ? (
          <iframe
            src={`${url}#view=FitH`}
            title={`Bula de ${title}`}
            className="flex-1 w-full rounded-2xl border border-border bg-secondary/40"
          />
        ) : (
          <div className="flex-1 rounded-2xl border border-dashed border-border bg-secondary/40 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Neste aparelho a bula abre no leitor de PDF. Toque em <strong className="text-foreground">Abrir bula</strong>.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-end">
          <a
            href={url}
            download
            className={`${btn} border-2 border-border bg-card text-foreground hover:border-primary/60 hover:bg-secondary`}
          >
            <Download className="w-4 h-4" /> Baixar
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} bg-primary text-primary-foreground hover:brightness-105`}
          >
            <ExternalLink className="w-4 h-4" /> {embed ? "Abrir em nova aba" : "Abrir bula"}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulaViewer;
