import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, AlertTriangle, FileText, Search,
  Pill, Menu, Calendar, MapPin, Briefcase,
  BadgeCheck, Pencil, X,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BabyManager from "@/components/BabyManager";
import ChatWidget from "@/components/ChatWidget";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

const PROFILE_TYPE_LABELS: Record<string, string> = {
  alergica: "Pessoa Alérgica",
  mae: "Mãe da Pessoa Alérgica",
  pai: "Pai da Pessoa Alérgica",
  farmaceutico: "Farmacêutico(a)",
  medico: "Médico(a)",
};

const GENDER_LABELS: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  nao_binario: "Não-binário",
  prefiro_nao_dizer: "Prefiro não informar",
};

const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "nao_binario", label: "Não-binário" },
  { value: "prefiro_nao_dizer", label: "Prefiro não informar" },
];

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
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

const formatDate = (raw: string) => {
  if (!raw) return "—";
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return raw;
  return `${d}/${m}/${y}`;
};

const displayVal = (v: string) => v?.trim() || "—";

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData>({
    full_name: "", child_name: "", email: "", phone: "",
    allergy_info: "", observation: "", profile_type: "",
    birth_date: "", gender: "", city: "", state: "", profession: "",
  });
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = { consultations: 12, medications_purchased: 5, safe_medications: 8, risk_medications: 3 };

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      const d = data as Record<string, unknown> | null;
      const filled: ProfileData = {
        full_name: (d?.full_name as string) || "",
        child_name: (d?.child_name as string) || "",
        email: user.email || "",
        phone: (d?.phone as string) || "",
        allergy_info: (d?.allergy_info as string) || "",
        observation: (d?.observation as string) || "",
        profile_type: (d?.profile_type as string) || "",
        birth_date: (d?.birth_date as string) || "",
        gender: (d?.gender as string) || "",
        city: (d?.city as string) || "",
        state: (d?.state as string) || "",
        profession: (d?.profession as string) || "",
      };
      setProfile(filled);
      setDraft(filled);
    };
    if (user) fetchProfile();
  }, [user]);

  const handleEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: draft.full_name,
      child_name: draft.child_name,
      phone: draft.phone,
      allergy_info: draft.allergy_info,
      observation: draft.observation,
      birth_date: draft.birth_date || null,
      gender: draft.gender || null,
      city: draft.city || null,
      state: draft.state || null,
      profession: draft.profession || null,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
    } else {
      setProfile(draft);
      setEditing(false);
      toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas com sucesso." });
    }
  };

  const isParent = profile.profile_type === "mae" || profile.profile_type === "pai";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block"><Sidebar /></div>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh]">
          <Sidebar isDrawer={true} onClose={() => setSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>

      <main className="flex-1 lg:ml-64 w-full">
        <div className="w-full h-full p-4 md:p-6 lg:p-8 pb-28">
          <div className="w-full max-w-4xl lg:max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-4 md:mb-6 lg:mb-10 animate-fade-in">
              <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6 gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md bg-card">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-md bg-card">←</button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Meu Perfil</h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">
                    Gerencie suas informações pessoais e acompanhe suas consultas
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <Card className="card-soft bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/20 flex items-center justify-center">
                      <Search className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-foreground">{stats.consultations}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Consultas realizadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-soft bg-gradient-to-br from-[hsl(var(--safe)/0.1)] to-[hsl(var(--safe)/0.05)] border-[hsl(var(--safe)/0.3)]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[hsl(var(--safe)/0.2)] flex items-center justify-center">
                      <Pill className="w-6 h-6 text-[hsl(var(--safe))]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.safe_medications}</p>
                      <p className="text-sm text-muted-foreground">Seguros identificados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-soft bg-gradient-to-br from-[hsl(var(--risk)/0.1)] to-[hsl(var(--risk)/0.05)] border-[hsl(var(--risk)/0.3)]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[hsl(var(--risk)/0.2)] flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-[hsl(var(--risk))]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.risk_medications}</p>
                      <p className="text-sm text-muted-foreground">Com risco encontrados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dados Pessoais */}
            <Card className="card-soft animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    Dados Pessoais
                  </CardTitle>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={handleEdit} className="flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      Editar Perfil
                    </Button>
                  ) : (
                    <button onClick={handleCancel} className="p-2 rounded-md hover:bg-secondary transition-colors" title="Cancelar">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!editing ? (
                  /* ── MODO VISUALIZAÇÃO ─────────────────────────────── */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {profile.profile_type && (
                      <div className="md:col-span-2 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5" /> Perfil de Uso
                        </p>
                        <p className="text-sm text-foreground font-medium">
                          {PROFILE_TYPE_LABELS[profile.profile_type] ?? profile.profile_type}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Nome Completo
                      </p>
                      <p className="text-sm text-foreground">{displayVal(profile.full_name)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> E-mail
                      </p>
                      <p className="text-sm text-foreground">{displayVal(profile.email)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Data de Nascimento
                      </p>
                      <p className="text-sm text-foreground">{formatDate(profile.birth_date)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sexo</p>
                      <p className="text-sm text-foreground">{GENDER_LABELS[profile.gender] ?? displayVal(profile.gender)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Telefone
                      </p>
                      <p className="text-sm text-foreground">{displayVal(profile.phone)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> Profissão
                      </p>
                      <p className="text-sm text-foreground">{displayVal(profile.profession)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Cidade / Estado
                      </p>
                      <p className="text-sm text-foreground">
                        {profile.city && profile.state
                          ? `${profile.city} / ${profile.state}`
                          : profile.city || profile.state || "—"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--caution))]" /> Alergias
                      </p>
                      <p className="text-sm text-foreground">{displayVal(profile.allergy_info)}</p>
                    </div>

                    {profile.observation && (
                      <div className="md:col-span-2 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Observações
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{profile.observation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── MODO EDIÇÃO ───────────────────────────────────── */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Perfil de Uso — somente leitura mesmo em modo edição */}
                    {draft.profile_type && (
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-foreground font-medium flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-primary" /> Perfil de Uso
                        </Label>
                        <div className="px-4 py-3 rounded-lg border border-border bg-secondary/50 text-sm text-foreground">
                          {PROFILE_TYPE_LABELS[draft.profile_type] ?? draft.profile_type}
                        </div>
                        <p className="text-xs text-muted-foreground">Para alterar, entre em contato com o suporte.</p>
                      </div>
                    )}

                    {/* Nome Completo */}
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-foreground font-medium">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="full_name" value={draft.full_name}
                          onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                          placeholder="Seu nome completo" className="input-soft pl-12"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground font-medium">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input id="email" type="email" value={draft.email} className="input-soft pl-12" disabled />
                      </div>
                      <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
                    </div>

                    {/* Data de Nascimento */}
                    <div className="space-y-2">
                      <Label htmlFor="birth_date" className="text-foreground font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" /> Data de Nascimento
                      </Label>
                      <Input
                        id="birth_date" type="date" value={draft.birth_date}
                        onChange={(e) => setDraft({ ...draft, birth_date: e.target.value })}
                        className="input-soft"
                      />
                    </div>

                    {/* Sexo */}
                    <div className="space-y-2">
                      <Label className="text-foreground font-medium">Sexo</Label>
                      <select
                        value={draft.gender}
                        onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Selecione</option>
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground font-medium">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone" type="tel" value={draft.phone}
                          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                          placeholder="(00) 00000-0000" className="input-soft pl-12"
                        />
                      </div>
                    </div>

                    {/* Profissão */}
                    <div className="space-y-2">
                      <Label htmlFor="profession" className="text-foreground font-medium flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" /> Profissão
                      </Label>
                      <Input
                        id="profession" value={draft.profession}
                        onChange={(e) => setDraft({ ...draft, profession: e.target.value })}
                        placeholder="Ex: Engenheira, Professora..." className="input-soft"
                      />
                    </div>

                    {/* Cidade */}
                    <div className="space-y-2">
                      <Label className="text-foreground font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" /> Cidade
                      </Label>
                      <Input
                        value={draft.city}
                        onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                        placeholder="Sua cidade" className="input-soft"
                      />
                    </div>

                    {/* Estado */}
                    <div className="space-y-2">
                      <Label className="text-foreground font-medium">Estado</Label>
                      <select
                        value={draft.state}
                        onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Selecione o estado</option>
                        {BR_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Alergias */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="allergy_info" className="text-foreground font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[hsl(var(--caution))]" /> Alergias
                      </Label>
                      <Input
                        id="allergy_info" value={draft.allergy_info}
                        onChange={(e) => setDraft({ ...draft, allergy_info: e.target.value })}
                        placeholder="Ex: APLV, ovo, soja..." className="input-soft"
                      />
                    </div>

                    {/* Observações */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="observation" className="text-foreground font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Observações
                      </Label>
                      <Textarea
                        id="observation" value={draft.observation}
                        onChange={(e) => setDraft({ ...draft, observation: e.target.value })}
                        placeholder="Informações adicionais importantes..."
                        className="input-soft min-h-[120px] resize-none"
                      />
                    </div>

                    {/* Botões */}
                    <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                      <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancelar</Button>
                      <Button onClick={handleSave} disabled={saving} className="btn-primary px-8">
                        {saving ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Baby Manager — apenas para Mãe ou Pai */}
            {isParent && (
              <div className="mt-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <BabyManager />
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
