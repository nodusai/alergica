import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, Loader2, CheckCircle, Edit2, RotateCcw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import mascotImage from "@/assets/mascot.png";

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string;

type Step = "welcome" | "input" | "loading" | "result" | "editing";

const HEALTH_PROFESSIONAL_TYPES = ["farmaceutico", "medico"];

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  profileType?: string | null;
}

const OnboardingModal = ({ open, onComplete, profileType }: OnboardingModalProps) => {
  const isHealthProfessional = !!profileType && HEALTH_PROFESSIONAL_TYPES.includes(profileType);
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("welcome");
  const [allergyInput, setAllergyInput] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [editedResult, setEditedResult] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const callN8nWebhook = async (text: string): Promise<string> => {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allergies: text }),
    });
    if (!response.ok) throw new Error("Erro na resposta do servidor");
    const data = await response.json();
    // aceita qualquer campo que o n8n retornar com o resultado
    return (
      data.result ??
      data.analysis ??
      data.output ??
      data.alergia ??
      data.alergias ??
      (typeof data === "string" ? data : JSON.stringify(data, null, 2))
    );
  };

  const handleConfigureProfile = async () => {
    if (!allergyInput.trim()) {
      setError("Por favor, informe pelo menos uma alergia.");
      return;
    }
    setError("");
    setStep("loading");
    try {
      const result = await callN8nWebhook(allergyInput);
      setAiResult(result);
      setEditedResult(result);
      setStep("result");
    } catch {
      setError("Erro ao conectar com o assistente. Tente novamente.");
      setStep("input");
    }
  };

  const saveAllergyInfo = async (data: string) => {
    setSaving(true);
    if (user) {
      await supabase
        .from("profiles")
        .upsert({ user_id: user.id, allergy_info: data }, { onConflict: "user_id" });
    }
    setSaving(false);
    onComplete();
  };

  const handleApprove = () => saveAllergyInfo(aiResult);
  const handleSaveAndApprove = () => saveAllergyInfo(editedResult);

  const handleReanalyze = async () => {
    setError("");
    setStep("loading");
    try {
      const result = await callN8nWebhook(editedResult);
      setAiResult(result);
      setEditedResult(result);
      setStep("result");
    } catch {
      setError("Erro ao conectar com o assistente. Tente novamente.");
      setStep("editing");
    }
  };

  const isWelcome = step === "welcome";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onComplete(); }}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl bg-card rounded-3xl transition-all"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* STEP: WELCOME */}
        {step === "welcome" && (
          <div className="p-8 text-center animate-fade-in">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-110" />
              <img
                src={mascotImage}
                alt="AlerGica mascot acenando"
                className="relative w-40 h-40 object-contain mx-auto animate-float"
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Boas-vindas ao AlerGica! 🎉
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Gerenciar restrições alimentares exige precisão e cuidado constante.
              Sabemos que conviver com alergias é um desafio diário.{" "}
              Por isso, nossa plataforma foi desenvolvida para ajudar você a rastrear e
              identificar alérgenos ocultos na composição de medicamentos, alimentos e
              produtos.{" "}
              Entregamos a clareza necessária para você ter mais autonomia e segurança
              em cada escolha.
            </p>
            <button
              onClick={() => isHealthProfessional ? onComplete() : setStep("input")}
              className="btn-primary w-full text-lg"
            >
              Entendi
            </button>
          </div>
        )}

        {/* STEP: INPUT */}
        {step === "input" && (
          <div className="p-8 animate-fade-in">
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Quais são suas alergias?
              </h2>
              <p className="text-sm text-muted-foreground">
                Você pode informar mais de uma — escreva à vontade, separando por vírgula ou em linhas diferentes.
              </p>
            </div>

            <textarea
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              placeholder={`Ex: APLV (Alergia ao Leite de Vaca)\nGlúten\nOvo`}
              rows={5}
              className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-colors leading-relaxed ${
                error ? "border-destructive" : "border-border"
              }`}
            />
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}

            <button
              onClick={handleConfigureProfile}
              className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Configurar Perfil com IA
            </button>
          </div>
        )}

        {/* STEP: LOADING */}
        {step === "loading" && (
          <div className="p-10 flex flex-col items-center justify-center text-center animate-fade-in gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Analisando suas alergias...
              </h3>
              <p className="text-sm text-muted-foreground">
                Nossa IA está mapeando alérgenos relacionados ao seu perfil.
              </p>
            </div>
          </div>
        )}

        {/* STEP: RESULT */}
        {step === "result" && (
          <div className="p-8 animate-fade-in">
            <div className="mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Perfil gerado pela IA
              </h2>
              <p className="text-sm text-muted-foreground">
                Revise o resultado antes de salvar. Você pode editar se necessário.
              </p>
            </div>

            <div className="w-full px-4 py-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-foreground leading-relaxed whitespace-pre-wrap min-h-[100px]">
              {aiResult}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep("editing")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-secondary transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleApprove}
                disabled={saving}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Aprovar
              </button>
            </div>
          </div>
        )}

        {/* STEP: EDITING */}
        {step === "editing" && (
          <div className="p-8 animate-fade-in">
            <div className="mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Edit2 className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Edite o resultado
              </h2>
              <p className="text-sm text-muted-foreground">
                Ajuste como quiser e depois salve ou peça uma nova análise.
              </p>
            </div>

            <textarea
              value={editedResult}
              onChange={(e) => setEditedResult(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-colors leading-relaxed"
            />
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleReanalyze}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-secondary transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Analisar novamente
              </button>
              <button
                onClick={handleSaveAndApprove}
                disabled={saving}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar e Aprovar
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
