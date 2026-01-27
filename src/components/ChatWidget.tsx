import { useState } from "react";
import { X, ArrowLeft, Send, MessageCircle, Lightbulb, MessageSquareHeart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import mascotImage from "@/assets/mascot.png";

type WidgetView = "menu" | "support" | "suggestion" | "feedback";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<WidgetView>("menu");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setView("menu");
      setContent("");
    }, 300);
  };

  const handleSubmit = async (type: "suggestion" | "feedback") => {
    if (!user || !content.trim()) return;

    setSending(true);

    const table = type === "suggestion" ? "suggestions" : "feedback";
    const { error } = await supabase.from(table).insert({
      user_id: user.id,
      content: content.trim(),
    });

    setSending(false);

    if (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: type === "suggestion" ? "Sugestão enviada!" : "Feedback enviado!",
        description: "Obrigado por nos ajudar a melhorar! 💚",
      });
      handleClose();
    }
  };

  const menuOptions = [
    {
      id: "support",
      icon: MessageCircle,
      label: "Suporte",
      description: "Fale com nossa equipe",
    },
    {
      id: "suggestion",
      icon: Lightbulb,
      label: "Sugestão",
      description: "Nos ajude a melhorar",
    },
    {
      id: "feedback",
      icon: MessageSquareHeart,
      label: "Feedback",
      description: "Conte sua experiência",
    },
  ];

  return (
    <>
      {/* Mascot Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-card shadow-lg border-2 border-primary/30 transition-all duration-300 hover:scale-110 hover:shadow-xl ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <img
          src={mascotImage}
          alt="AlerGica Mascote"
          className="w-full h-full object-contain p-1"
        />
      </button>

      {/* Widget Panel */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-80 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-300 ${
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-primary/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== "menu" && (
              <button
                onClick={() => {
                  setView("menu");
                  setContent("");
                }}
                className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-primary" />
              </button>
            )}
            <img src={mascotImage} alt="Mascote" className="w-10 h-10 object-contain" />
            <div>
              <h3 className="font-bold text-foreground">AlerGica</h3>
              <p className="text-xs text-muted-foreground">
                {view === "menu" && "Como posso ajudar?"}
                {view === "support" && "Suporte"}
                {view === "suggestion" && "Sugestão"}
                {view === "feedback" && "Feedback"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Menu View */}
          {view === "menu" && (
            <div className="space-y-2 animate-fade-in">
              {menuOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setView(option.id as WidgetView)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <option.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Support View */}
          {view === "support" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-secondary/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Olá! Como posso ajudar você hoje? Digite sua mensagem abaixo.
                </p>
              </div>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="w-full p-3 pr-12 rounded-xl border-2 border-input bg-background resize-none h-24 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <button
                  disabled={!content.trim()}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-105"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Em breve responderemos sua mensagem! 💚
              </p>
            </div>
          )}

          {/* Suggestion View */}
          {view === "suggestion" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-secondary/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Sua sugestão é muito importante para nós! O que você gostaria de ver no AlerGica?
                </p>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite sua sugestão..."
                className="w-full p-3 rounded-xl border-2 border-input bg-background resize-none h-24 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                onClick={() => handleSubmit("suggestion")}
                disabled={!content.trim() || sending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-105 flex items-center justify-center gap-2"
              >
                {sending ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Sugestão
                  </>
                )}
              </button>
            </div>
          )}

          {/* Feedback View */}
          {view === "feedback" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-secondary/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Conte para nós como está sendo sua experiência com o AlerGica!
                </p>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite seu feedback..."
                className="w-full p-3 rounded-xl border-2 border-input bg-background resize-none h-24 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                onClick={() => handleSubmit("feedback")}
                disabled={!content.trim() || sending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-105 flex items-center justify-center gap-2"
              >
                {sending ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Feedback
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
