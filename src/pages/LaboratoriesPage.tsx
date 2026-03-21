import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Plus, Search, FlaskConical, Upload, LayoutGrid, List, Pencil, Trash2, X, Check } from "lucide-react";
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
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  // Add dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Detail/edit dialog
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
    if (!authLoading && user && !isAdmin) navigate("/dashboard");
  }, [user, authLoading, isAdmin, navigate]);

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

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("laboratory-photos").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("laboratory-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    let photoUrl: string | null = null;
    if (newPhoto) photoUrl = await uploadPhoto(newPhoto);

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

  const openDetail = (lab: Lab) => {
    setSelectedLab(lab);
    setEditName(lab.name);
    setEditPhoto(null);
    setEditing(false);
    setDetailOpen(true);
  };

  const handleSave = async () => {
    if (!selectedLab || !editName.trim()) return;
    setSaving(true);
    let photoUrl = selectedLab.photo_url;
    if (editPhoto) {
      const url = await uploadPhoto(editPhoto);
      if (url) photoUrl = url;
    }

    const { error } = await supabase
      .from("laboratories")
      .update({ name: editName.trim(), photo_url: photoUrl } as any)
      .eq("id", selectedLab.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Laboratório atualizado!" });
      setDetailOpen(false);
      fetchLabs();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedLab) return;
    setSaving(true);
    const { error } = await supabase.from("laboratories").delete().eq("id", selectedLab.id);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Laboratório excluído!" });
      setDetailOpen(false);
      fetchLabs();
    }
    setSaving(false);
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

        <main className="p-4 md:p-8 max-w-6xl mx-auto">
          {/* Sticky toolbar */}
          <div className="sticky top-0 lg:top-0 z-20 bg-background pb-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Laboratórios</h1>
                <p className="text-sm text-muted-foreground">{labs.length} laboratórios cadastrados</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-input rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`p-2 transition-colors ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar laboratório
                </Button>
              </div>
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
          </div>

          {/* Content */}
          {loading ? (
            <div className={viewMode === "cards" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-2"}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={viewMode === "cards" ? "card-soft p-4 space-y-3" : "flex items-center gap-4 p-3 rounded-lg border border-border"}>
                  <Skeleton className={viewMode === "cards" ? "aspect-square w-full rounded-lg" : "w-12 h-12 rounded-lg"} />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FlaskConical className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum laboratório encontrado</p>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((lab) => (
                <button
                  key={lab.id}
                  onClick={() => openDetail(lab)}
                  className="card-soft p-4 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow cursor-pointer text-left"
                >
                  <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {lab.photo_url ? (
                      <img src={lab.photo_url} alt={lab.name} className="w-full h-full object-contain" />
                    ) : (
                      <FlaskConical className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{lab.name}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((lab) => (
                <button
                  key={lab.id}
                  onClick={() => openDetail(lab)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {lab.photo_url ? (
                      <img src={lab.photo_url} alt={lab.name} className="w-full h-full object-contain" />
                    ) : (
                      <FlaskConical className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{lab.name}</p>
                </button>
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
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Eurofarma" />
            </div>
            <div className="space-y-2">
              <Label>Foto do Laboratório</Label>
              <label className="flex items-center gap-2 cursor-pointer border border-input rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
                <Upload className="w-4 h-4" />
                {newPhoto ? newPhoto.name : "Selecionar imagem"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewPhoto(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <Button onClick={handleAdd} disabled={submitting || !newName.trim()} className="w-full">
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail/Edit dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Laboratório" : "Detalhes do Laboratório"}</DialogTitle>
            <DialogDescription>{editing ? "Altere o nome ou a foto" : "Visualize, edite ou exclua"}</DialogDescription>
          </DialogHeader>

          {selectedLab && (
            <div className="space-y-4">
              {/* Photo */}
              <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {editPhoto ? (
                  <img src={URL.createObjectURL(editPhoto)} alt="Preview" className="w-full h-full object-contain" />
                ) : selectedLab.photo_url ? (
                  <img src={selectedLab.photo_url} alt={selectedLab.name} className="w-full h-full object-contain" />
                ) : (
                  <FlaskConical className="w-16 h-16 text-muted-foreground" />
                )}
              </div>

              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nova foto</Label>
                    <label className="flex items-center gap-2 cursor-pointer border border-input rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
                      <Upload className="w-4 h-4" />
                      {editPhoto ? editPhoto.name : "Selecionar imagem"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditPhoto(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving || !editName.trim()} className="flex-1 gap-2">
                      <Check className="w-4 h-4" />
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button variant="outline" onClick={() => { setEditing(false); setEditPhoto(null); setEditName(selectedLab.name); }}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-foreground text-center">{selectedLab.name}</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setEditing(true)} variant="outline" className="flex-1 gap-2">
                      <Pencil className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button onClick={handleDelete} variant="destructive" disabled={saving} className="flex-1 gap-2">
                      <Trash2 className="w-4 h-4" />
                      {saving ? "Excluindo..." : "Excluir"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LaboratoriesPage;
