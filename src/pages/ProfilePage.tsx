import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, AlertTriangle, FileText, Search, ShoppingCart, Pill } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ProfileData {
  full_name: string;
  child_name: string;
  email: string;
  phone: string;
  allergy_info: string;
  observation: string;
}

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    child_name: "",
    email: "",
    phone: "",
    allergy_info: "",
    observation: "",
  });
  
  const [saving, setSaving] = useState(false);

  // Mock stats - in production, these would come from the database
  const stats = {
    consultations: 12,
    medications_purchased: 5,
    safe_medications: 8,
    risk_medications: 3,
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          child_name: data.child_name || "",
          email: user.email || "",
          phone: "",
          allergy_info: "",
          observation: "",
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email: user.email || "",
        }));
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        full_name: profile.full_name,
        child_name: profile.child_name,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas informações pessoais e acompanhe suas consultas
            </p>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Card className="card-soft bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.consultations}</p>
                    <p className="text-sm text-muted-foreground">Consultas realizadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-soft bg-gradient-to-br from-secondary to-secondary/50 border-secondary">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.medications_purchased}</p>
                    <p className="text-sm text-muted-foreground">Remédios comprados</p>
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

          {/* Profile Form */}
          <Card className="card-soft animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-foreground font-medium">
                    Nome Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Seu nome completo"
                      className="input-soft pl-12"
                    />
                  </div>
                </div>

                {/* Child Name */}
                <div className="space-y-2">
                  <Label htmlFor="child_name" className="text-foreground font-medium">
                    Nome do Bebê
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="child_name"
                      value={profile.child_name}
                      onChange={(e) => setProfile({ ...profile, child_name: e.target.value })}
                      placeholder="Nome do seu bebê"
                      className="input-soft pl-12"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="input-soft pl-12"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground font-medium">
                    Telefone para Contato
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="input-soft pl-12"
                    />
                  </div>
                </div>

                {/* Allergy Info */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allergy_info" className="text-foreground font-medium">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[hsl(var(--caution))]" />
                      Alergias
                    </span>
                  </Label>
                  <Input
                    id="allergy_info"
                    value={profile.allergy_info}
                    onChange={(e) => setProfile({ ...profile, allergy_info: e.target.value })}
                    placeholder="Ex: APLV, ovo, soja..."
                    className="input-soft"
                  />
                </div>

                {/* Observation */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observation" className="text-foreground font-medium">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Observações
                    </span>
                  </Label>
                  <Textarea
                    id="observation"
                    value={profile.observation}
                    onChange={(e) => setProfile({ ...profile, observation: e.target.value })}
                    placeholder="Informações adicionais importantes, como remédios que você tem alergia (mesmo sem proteína do leite), ou qualquer outro detalhe relevante..."
                    className="input-soft min-h-[120px] resize-none"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="btn-primary px-8"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
