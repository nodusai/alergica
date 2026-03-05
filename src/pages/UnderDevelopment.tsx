import { useNavigate } from "react-router-dom";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

const UnderDevelopment = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-6">
      <Construction className="w-16 h-16 text-primary" />
      <h1 className="text-2xl font-bold text-foreground">Em Desenvolvimento</h1>
      <p className="text-muted-foreground max-w-md">
        Esta funcionalidade está sendo construída com muito carinho e estará disponível em breve! 💜
      </p>
      <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
    </div>
  );
};

export default UnderDevelopment;
