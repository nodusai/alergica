import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import mascotImage from "@/assets/mascot.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm animate-fade-in">
        <img src={mascotImage} alt="" className="w-28 h-28 mx-auto object-contain animate-float" />
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Erro 404</p>
        <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-foreground mt-2">Página não encontrada</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          O endereço pode ter mudado ou não existe mais.
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center justify-center h-12 py-0 px-8 mt-8"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
