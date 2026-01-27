import { Home, User, Settings, Pill } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; child_name: string | null } | null>(null);
  
  const navItems = [
    { icon: Home, label: "Início", path: "/dashboard" },
    { icon: User, label: "Meu Perfil", path: "/profile" },
    { icon: Settings, label: "Configurações", path: "/settings" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name, child_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-sidebar-foreground">
              Aler<span className="text-primary">Gica</span>
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === "/dashboard" && location.pathname === "/");
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "sidebar-link-active"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">
              {profile?.full_name || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.child_name ? `Mãe de ${profile.child_name}` : "AlerGica"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
