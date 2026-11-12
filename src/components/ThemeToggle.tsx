import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { applySavedTheme, isDarkTheme, onThemeChange, setDarkTheme } from "@/lib/theme";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    applySavedTheme();
    setIsDark(isDarkTheme());
    return onThemeChange(setIsDark);
  }, []);

  return (
    <button
      onClick={() => setDarkTheme(!isDark)}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
      className="p-2 rounded-xl hover:bg-sidebar-accent active:scale-90 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {isDark ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
    </button>
  );
};

export default ThemeToggle;
