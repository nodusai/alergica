import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, ChevronRight, Download, FileText, Info, Loader2, Mail, Moon, Palette, ShieldCheck, Sun, Trash2, UserPen,
  AlertTriangle, CheckCircle2,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import PageHeader from "@/components/PageHeader";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LEGAL } from "@/config/legal";
import { isDarkTheme, onThemeChange, setDarkTheme } from "@/lib/theme";
import { deleteMyAccount, downloadMyData, getMyConsents, type ConsentRecord } from "@/services/privacy";

const CONSENT_LABELS: Record<string, string> = {
  termos_uso: "Termos de Uso",
  politica_privacidade: "Política de Privacidade",
  dados_saude: "Uso de dados de saúde",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const ELEVATED =
  "bg-card rounded-3xl border border-border/60 shadow-[0_1px_2px_hsl(var(--primary)/0.06),0_10px_28px_-14px_hsl(160_40%_15%/0.18)]";
const actionBtn = `inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border-2 border-border bg-card text-sm font-bold text-foreground hover:border-primary/60 hover:bg-secondary active:scale-[0.98] transition-transform ${focusRing} disabled:opacity-50 shrink-0`;
const CONFIRM_WORD = "EXCLUIR";

// ─── Peças de layout ─────────────────────────────────────────────────────────
const Section = ({
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: ReactNode;
  delay?: number;
}) => (
  <section className={`${ELEVATED} animate-fade-in`} style={{ animationDelay: `${delay}s` }}>
    <header className="px-5 md:px-7 pt-6 pb-4 flex gap-3">
      <span className="w-10 h-10 shrink-0 rounded-xl bg-primary/15 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[hsl(152_55%_30%)] dark:text-primary" />
      </span>
      <div>
        <h2 className="text-lg font-extrabold tracking-[-0.01em] text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
    </header>
    <div className="divide-y divide-border/60">{children}</div>
  </section>
);

const Row = ({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) => (
  <div className="px-5 md:px-7 py-4">
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Icon className="hidden sm:block w-5 h-5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
    {children && <div className="mt-3 sm:pl-8">{children}</div>}
  </div>
);

// ─── Página ──────────────────────────────────────────────────────────────────
const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) getMyConsents().then(setConsents);
  }, [user]);

  useEffect(() => {
    setDark(isDarkTheme());
    return onThemeChange(setDark);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadMyData();
      toast({ title: "Download iniciado", description: "Seus dados foram salvos em um arquivo JSON." });
    } catch {
      toast({ variant: "destructive", title: "Não foi possível baixar", description: "Tente novamente em instantes." });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
      setDeleteOpen(false);
      toast({ title: "Conta excluída", description: "Sua conta e seus dados foram apagados." });
      navigate("/");
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível excluir a conta",
        description: `Tente novamente ou escreva para ${LEGAL.dpoEmail}.`,
      });
    } finally {
      setDeleting(false);
    }
  };

  // Última decisão registrada para cada tipo de consentimento
  const latestConsents = Object.values(
    consents.reduce<Record<string, ConsentRecord>>((acc, c) => ({ ...acc, [c.type]: c }), {}),
  );

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
          <div className="w-full max-w-3xl mx-auto">
            <PageHeader
              title="Configurações"
              subtitle="Preferências do app e controle total sobre os seus dados."
              onOpenMenu={() => setSidebarOpen(true)}
            />

            <div className="space-y-6">
              {/* Privacidade */}
              <Section
                icon={ShieldCheck}
                title="Privacidade e seus dados"
                description="Pela LGPD, você pode acessar, levar, corrigir e apagar seus dados quando quiser, sem custo."
              >
                <Row
                  icon={Download}
                  title="Baixar meus dados"
                  description="Perfil, bebês, mensagens e consentimentos em um arquivo JSON."
                  action={
                    <button onClick={handleExport} disabled={exporting} className={actionBtn}>
                      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Baixar
                    </button>
                  }
                />
                <Row
                  icon={UserPen}
                  title="Corrigir meus dados"
                  description="Atualize nome, alergias e outras informações."
                  action={
                    <Link to="/profile" className={actionBtn}>
                      Meu Perfil <ChevronRight className="w-4 h-4" />
                    </Link>
                  }
                />
                <Row icon={CheckCircle2} title="Consentimentos registrados">
                  {latestConsents.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {latestConsents.map((c) => (
                        <li
                          key={c.type}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                            c.granted ? "bg-safe/15 text-safe-foreground" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {CONSENT_LABELS[c.type] ?? c.type} · v{c.version} ·{" "}
                          {new Date(c.at).toLocaleDateString("pt-BR")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed rounded-xl bg-secondary/60 px-4 py-3">
                      Sua conta foi criada antes do registro de consentimentos. Ao continuar usando o AlerGica, valem a
                      Política de Privacidade e os Termos de Uso atuais.
                    </p>
                  )}
                </Row>
                <Row icon={FileText} title="Documentos e contato">
                  <div className="flex flex-wrap gap-2">
                    <Link to="/privacidade" className={actionBtn}>
                      Política de Privacidade
                    </Link>
                    <Link to="/termos" className={actionBtn}>
                      Termos de Uso
                    </Link>
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" /> Encarregado de dados: {LEGAL.dpoEmail}
                  </p>
                </Row>
              </Section>

              {/* Preferências */}
              <Section icon={Palette} title="Preferências" delay={0.05}>
                <Row
                  icon={dark ? Moon : Sun}
                  title="Aparência"
                  description="Escolha o tema do aplicativo."
                  action={
                    <div role="radiogroup" aria-label="Tema" className="relative grid grid-cols-2 p-1 rounded-xl bg-secondary w-full sm:w-56">
                      <span
                        aria-hidden
                        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-card shadow-[0_1px_2px_hsl(160_40%_15%/0.1),0_4px_10px_-4px_hsl(160_40%_15%/0.2)] transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
                          dark ? "translate-x-full" : "translate-x-0"
                        }`}
                      />
                      {[
                        { value: false, label: "Claro", icon: Sun },
                        { value: true, label: "Escuro", icon: Moon },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          role="radio"
                          aria-checked={dark === opt.value}
                          onClick={() => setDarkTheme(opt.value)}
                          className={`relative z-10 h-9 rounded-lg inline-flex items-center justify-center gap-1.5 text-sm font-bold active:scale-95 transition-transform ${focusRing} ${
                            dark === opt.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <opt.icon className="w-4 h-4" /> {opt.label}
                        </button>
                      ))}
                    </div>
                  }
                />
                <Row
                  icon={Bell}
                  title="Notificações"
                  description="As opções de notificação estarão disponíveis em uma próxima versão."
                  action={
                    <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground shrink-0">
                      Em breve
                    </span>
                  }
                />
              </Section>

              {/* Sobre */}
              <Section icon={Info} title="Sobre o AlerGica" delay={0.1}>
                <div className="px-5 md:px-7 py-4 text-sm text-muted-foreground leading-relaxed">
                  O AlerGica ajuda famílias a identificar medicamentos e produtos seguros para quem tem APLV. As análises
                  são informativas e não substituem a orientação do médico ou do farmacêutico.
                </div>
              </Section>

              {/* Zona de perigo */}
              <section
                className="rounded-3xl border-2 border-destructive/30 bg-destructive/[0.04] p-5 md:p-7 animate-fade-in"
                style={{ animationDelay: "0.15s" }}
                aria-labelledby="zona-perigo"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-destructive/15 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </span>
                  <div className="flex-1">
                    <h2 id="zona-perigo" className="text-[15px] font-extrabold text-foreground">
                      Excluir minha conta
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Apaga sua conta e todos os seus dados, inclusive os das crianças, e revoga seus consentimentos. Não
                      dá para desfazer.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setConfirmText("");
                      setDeleteOpen(true);
                    }}
                    className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-transform ${focusRing} shrink-0`}
                  >
                    <Trash2 className="w-4 h-4" /> Excluir conta
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => !deleting && setDeleteOpen(o)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              Vamos apagar seu perfil, seus bebês, suas mensagens e o histórico de consentimentos, e sua conta deixará de
              existir. Se quiser guardar uma cópia, baixe seus dados antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <label htmlFor="confirmar-exclusao" className="block text-sm font-semibold text-foreground mb-1.5">
              Para confirmar, digite <strong>{CONFIRM_WORD}</strong>
            </label>
            <input
              id="confirmar-exclusao"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="w-full h-11 rounded-xl border-2 border-input bg-card px-4 text-sm transition-[border-color,box-shadow] focus:outline-none focus:border-destructive focus:ring-4 focus:ring-destructive/15"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <button
              onClick={handleDelete}
              disabled={confirmText.trim().toUpperCase() !== CONFIRM_WORD || deleting}
              className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-transform ${focusRing} disabled:opacity-50 disabled:pointer-events-none`}
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Excluir definitivamente
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChatWidget />
    </div>
  );
};

export default SettingsPage;
