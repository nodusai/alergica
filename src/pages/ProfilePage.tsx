import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, AlertTriangle, FileText, Calendar, MapPin, Briefcase,
  Pencil, Lock, ShieldCheck, Sparkles, Pill, Stethoscope, Heart,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BabyManager from "@/components/BabyManager";
import ChatWidget from "@/components/ChatWidget";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { displayName, initials } from "@/lib/names";
import AllergyPicker from "@/components/AllergyPicker";
import AllergySummary from "@/components/AllergySummary";
import { saveAllergySelection, selectionFromRow } from "@/services/profile";
import { buildUserAllergies, EMPTY_SELECTION, type AllergySelection } from "@/lib/allergens";
import { useQueryClient } from "@tanstack/react-query";
import { USER_ALLERGIES_KEY } from "@/hooks/use-user-allergies";

const PROFILE_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  alergica: { label: "Pessoa alérgica", icon: Heart },
  mae: { label: "Mãe", icon: Heart },
  pai: { label: "Pai", icon: Heart },
  farmaceutico: { label: "Farmacêutico(a)", icon: Pill },
  medico: { label: "Médico(a)", icon: Stethoscope },
};

const GENDER_OPTIONS = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "nao_binario", label: "Não-binário" },
  { value: "prefiro_nao_dizer", label: "Prefiro não informar" },
];
const GENDER_LABELS = Object.fromEntries(GENDER_OPTIONS.map((g) => [g.value, g.label]));

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface ProfileData {
  full_name: string;
  child_name: string;
  email: string;
  phone: string;
  allergy_info: string;
  observation: string;
  profile_type: string;
  birth_date: string;
  gender: string;
  city: string;
  state: string;
  profession: string;
}

const EMPTY: ProfileData = {
  full_name: "", child_name: "", email: "", phone: "", allergy_info: "", observation: "",
  profile_type: "", birth_date: "", gender: "", city: "", state: "", profession: "",
};

/** Campos que contam para "perfil completo" */
const COMPLETENESS_FIELDS: (keyof ProfileData)[] = ["full_name", "birth_date", "phone", "city"];

const formatDate = (raw: string) => {
  const [y, m, d] = raw.split("-");
  return y && m && d ? `${d}/${m}/${y}` : raw;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const ELEVATED =
  "bg-card rounded-3xl border border-border/60 shadow-[0_1px_2px_hsl(var(--primary)/0.06),0_10px_28px_-14px_hsl(160_40%_15%/0.18)]";
const inputCls =
  "w-full h-12 rounded-xl border-2 border-input bg-card px-4 text-[15px] text-foreground placeholder:text-muted-foreground/60 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-60 disabled:hover:border-input";
const secondaryBtn = `inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border-2 border-border bg-card text-sm font-bold text-foreground hover:border-primary/60 hover:bg-secondary active:scale-[0.98] transition-transform ${focusRing} disabled:opacity-50`;

// ─── Peças de layout ─────────────────────────────────────────────────────────
const Value = ({ icon: Icon, label, value, wide }: { icon: React.ElementType; label: string; value?: string; wide?: boolean }) => (
  <div className={wide ? "sm:col-span-2" : ""}>
    <dt className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
      <Icon className="w-3.5 h-3.5" /> {label}
    </dt>
    <dd className={`mt-1 text-[15px] leading-relaxed ${value?.trim() ? "text-foreground" : "text-muted-foreground/70 italic"}`}>
      {value?.trim() || "Não informado"}
    </dd>
  </div>
);

const Field = ({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: string }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-foreground mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="text-[13px] text-muted-foreground mt-1.5">{hint}</p>}
  </div>
);

const CardTitle = ({ icon: Icon, title, aside }: { icon: React.ElementType; title: string; aside?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 mb-6">
    <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.01em] text-foreground">
      <span className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
        <Icon className="w-[18px] h-[18px] text-[hsl(152_55%_30%)] dark:text-primary" />
      </span>
      {title}
    </h2>
    {aside}
  </div>
);

// ─── Página ──────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData>(EMPTY);
  const [draft, setDraft] = useState<ProfileData>(EMPTY);
  // Alergias: listas marcadas + "Outros" (salvas em food_allergies, drug_allergies e allergy_info)
  const [allergies, setAllergies] = useState<AllergySelection>(EMPTY_SELECTION);
  const [allergyDraft, setAllergyDraft] = useState<AllergySelection>(EMPTY_SELECTION);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      const d = data as Record<string, unknown> | null;
      const str = (k: string) => (d?.[k] as string) || "";
      const filled: ProfileData = {
        // Se o perfil não tem nome, usa o nome digitado no cadastro (fica salvo na próxima edição)
        full_name: str("full_name") || ((user.user_metadata?.full_name as string) ?? ""),
        child_name: str("child_name"),
        email: user.email || "",
        phone: str("phone"),
        allergy_info: str("allergy_info"),
        observation: str("observation"),
        profile_type: str("profile_type"),
        birth_date: str("birth_date"),
        gender: str("gender"),
        city: str("city"),
        state: str("state"),
        profession: str("profession"),
      };
      setProfile(filled);
      setDraft(filled);
      const sel = selectionFromRow(d);
      setAllergies(sel);
      setAllergyDraft(sel);
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const startEdit = () => {
    setDraft(profile);
    setAllergyDraft(allergies);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setAllergyDraft(allergies);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        full_name: draft.full_name.trim(),
        phone: draft.phone.trim(),
        observation: draft.observation.trim(),
        birth_date: draft.birth_date || null,
        gender: draft.gender || null,
        city: draft.city.trim() || null,
        state: draft.state || null,
        profession: draft.profession.trim() || null,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) {
      console.error("Erro ao salvar perfil:", error.code, error.message);
      toast({
        title: "Não foi possível salvar",
        description:
          error.code === "42703" || error.code === "PGRST204"
            ? "O banco de dados está desatualizado. Avise o suporte."
            : "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }
    const { error: allergyError, fallback } = await saveAllergySelection(user.id, allergyDraft);
    queryClient.invalidateQueries({ queryKey: [USER_ALLERGIES_KEY] });
    if (allergyError) {
      console.error("Erro ao salvar alergias:", allergyError.code, allergyError.message);
      toast({ title: "Não foi possível salvar as alergias", description: "Tente novamente em instantes.", variant: "destructive" });
      return;
    }
    if (fallback) console.warn("Banco sem food_allergies/drug_allergies: alergias salvas como texto em allergy_info.");
    setProfile(draft);
    setAllergies(allergyDraft);
    setEditing(false);
    toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas." });
  };

  const set = (k: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const name = displayName(profile.full_name, user);
  const type = PROFILE_TYPE_LABELS[profile.profile_type];
  const TypeIcon = type?.icon;
  const isParent = profile.profile_type === "mae" || profile.profile_type === "pai";
  const filledCount =
    COMPLETENESS_FIELDS.filter((k) => profile[k].trim()).length + (buildUserAllergies(allergies).empty ? 0 : 1);
  const completeness = Math.round((filledCount / (COMPLETENESS_FIELDS.length + 1)) * 100);
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;
  const location = [profile.city, profile.state].filter(Boolean).join(" / ");

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block"><Sidebar /></div>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh]">
          <Sidebar isDrawer onClose={() => setSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>

      <main className="flex-1 lg:ml-64 w-full">
        <div className="w-full p-4 md:p-6 lg:p-10 pb-28">
          <div className="w-full max-w-5xl mx-auto">
            <PageHeader
              title="Meu Perfil"
              subtitle="Suas informações ajudam o AlerGica a indicar o que é seguro para você. Só você tem acesso a elas."
              onOpenMenu={() => setSidebarOpen(true)}
            />

            {loading || loadingProfile ? (
              <div className="space-y-6">
                <Skeleton className="h-40 rounded-3xl" />
                <div className="grid lg:grid-cols-5 gap-6">
                  <Skeleton className="h-80 rounded-3xl lg:col-span-3" />
                  <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Identidade */}
                <section
                  className={`relative overflow-hidden ${ELEVATED} p-6 md:p-8 bg-[radial-gradient(90%_140%_at_0%_0%,hsl(var(--primary)/0.18)_0%,transparent_55%),radial-gradient(60%_120%_at_100%_100%,hsl(40_95%_70%/0.14)_0%,transparent_60%)] animate-fade-in`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-7">
                    <span
                      aria-hidden
                      className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-gradient-to-br from-[hsl(152_70%_62%)] to-[hsl(165_55%_40%)] text-white text-2xl md:text-3xl font-extrabold flex items-center justify-center shadow-[0_2px_4px_hsl(160_40%_15%/0.12),0_14px_30px_-12px_hsl(160_50%_30%/0.65)]"
                    >
                      {initials(name) || <User className="w-8 h-8" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[1.9rem] md:text-[2.2rem] font-bold tracking-[-0.03em] leading-tight text-foreground break-words">
                        {name || "Seu nome"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        {type && TypeIcon && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-[hsl(152_55%_28%)] dark:text-primary">
                            <TypeIcon className="w-3.5 h-3.5" /> {type.label}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" /> {profile.email}
                        </span>
                      </div>
                      {memberSince && <p className="text-sm text-muted-foreground mt-1.5">No AlerGica desde {memberSince}</p>}
                    </div>

                    <div className="md:w-60 shrink-0 rounded-2xl bg-card/80 border border-border/60 p-4">
                      <div className="flex items-baseline justify-between">
                        <p className="text-sm font-bold text-foreground">Perfil completo</p>
                        <p className="text-sm font-extrabold tabular-nums text-foreground">{completeness}%</p>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100} aria-label="Perfil completo">
                        <div
                          className="h-full w-full origin-left rounded-full bg-primary transition-transform duration-700 ease-out"
                          style={{ transform: `scaleX(${completeness / 100})` }}
                        />
                      </div>
                      {completeness < 100 && !editing && (
                        <button onClick={startEdit} className={`mt-3 text-sm font-bold text-[hsl(152_55%_30%)] dark:text-primary inline-flex items-center gap-1.5 rounded hover:underline underline-offset-4 ${focusRing}`}>
                          <Sparkles className="w-4 h-4" /> Completar perfil
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                {editing ? (
                  /* ── EDIÇÃO ── */
                  <section className={`${ELEVATED} p-6 md:p-8 animate-fade-in`}>
                    <CardTitle icon={Pencil} title="Editar perfil" />
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field id="full_name" label="Nome completo">
                        <input id="full_name" value={draft.full_name} onChange={set("full_name")} autoComplete="name" placeholder="Seu nome completo" className={inputCls} />
                      </Field>
                      <Field id="email" label="E-mail" hint="O e-mail não pode ser alterado.">
                        <input id="email" value={draft.email} disabled className={inputCls} />
                      </Field>
                      <Field id="birth_date" label="Data de nascimento">
                        <input id="birth_date" type="date" value={draft.birth_date} onChange={set("birth_date")} className={inputCls} />
                      </Field>
                      <Field id="gender" label="Sexo">
                        <select id="gender" value={draft.gender} onChange={set("gender")} className={inputCls}>
                          <option value="">Não informado</option>
                          {GENDER_OPTIONS.map((g) => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field id="phone" label="Telefone">
                        <input id="phone" type="tel" value={draft.phone} onChange={set("phone")} autoComplete="tel" placeholder="(00) 00000-0000" className={inputCls} />
                      </Field>
                      <Field id="profession" label="Profissão">
                        <input id="profession" value={draft.profession} onChange={set("profession")} placeholder="Ex.: Professora" className={inputCls} />
                      </Field>
                      <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3 sm:col-span-2">
                        <Field id="city" label="Cidade">
                          <input id="city" value={draft.city} onChange={set("city")} autoComplete="address-level2" placeholder="Sua cidade" className={inputCls} />
                        </Field>
                        <Field id="state" label="UF">
                          <select id="state" value={draft.state} onChange={set("state")} className={inputCls}>
                            <option value="">—</option>
                            {BR_STATES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <div className="sm:col-span-2 rounded-2xl border-2 border-caution/30 bg-caution/[0.06] p-4 md:p-5 space-y-4">
                        <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <Lock className="w-4 h-4" /> Informações de saúde
                          <span className="font-medium text-muted-foreground">· dado sensível protegido pela LGPD</span>
                        </p>
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Alergias</p>
                          <p className="text-[13px] text-muted-foreground mb-3">
                            Marque as alergias. Não encontrou? Toque em <strong>Outros</strong> e escreva. Usamos estas
                            alergias para analisar remédios e rótulos.
                          </p>
                          <AllergyPicker value={allergyDraft} onChange={setAllergyDraft} />
                        </div>
                        <Field id="observation" label="Observações">
                          <textarea
                            id="observation"
                            value={draft.observation}
                            onChange={set("observation")}
                            rows={4}
                            placeholder="Informações importantes sobre a sua saúde ou a do seu filho"
                            className={`${inputCls} h-auto py-3 resize-none`}
                          />
                        </Field>
                      </div>

                      {type && (
                        <p className="sm:col-span-2 text-[13px] text-muted-foreground">
                          Perfil de uso: <strong className="text-foreground">{type.label}</strong>. Para alterar, fale com o suporte.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                      <button onClick={cancelEdit} disabled={saving} className={secondaryBtn}>Cancelar</button>
                      <button onClick={handleSave} disabled={saving} className="btn-primary h-11 py-0 px-8 disabled:opacity-60">
                        {saving ? "Salvando..." : "Salvar alterações"}
                      </button>
                    </div>
                  </section>
                ) : (
                  /* ── VISUALIZAÇÃO ── */
                  <div className="grid lg:grid-cols-5 gap-6 items-start">
                    <section className={`lg:col-span-3 ${ELEVATED} p-6 md:p-8 animate-fade-in`}>
                      <CardTitle
                        icon={User}
                        title="Dados pessoais"
                        aside={
                          <button onClick={startEdit} className={`${secondaryBtn} h-10 px-4`}>
                            <Pencil className="w-4 h-4" /> Editar
                          </button>
                        }
                      />
                      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                        <Value icon={User} label="Nome completo" value={profile.full_name} />
                        <Value icon={Calendar} label="Nascimento" value={profile.birth_date && formatDate(profile.birth_date)} />
                        <Value icon={Phone} label="Telefone" value={profile.phone} />
                        <Value icon={User} label="Sexo" value={GENDER_LABELS[profile.gender]} />
                        <Value icon={Briefcase} label="Profissão" value={profile.profession} />
                        <Value icon={MapPin} label="Cidade / UF" value={location} />
                      </dl>
                    </section>

                    <section className={`lg:col-span-2 ${ELEVATED} p-6 md:p-8 animate-fade-in`} style={{ animationDelay: "0.05s" }}>
                      <CardTitle icon={AlertTriangle} title="Saúde" />
                      <dl className="space-y-6">
                        <div>
                          <dt className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                            <AlertTriangle className="w-3.5 h-3.5" /> Alergias
                          </dt>
                          <dd>
                            <AllergySummary value={allergies} />
                          </dd>
                        </div>
                        <Value icon={FileText} label="Observações" value={profile.observation} />
                      </dl>
                      <p className="mt-6 pt-5 border-t border-border/60 flex gap-2 text-[13px] text-muted-foreground leading-relaxed">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-safe mt-0.5" />
                        Dados de saúde são sensíveis pela LGPD: ficam visíveis só para você e não são compartilhados.
                      </p>
                    </section>
                  </div>
                )}

                {isParent && (
                  <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <BabyManager />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <ChatWidget />
    </div>
  );
};

export default ProfilePage;
