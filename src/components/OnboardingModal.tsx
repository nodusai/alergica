import { Dialog, DialogContent } from "@/components/ui/dialog";
import mascotImage from "@/assets/mascot.png";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl bg-card rounded-3xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="p-8 text-center">
          {/* Mascot Image */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-110" />
            <img 
              src={mascotImage} 
              alt="AlerGica mascot acenando" 
              className="relative w-40 h-40 object-contain mx-auto animate-float"
            />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Boas-vindas ao AlerGica! 🎉
          </h2>

          {/* Body Text */}
          <p className="text-muted-foreground leading-relaxed mb-8">
            Sabemos como a dieta APLV é desafiadora. Estamos aqui para te ajudar a identificar 
            componentes derivados do leite em medicamentos e excipientes, garantindo a segurança 
            da sua amamentação.
          </p>

          {/* CTA Button */}
          <button 
            onClick={onComplete}
            className="btn-primary w-full text-lg"
          >
            Entendi, vamos começar!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
