import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddRestaurantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddRestaurantModal = ({ open, onOpenChange, onSuccess }: AddRestaurantModalProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome_principal: "",
    nome_completo: "",
    nome_alternativo: "",
    descricao: "",
    endereco: "",
    nivel_alerta: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_principal.trim()) {
      toast.error("Nome principal é obrigatório.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("restaurants").insert({
      nome_principal: form.nome_principal.trim(),
      nome_completo: form.nome_completo.trim() || null,
      nome_alternativo: form.nome_alternativo.trim() || null,
      descricao: form.descricao.trim() || null,
      endereco: form.endereco.trim() || null,
      nivel_alerta: form.nivel_alerta || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao cadastrar restaurante.");
      return;
    }
    toast.success("Restaurante cadastrado com sucesso!");
    setForm({ nome_principal: "", nome_completo: "", nome_alternativo: "", descricao: "", endereco: "", nivel_alerta: "" });
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Restaurante</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome Principal *</Label>
            <Input value={form.nome_principal} onChange={(e) => setForm({ ...form, nome_principal: e.target.value })} />
          </div>
          <div>
            <Label>Nome Completo</Label>
            <Input value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value })} />
          </div>
          <div>
            <Label>Nome Alternativo</Label>
            <Input value={form.nome_alternativo} onChange={(e) => setForm({ ...form, nome_alternativo: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </div>
          <div>
            <Label>Nível de Alerta</Label>
            <Select value={form.nivel_alerta} onValueChange={(v) => setForm({ ...form, nivel_alerta: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VERDE">🟢 Verde (Seguro)</SelectItem>
                <SelectItem value="AMARELO">🟡 Amarelo (Atenção)</SelectItem>
                <SelectItem value="VERMELHO">🔴 Vermelho (Risco)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Cadastrar Restaurante"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRestaurantModal;
