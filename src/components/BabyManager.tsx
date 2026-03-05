import { useState, useEffect } from "react";
import { Plus, Trash2, Baby, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BabyData {
  id: string;
  name: string;
  birth_date: string | null;
}

const BabyManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [babies, setBabies] = useState<BabyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBabyName, setNewBabyName] = useState("");
  const [newBabyBirthDate, setNewBabyBirthDate] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchBabies();
  }, [user]);

  const fetchBabies = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("babies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setBabies(data);
    }
    setLoading(false);
  };

  const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (today.getDate() < birth.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }

    if (years === 0) {
      return months === 1 ? "1 mês" : `${months} meses`;
    } else if (years === 1 && months === 0) {
      return "1 ano";
    } else if (years >= 1 && months === 0) {
      return `${years} anos`;
    } else {
      return `${years} ano${years > 1 ? "s" : ""} e ${months} mês${months > 1 ? "es" : ""}`;
    }
  };

  const handleAddBaby = async () => {
    if (!user || !newBabyName.trim()) return;

    setAdding(true);

    const { error } = await supabase.from("babies").insert({
      user_id: user.id,
      name: newBabyName.trim(),
      birth_date: newBabyBirthDate || null,
    });

    setAdding(false);

    if (error) {
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o bebê. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bebê adicionado!",
        description: `${newBabyName} foi adicionado com sucesso.`,
      });
      setNewBabyName("");
      setNewBabyBirthDate("");
      fetchBabies();
    }
  };

  const handleRemoveBaby = async (babyId: string, babyName: string) => {
    const { error } = await supabase.from("babies").delete().eq("id", babyId);

    if (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o bebê. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bebê removido",
        description: `${babyName} foi removido.`,
      });
      fetchBabies();
    }
  };

  if (loading) {
    return (
      <Card className="card-soft">
        <CardContent className="p-6">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Baby className="w-5 h-5 text-primary" />
          Meus Bebês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Babies List */}
        {babies.length > 0 && (
          <div className="space-y-3">
            {babies.map((baby) => (
              <div
                key={baby.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Baby className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{baby.name}</p>
                    {baby.birth_date && (
                      <p className="text-sm text-muted-foreground">
                        {calculateAge(baby.birth_date)}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBaby(baby.id, baby.name)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  title="Remover bebê"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Baby Form */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-4">Adicionar novo bebê</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baby_name" className="text-foreground">
                Nome do Bebê
              </Label>
              <div className="relative">
                <Baby className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="baby_name"
                  value={newBabyName}
                  onChange={(e) => setNewBabyName(e.target.value)}
                  placeholder="Nome do bebê"
                  className="input-soft pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baby_birth_date" className="text-foreground">
                Data de Nascimento
              </Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="baby_birth_date"
                  type="date"
                  value={newBabyBirthDate}
                  onChange={(e) => setNewBabyBirthDate(e.target.value)}
                  className="input-soft pl-12"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleAddBaby}
            disabled={!newBabyName.trim() || adding}
            className="btn-primary mt-4 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {adding ? "Adicionando..." : "Adicionar Bebê"}
          </Button>
        </div>

        {babies.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Você ainda não adicionou nenhum bebê.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BabyManager;
