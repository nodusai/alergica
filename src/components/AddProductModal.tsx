import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddProductModal = ({ open, onOpenChange, onSuccess }: AddProductModalProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome_principal: "",
    nome_completo: "",
    nome_alternativo: "",
    composicao: "",
    nivel_alerta: "",
    tem_risco_aplv: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_principal.trim() || !form.nome_completo.trim()) {
      toast.error("Nome principal e nome completo são obrigatórios.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("products").insert({
      nome_principal: form.nome_principal.trim(),
      nome_completo: form.nome_completo.trim(),
      nome_alternativo: form.nome_alternativo.trim() || null,
      composicao: form.composicao.trim() || null,
      nivel_alerta: form.nivel_alerta || null,
      tem_risco_aplv: form.tem_risco_aplv,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao cadastrar produto.");
      return;
    }
    toast.success("Produto cadastrado com sucesso!");
    setForm({ nome_principal: "", nome_completo: "", nome_alternativo: "", composicao: "", nivel_alerta: "", tem_risco_aplv: false });
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome Principal *</Label>
            <Input value={form.nome_principal} onChange={(e) => setForm({ ...form, nome_principal: e.target.value })} />
          </div>
          <div>
            <Label>Nome Completo *</Label>
            <Input value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value })} />
          </div>
          <div>
            <Label>Nome Alternativo</Label>
            <Input value={form.nome_alternativo} onChange={(e) => setForm({ ...form, nome_alternativo: e.target.value })} />
          </div>
          <div>
            <Label>Composição</Label>
            <Textarea value={form.composicao} onChange={(e) => setForm({ ...form, composicao: e.target.value })} rows={3} />
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
          <div className="flex items-center gap-2">
            <Checkbox checked={form.tem_risco_aplv} onCheckedChange={(c) => setForm({ ...form, tem_risco_aplv: !!c })} />
            <Label>Tem risco APLV</Label>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Cadastrar Produto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
