import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Plus, Search, FlaskConical, Upload } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Lab = {
  id: string;
  name: string;
  photo_url: string | null;
};

const LaboratoriesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [user, authLoading, navigate]);

  const fetchLabs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("laboratories")
      .select("id, name, photo_url")
      .order("name", { ascending: true });
    if (!error && data) setLabs(data as Lab[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const filtered = search.trim()
    ? labs.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
    : labs;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    let photoUrl: string | null = null;

    if (newPhoto) {
      const ext = newPhoto.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("laboratory-photos")
        .upload(path, newPhoto);
      if (!upErr) {
        const { data: urlData } = supabase.storage
          .from("laboratory-photos")
          .getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from("laboratories")
      .insert({ name: newName.trim(), photo_url: photoUrl } as any);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível adicionar o laboratório.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Laboratório adicionado!" });
      setNewName("");
      setNewPhoto(null);
      setDialogOpen(false);
      fetchLabs();
    }
    setSubmitting(false);
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <button onClick={() => setDrawerOpen(true)}>
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Laboratórios</h1>
          <div className="w-6" />
        </header>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="h-[85vh]">
            <Sidebar isDrawer onClose={() => setDrawerOpen(false)} />
          </DrawerContent>
        </Drawer>

        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Laboratórios</h1>
              <p className="text-sm text-muted-foreground">{labs.length} laboratórios cadastrados</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar laboratório
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar laboratório..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="card-soft p-4 space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FlaskConical className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum laboratório encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((lab) => (
                <div
                  key={lab.id}
                  className="card-soft p-4 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {lab.photo_url ? (
                      <img
                        src={lab.photo_url}
                        alt={lab.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <FlaskConical className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{lab.name}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Laboratório</DialogTitle>
            <DialogDescription>Insira o nome e a foto do laboratório</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Laboratório</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Eurofarma"
              />
            </div>
            <div className="space-y-2">
              <Label>Foto do Laboratório</Label>
              <label className="flex items-center gap-2 cursor-pointer border border-input rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
                <Upload className="w-4 h-4" />
                {newPhoto ? newPhoto.name : "Selecionar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setNewPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <Button onClick={handleAdd} disabled={submitting || !newName.trim()} className="w-full">
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LaboratoriesPage;
