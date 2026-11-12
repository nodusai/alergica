import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, Copy, Inbox, Lightbulb, Mail, MessageCircle, MessageSquareHeart, RefreshCw, Search, ShieldAlert,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AdminSetupMissingError,
  KIND_LABELS,
  listAdminMessages,
  STATUS_LABELS,
  updateMessageStatus,
  type AdminMessage,
  type MessageKind,
  type MessageStatus,
} from "@/services/adminMessages";
import { normalizeText } from "@/lib/allergens";

export const ADMIN_MESSAGES_KEY = "admin-messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const ELEVATED =
  "bg-card rounded-3xl border border-border/60 shadow-[0_1px_2px_hsl(var(--primary)/0.06),0_10px_28px_-14px_hsl(160_40%_15%/0.18)]";

const KIND_STYLE: Record<MessageKind, { icon: React.ElementType; tone: string }> = {
  suporte: { icon: MessageCircle, tone: "bg-[hsl(200_70%_92%)] text-[hsl(205_60%_30%)] dark:bg-[hsl(205_40%_20%)] dark:text-[hsl(200_70%_80%)]" },
  sugestao: { icon: Lightbulb, tone: "bg-caution/15 text-caution-foreground" },
  feedback: { icon: MessageSquareHeart, tone: "bg-primary/15 text-[hsl(152_55%_26%)] dark:text-primary" },
};

const STATUS_STYLE: Record<MessageStatus, string> = {
  novo: "bg-risk/10 text-risk-foreground border-risk/30",
  em_andamento: "bg-caution/10 text-caution-foreground border-caution/30",
  resolvido: "bg-safe/10 text-safe-foreground border-safe/30",
};

const STATUSES: MessageStatus[] = ["novo", "em_andamento", "resolvido"];
const KINDS: (MessageKind | "todas")[] = ["todas", "suporte", "sugestao", "feedback"];

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffMin < 24 * 60) return `há ${Math.round(diffMin / 60)} h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const AdminMessagesPage = () => {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [kind, setKind] = useState<MessageKind | "todas">("todas");
  const [status, setStatus] = useState<MessageStatus | "todos">("todos");
  const [search, setSearch] = useState("");

  // Só administradores: quem não é volta para o início
  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) navigate("/");
    else if (!isAdmin) navigate("/dashboard", { replace: true });
  }, [user, loading, isAdmin, roleLoading, navigate]);

  const query = useQuery({
    queryKey: [ADMIN_MESSAGES_KEY],
    queryFn: listAdminMessages,
    enabled: !!user && isAdmin && !roleLoading,
    refetchInterval: 60_000,
    retry: (count, err) => !(err instanceof AdminSetupMissingError) && count < 2,
  });
  const messages = useMemo(() => query.data ?? [], [query.data]);

  const mutation = useMutation({
    mutationFn: ({ msg, next }: { msg: AdminMessage; next: MessageStatus }) => updateMessageStatus(msg, next),
    onMutate: async ({ msg, next }) => {
      await queryClient.cancelQueries({ queryKey: [ADMIN_MESSAGES_KEY] });
      const prev = queryClient.getQueryData<AdminMessage[]>([ADMIN_MESSAGES_KEY]);
      queryClient.setQueryData<AdminMessage[]>([ADMIN_MESSAGES_KEY], (list) =>
        list?.map((m) => (m.id === msg.id && m.source === msg.source ? { ...m, status: next } : m)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([ADMIN_MESSAGES_KEY], ctx.prev);
      toast({ title: "Não foi possível atualizar", description: "Tente novamente.", variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [ADMIN_MESSAGES_KEY] }),
  });

  const counts = useMemo(() => {
    const byStatus = { novo: 0, em_andamento: 0, resolvido: 0 } as Record<MessageStatus, number>;
    const byKind = { todas: 0, suporte: 0, sugestao: 0, feedback: 0 } as Record<MessageKind | "todas", number>;
    for (const m of messages) {
      byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
      if (status === "todos" || m.status === status) {
        byKind.todas++;
        byKind[m.kind]++;
      }
    }
    return { byStatus, byKind };
  }, [messages, status]);

  const visible = useMemo(() => {
    const q = normalizeText(search);
    return messages.filter(
      (m) =>
        (kind === "todas" || m.kind === kind) &&
        (status === "todos" || m.status === status) &&
        (!q || normalizeText(`${m.content} ${m.user_name ?? ""} ${m.user_email ?? ""}`).includes(q)),
    );
  }, [messages, kind, status, search]);

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast({ title: "E-mail copiado", description: email });
    } catch {
      toast({ title: "Não foi possível copiar", description: email, variant: "destructive" });
    }
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
        <div className="w-full p-4 md:p-6 lg:p-10 pb-28">
          <div className="w-full max-w-5xl mx-auto">
            <PageHeader
              title="Mensagens"
              subtitle="Suporte, sugestões e feedbacks enviados pelo botão de ajuda do app."
              onOpenMenu={() => setSidebarOpen(true)}
              actions={
                <button
                  onClick={() => query.refetch()}
                  disabled={query.isFetching || checking}
                  className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl border-2 border-border bg-card text-sm font-bold text-foreground hover:border-primary/60 hover:bg-secondary active:scale-[0.98] transition-transform disabled:opacity-50 ${focusRing}`}
                >
                  <RefreshCw className={`w-4 h-4 ${query.isFetching ? "animate-spin" : ""}`} /> Atualizar
                </button>
              }
            />

            {checking || query.isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}
              </div>
            ) : query.error instanceof AdminSetupMissingError ? (
              <div className={`${ELEVATED} p-6 md:p-8 flex gap-4`} role="alert">
                <ShieldAlert className="w-6 h-6 text-caution shrink-0" />
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">Falta preparar o banco de dados</h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Execute o script <code className="font-mono text-foreground">supabase/manual/2026-11-12_mensagens_admin.sql</code> no
                    SQL Editor do Supabase e toque em Atualizar.
                  </p>
                </div>
              </div>
            ) : query.error ? (
              <div className={`${ELEVATED} p-6 md:p-8 text-center`} role="alert">
                <p className="font-bold text-foreground">Não foi possível carregar as mensagens.</p>
                <button onClick={() => query.refetch()} className={`mt-3 text-sm font-bold text-primary underline underline-offset-4 ${focusRing}`}>
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumo por status (também filtra) */}
                <div className="grid grid-cols-3 gap-3" role="group" aria-label="Filtrar por situação">
                  {STATUSES.map((s) => {
                    const Icon = s === "novo" ? Inbox : s === "em_andamento" ? Clock : CheckCircle2;
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        aria-pressed={active}
                        onClick={() => setStatus(active ? "todos" : s)}
                        className={`text-left rounded-2xl border-2 p-4 bg-card active:scale-[0.98] transition-[transform,border-color] duration-150 ${focusRing} ${
                          active ? "border-primary" : "border-border/60 hover:border-primary/40"
                        }`}
                      >
                        <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center border ${STATUS_STYLE[s]}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground leading-none">{counts.byStatus[s]}</p>
                        <p className="text-[13px] text-muted-foreground mt-1">{s === "novo" ? "Novas" : s === "em_andamento" ? "Em andamento" : "Resolvidas"}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Tipo + busca */}
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de mensagem">
                    {KINDS.map((k) => {
                      const active = kind === k;
                      return (
                        <button
                          key={k}
                          role="tab"
                          aria-selected={active}
                          onClick={() => setKind(k)}
                          className={`h-9 px-4 rounded-full border-2 text-sm font-semibold active:scale-95 transition-transform ${focusRing} ${
                            active ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-foreground/80 hover:border-primary/50"
                          }`}
                        >
                          {k === "todas" ? "Todas" : k === "sugestao" ? "Sugestões" : KIND_LABELS[k]}
                          <span className={`ml-1.5 tabular-nums ${active ? "opacity-90" : "text-muted-foreground"}`}>{counts.byKind[k]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <label className="relative md:w-72">
                    <span className="sr-only">Buscar mensagens</span>
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por texto, nome ou e-mail"
                      className="w-full h-10 rounded-xl border-2 border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-[border-color,box-shadow]"
                    />
                  </label>
                </div>

                {/* Lista */}
                {visible.length === 0 ? (
                  <div className={`${ELEVATED} p-10 text-center`}>
                    <Inbox className="w-8 h-8 mx-auto text-muted-foreground/60" />
                    <p className="mt-3 font-bold text-foreground">
                      {messages.length === 0 ? "Nenhuma mensagem recebida ainda" : "Nada encontrado com esses filtros"}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {visible.map((m) => {
                      const K = KIND_STYLE[m.kind];
                      const name = m.user_name?.trim() || "Usuário sem nome";
                      return (
                        <li key={`${m.source}-${m.id}`} className={`${ELEVATED} p-5 md:p-6 animate-fade-in`}>
                          <div className="flex flex-wrap items-start gap-3 justify-between">
                            <div className="flex items-start gap-3 min-w-0">
                              <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${K.tone}`}>
                                <K.icon className="w-5 h-5" />
                              </span>
                              <div className="min-w-0">
                                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.06em] ${K.tone}`}>
                                    {KIND_LABELS[m.kind]}
                                  </span>
                                  <span className="font-bold text-foreground truncate">{name}</span>
                                </p>
                                <p className="text-[13px] text-muted-foreground mt-0.5 break-all">
                                  {m.user_email ?? "e-mail indisponível"} · {formatWhen(m.created_at)}
                                </p>
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLE[m.status]}`}>
                              {STATUS_LABELS[m.status]}
                            </span>
                          </div>

                          <p className="mt-4 text-[15px] text-foreground leading-[1.7] whitespace-pre-wrap break-words">{m.content}</p>

                          <div className="mt-5 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex rounded-xl border-2 border-border p-0.5 bg-secondary/40" role="radiogroup" aria-label="Situação">
                              {STATUSES.map((s) => {
                                const active = m.status === s;
                                return (
                                  <button
                                    key={s}
                                    role="radio"
                                    aria-checked={active}
                                    disabled={mutation.isPending && mutation.variables?.msg.id === m.id}
                                    onClick={() => !active && mutation.mutate({ msg: m, next: s })}
                                    className={`h-8 px-3 rounded-lg text-[13px] font-semibold active:scale-95 transition-transform ${focusRing} ${
                                      active ? "bg-card text-foreground shadow-[0_1px_3px_hsl(160_40%_15%/0.15)]" : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    {STATUS_LABELS[s]}
                                  </button>
                                );
                              })}
                            </div>
                            {m.user_email && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => copyEmail(m.user_email!)}
                                  aria-label={`Copiar e-mail de ${name}`}
                                  className={`h-9 w-9 rounded-xl border-2 border-border bg-card flex items-center justify-center text-foreground hover:border-primary/60 hover:bg-secondary active:scale-95 transition-transform ${focusRing}`}
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <a
                                  href={`mailto:${m.user_email}?subject=${encodeURIComponent(`AlerGica — sua ${KIND_LABELS[m.kind].toLowerCase()}`)}`}
                                  className={`h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-2 hover:brightness-95 active:scale-95 transition-transform ${focusRing}`}
                                >
                                  <Mail className="w-4 h-4" /> Responder
                                </a>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {messages.length >= 1000 && (
                  <p className="text-xs text-muted-foreground text-center">Exibindo as 1000 mensagens mais recentes.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMessagesPage;
