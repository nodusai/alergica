import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Check, CheckCircle2, ExternalLink, FileText, FileUp, Loader2, Plus, Search, Trash2, X,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { normalizeText } from "@/lib/allergens";
import { matchBula, type CatalogEntry, type Confidence, type MatchResult } from "@/lib/bulaMatch";
import {
  BulaSetupMissingError,
  getBulaCatalog,
  looksLikePdf,
  MAX_BULA_BYTES,
  sha256Hex,
  uploadBula,
  type BulaUploadResult,
} from "@/services/bulas";
import { extractPdfText } from "@/services/pdfText";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const ELEVATED =
  "bg-card rounded-3xl border border-border/60 shadow-[0_1px_2px_hsl(var(--primary)/0.06),0_10px_28px_-14px_hsl(160_40%_15%/0.18)]";

type Row = {
  key: string;
  file: File;
  stage: "lendo" | "pronto" | "erro" | "enviando" | "concluido";
  error?: string;
  /** Início do texto da 1ª página, para o administrador reconhecer a bula */
  snippet?: string;
  noText?: boolean;
  match?: MatchResult;
  selected: string[];
  /** Resultado do envio por remédio */
  results?: Record<string, BulaUploadResult | "erro">;
};

const CONF: Record<Confidence, { label: string; cls: string }> = {
  igual: { label: "Já guardada", cls: "bg-secondary text-foreground/80 border-border" },
  alta: { label: "Identificada", cls: "bg-safe/10 text-safe-foreground border-safe/30" },
  media: { label: "Confirme", cls: "bg-caution/10 text-caution-foreground border-caution/30" },
  baixa: { label: "Não identificada", cls: "bg-risk/10 text-risk-foreground border-risk/30" },
};

const RESULT_LABEL: Record<BulaUploadResult | "erro", string> = {
  primeira: "guardada",
  atualizada: "nova versão — em revisão",
  igual: "sem mudança",
  erro: "erro",
};

const AdminBulasPage = () => {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) navigate("/");
    else if (!isAdmin) navigate("/dashboard", { replace: true });
  }, [user, loading, isAdmin, roleLoading, navigate]);

  const catalogQuery = useQuery({
    queryKey: ["bula-catalog"],
    queryFn: getBulaCatalog,
    enabled: !!user && isAdmin && !roleLoading,
    staleTime: 5 * 60 * 1000,
  });
  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const byId = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);

  const patch = (key: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  /** Lê e identifica cada PDF, um de cada vez (não trava a tela) */
  const addFiles = async (list: FileList | File[]) => {
    try {
      await readFiles(list);
    } catch (e) {
      // Nunca falhar em silêncio: mostra o motivo na tela
      console.error("Bulas em lote:", e);
      toast({
        title: "Não foi possível processar os arquivos",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const readFiles = async (list: FileList | File[]) => {
    const files = [...list].filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (!files.length) {
      toast({ title: "Nenhum PDF", description: "Envie arquivos de bula em PDF.", variant: "destructive" });
      return;
    }
    // (crypto.randomUUID só existe em https/localhost; um contador funciona em qualquer endereço)
    const fresh: Row[] = files.map((file) => ({ key: `${file.name}-${file.size}-${++seq.current}`, file, stage: "lendo", selected: [] }));
    setRows((rs) => [...rs, ...fresh]);

    for (const row of fresh) {
      try {
        if (row.file.size > MAX_BULA_BYTES) throw new Error("PDF maior que 20 MB");
        if (!(await looksLikePdf(row.file))) throw new Error("O arquivo não é um PDF válido");
        const [sha, text] = await Promise.all([sha256Hex(row.file), extractPdfText(row.file)]);
        const noText = normalizeText(text.full).replace(/[^a-z]/g, "").length < 50;
        const match = matchBula(text.full, text.head, row.file.name, sha, catalog);
        patch(row.key, {
          stage: "pronto",
          snippet: text.head.replace(/\s+/g, " ").trim().slice(0, 160),
          noText,
          match,
          selected: match.confidence === "igual" ? [] : match.selected,
        });
      } catch (e) {
        console.error("Bulas em lote:", row.file.name, e);
        patch(row.key, { stage: "erro", error: `Não foi possível ler o PDF: ${e instanceof Error ? e.message : String(e)}` });
      }
    }
  };

  const toggle = (row: Row, id: string) =>
    patch(row.key, { selected: row.selected.includes(id) ? row.selected.filter((x) => x !== id) : [...row.selected, id] });

  const jobs = rows.filter((r) => r.stage === "pronto" && r.selected.length > 0);
  const totalMeds = jobs.reduce((n, r) => n + r.selected.length, 0);
  const reading = rows.some((r) => r.stage === "lendo");

  const saveAll = async () => {
    setSaving(true);
    let ok = 0, novas = 0, falhas = 0;
    for (const row of jobs) {
      patch(row.key, { stage: "enviando" });
      const results: Row["results"] = {};
      for (const id of row.selected) {
        try {
          const r = await uploadBula(id, row.file);
          results[id] = r;
          ok++;
          if (r === "atualizada") novas++;
        } catch (e) {
          results[id] = "erro";
          falhas++;
          if (e instanceof BulaSetupMissingError) {
            patch(row.key, { stage: "erro", error: "Falta rodar o script supabase/manual/2026-11-12_bulas_storage.sql", results });
            setSaving(false);
            toast({ title: "Banco não preparado", description: "Rode o script das bulas no Supabase.", variant: "destructive" });
            return;
          }
        }
      }
      patch(row.key, { stage: "concluido", results });
    }
    setSaving(false);
    catalogQuery.refetch();
    toast({
      title: falhas ? "Envio concluído com falhas" : "Bulas guardadas",
      description: `${ok} remédio(s) atualizado(s)${novas ? `, ${novas} com bula nova em revisão` : ""}${falhas ? `, ${falhas} falha(s)` : ""}.`,
      variant: falhas ? "destructive" : undefined,
    });
  };

  const checking = loading || roleLoading || !isAdmin;

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh]">
          <Sidebar isDrawer onClose={() => setSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>

      <main className="flex-1 lg:ml-64 w-full">
        <div className="w-full p-4 md:p-6 lg:p-10 pb-40">
          <div className="w-full max-w-5xl mx-auto">
            <PageHeader
              title="Bulas em lote"
              subtitle={`Arraste várias bulas em PDF. O AlerGica lê cada uma e descobre a qual remédio pertence — você só confere e guarda.${
                catalog.length ? ` Catálogo: ${catalog.length.toLocaleString("pt-BR")} remédios.` : ""
              }`}
              onOpenMenu={() => setSidebarOpen(true)}
            />

            {checking || catalogQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-44 rounded-3xl" />
                <Skeleton className="h-28 rounded-3xl" />
              </div>
            ) : catalogQuery.error ? (
              <div className={`${ELEVATED} p-6 text-center`} role="alert">
                <p className="font-bold text-foreground">Não foi possível carregar o catálogo.</p>
                <button onClick={() => catalogQuery.refetch()} className={`mt-2 text-sm font-bold text-primary underline ${focusRing}`}>
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {catalog.length === 0 && (
                  <div className="rounded-2xl border border-risk/30 bg-risk/10 p-4 text-sm text-risk-foreground font-semibold" role="alert">
                    O catálogo de remédios veio vazio para esta conta, então nenhuma bula pode ser identificada. Confira se a conta
                    tem papel de administrador e se está logada.
                  </div>
                )}
                {/* Área de envio */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    addFiles(e.dataTransfer.files);
                  }}
                  className={`rounded-3xl border-2 border-dashed p-8 md:p-10 text-center transition-colors duration-200 ${
                    dragging ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center">
                    <FileUp className="w-7 h-7 text-[hsl(152_55%_30%)] dark:text-primary" />
                  </div>
                  <p className="mt-4 text-lg font-extrabold text-foreground">Arraste as bulas aqui</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, até 20 MB cada. Pode enviar dezenas de uma vez.</p>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className={`mt-5 btn-primary inline-flex items-center gap-2 active:scale-[0.98] ${focusRing}`}
                  >
                    <Plus className="w-4 h-4" /> Escolher arquivos
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <p className="mt-5 text-xs text-muted-foreground">
                    Baixe as bulas no{" "}
                    <a
                      href="https://consultas.anvisa.gov.br/#/bulario/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-foreground underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      Bulário da Anvisa <ExternalLink className="w-3 h-3" />
                    </a>{" "}
                    (bula do profissional traz a composição completa).
                  </p>
                </div>

                {/* Arquivos */}
                {rows.length > 0 && (
                  <ul className="space-y-3">
                    {rows.map((row) => (
                      <RowCard
                        key={row.key}
                        row={row}
                        byId={byId}
                        catalog={catalog}
                        onToggle={(id) => toggle(row, id)}
                        onAdd={(id) => !row.selected.includes(id) && patch(row.key, { selected: [...row.selected, id] })}
                        onRemove={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                        disabled={saving}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Barra de ação */}
        {rows.length > 0 && (
          <div className="fixed bottom-0 inset-x-0 lg:left-64 z-30 border-t border-border/70 bg-background/95 backdrop-blur px-4 py-3 md:py-4">
            <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {reading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Lendo as bulas…
                  </span>
                ) : totalMeds === 0 ? (
                  <span className="font-semibold text-caution-foreground">
                    Nenhum remédio marcado. Em cada bula, marque o remédio certo (ou busque pelo nome) para poder guardar.
                  </span>
                ) : (
                  <>
                    <strong className="text-foreground">{jobs.length}</strong> bula(s) para{" "}
                    <strong className="text-foreground">{totalMeds}</strong> remédio(s). Bula diferente da guardada fica em
                    revisão (Atenção).
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRows((rs) => rs.filter((r) => r.stage !== "concluido"))}
                  disabled={saving || !rows.some((r) => r.stage === "concluido")}
                  className={`h-11 px-4 rounded-xl border-2 border-border bg-card text-sm font-bold text-foreground hover:bg-secondary active:scale-[0.98] transition-transform disabled:opacity-40 ${focusRing}`}
                >
                  Limpar concluídas
                </button>
                <button
                  onClick={saveAll}
                  disabled={saving || reading || totalMeds === 0}
                  className={`h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-2 hover:brightness-105 active:scale-[0.98] transition-transform disabled:opacity-40 ${focusRing}`}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Guardar {totalMeds > 0 ? `(${totalMeds})` : ""}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ─── Cartão de um arquivo ────────────────────────────────────────────────────

const RowCard = ({
  row,
  byId,
  catalog,
  onToggle,
  onAdd,
  onRemove,
  disabled,
}: {
  row: Row;
  byId: Map<string, CatalogEntry>;
  catalog: CatalogEntry[];
  onToggle: (id: string) => void;
  onAdd: (id: string) => void;
  onRemove: () => void;
  disabled: boolean;
}) => {
  const [search, setSearch] = useState("");
  const conf = row.match ? CONF[row.match.confidence] : null;
  const locked = disabled || row.stage === "enviando" || row.stage === "concluido";

  const shown = useMemo(() => {
    const ids = new Set([...(row.match?.candidates.map((c) => c.id) ?? []), ...row.selected]);
    return [...ids].map((id) => ({ id, cand: row.match?.candidates.find((c) => c.id === id) }));
  }, [row.match, row.selected]);

  const results = useMemo(() => {
    const q = normalizeText(search);
    if (q.length < 2) return [];
    return catalog
      .filter((e) => normalizeText(`${e.nome_principal} ${e.nome_alternativo ?? ""}`).includes(q))
      .slice(0, 8);
  }, [search, catalog]);

  return (
    <li className={`${ELEVATED} p-5 md:p-6 animate-fade-in`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-secondary flex items-center justify-center">
            {row.stage === "lendo" || row.stage === "enviando" ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : row.stage === "concluido" ? (
              <CheckCircle2 className="w-5 h-5 text-safe" />
            ) : row.stage === "erro" ? (
              <AlertTriangle className="w-5 h-5 text-risk" />
            ) : (
              <FileText className="w-5 h-5 text-muted-foreground" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-bold text-foreground break-all leading-snug">{row.file.name}</p>
            {row.snippet && <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">{row.snippet}</p>}
            {row.stage === "lendo" && <p className="text-[13px] text-muted-foreground mt-0.5">Lendo a bula…</p>}
            {row.error && <p className="text-[13px] text-risk-foreground mt-0.5 font-semibold">{row.error}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {conf && row.stage !== "erro" && (
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${conf.cls}`}>{conf.label}</span>
          )}
          {!locked && (
            <button
              onClick={onRemove}
              aria-label={`Remover ${row.file.name}`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-transform ${focusRing}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {row.match && row.stage !== "erro" && (
        <div className="mt-4 pt-4 border-t border-border/60">
          {row.match.confidence === "igual" ? (
            <p className="text-sm text-muted-foreground">
              Este arquivo já está guardado em{" "}
              {row.match.candidates.map((c) => byId.get(c.id)?.nome_principal).join(", ")}. Nada a fazer.
            </p>
          ) : (
            <>
              {row.noText && (
                <p className="mb-3 text-sm text-caution-foreground font-semibold">
                  PDF sem texto (escaneado): não dá para identificar sozinho. Escolha o remédio abaixo.
                </p>
              )}
              {!row.noText && row.match.confidence !== "alta" && (
                <p className="mb-3 text-sm text-muted-foreground">
                  {shown.length ? "Confira e marque o remédio correto:" : "Nenhum remédio do catálogo bate com esta bula. Busque abaixo:"}
                </p>
              )}
              {shown.length > 0 && (
                <ul className="space-y-1.5">
                  {shown.map(({ id, cand }) => {
                    const e = byId.get(id);
                    const on = row.selected.includes(id);
                    const result = row.results?.[id];
                    return (
                      <li key={id}>
                        <button
                          role="checkbox"
                          aria-checked={on}
                          disabled={locked}
                          onClick={() => onToggle(id)}
                          className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left active:scale-[0.99] transition-[transform,border-color,background-color] duration-150 disabled:cursor-default ${focusRing} ${
                            on ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center ${
                              on ? "bg-primary border-primary text-primary-foreground" : "border-border"
                            }`}
                          >
                            {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-foreground leading-snug">{e?.nome_principal}</span>
                            <span className="block text-[12px] text-muted-foreground">
                              {e?.nome_alternativo ?? "laboratório não informado"}
                              {cand?.reasons.length ? ` · ${cand.reasons.join(", ")}` : ""}
                            </span>
                          </span>
                          {result ? (
                            <span className={`text-[12px] font-bold ${result === "erro" ? "text-risk-foreground" : "text-safe-foreground"}`}>
                              {RESULT_LABEL[result]}
                            </span>
                          ) : (
                            cand && <span className="text-[12px] font-bold tabular-nums text-muted-foreground">{cand.score}%</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!locked && (
                <div className="mt-3 relative">
                  <label className="relative block">
                    <span className="sr-only">Buscar outro remédio para esta bula</span>
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(ev) => setSearch(ev.target.value)}
                      placeholder="Outro remédio? Busque pelo nome ou laboratório"
                      className="w-full h-10 rounded-xl border-2 border-input bg-card pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground/60 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-[border-color,box-shadow]"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        aria-label="Limpar busca"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary ${focusRing}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </label>
                  {results.length > 0 && (
                    <ul className="mt-1.5 rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
                      {results.map((e) => (
                        <li key={e.id}>
                          <button
                            onClick={() => {
                              onAdd(e.id);
                              setSearch("");
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-secondary active:bg-secondary/70 ${focusRing}`}
                          >
                            <span className="block text-sm font-semibold text-foreground">{e.nome_principal}</span>
                            <span className="block text-[12px] text-muted-foreground">{e.nome_alternativo ?? "—"}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
};

export default AdminBulasPage;
