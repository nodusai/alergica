import { Home, User, Settings, LogOut, Pill, Stethoscope } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { getProfileSummary, type ProfileSummary } from "@/services/profile";
import { initials, nameFromEmail, shortName } from "@/lib/names";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar";

const NAV_ITEMS = [
  { icon: Home, label: "Início", path: "/dashboard" },
  { icon: User, label: "Meu Perfil", path: "/profile" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

/** Rótulo profissional exibido abaixo do nome (só para farmacêutico e médico), conforme o sexo informado */
const professionalRole = (profile: ProfileSummary | null) => {
  const g = profile?.gender;
  const pick = (f: string, m: string, n: string) => (g === "feminino" ? f : g === "masculino" ? m : n);
  if (profile?.profile_type === "farmaceutico")
    return { icon: Pill, label: pick("Farmacêutica", "Farmacêutico", "Farmacêutico(a)") };
  if (profile?.profile_type === "medico") return { icon: Stethoscope, label: pick("Médica", "Médico", "Médico(a)") };
  return null;
};

const Sidebar = ({ isDrawer = false, onClose }: { isDrawer?: boolean; onClose?: () => void }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getProfileSummary(user.id)
      .then((p) => !cancelled && setProfile(p))
      .catch(() => {})
      .finally(() => !cancelled && setLoadingProfile(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Nome: perfil → nome informado no cadastro → e-mail
  const displayName =
    shortName(profile?.full_name) ||
    shortName(user?.user_metadata?.full_name as string | undefined) ||
    nameFromEmail(user?.email) ||
    "Bem-vindo(a)";
  const role = professionalRole(profile);
  const RoleIcon = role?.icon;

  const handleSignOut = async () => {
    await signOut();
    onClose?.();
    navigate("/");
  };

  return (
    <aside
      className={`${
        isDrawer ? "w-full h-full overflow-y-auto" : "fixed left-0 top-0 h-screen w-64 border-r border-sidebar-border"
      } bg-sidebar flex flex-col`}
    >
      {/* Logo + tema */}
      <div className="px-6 pt-6 pb-5 flex items-center justify-between">
        <NavLink
          to="/dashboard"
          onClick={isDrawer ? onClose : undefined}
          className={`text-xl font-extrabold tracking-[-0.02em] text-sidebar-foreground rounded ${focusRing}`}
        >
          Aler<span className="text-[hsl(152_55%_38%)] dark:text-primary">Gica</span>
        </NavLink>
        {!isDrawer && <ThemeToggle />}
      </div>

      {/* Cartão do usuário */}
      <div className="px-4">
        <NavLink
          to="/profile"
          onClick={isDrawer ? onClose : undefined}
          aria-label={`Meu perfil: ${displayName}`}
          className={`group flex items-center gap-3 rounded-2xl p-3 bg-[radial-gradient(120%_120%_at_0%_0%,hsl(var(--primary)/0.22)_0%,transparent_60%)] bg-sidebar-accent/60 border border-sidebar-border hover:border-primary/40 active:scale-[0.98] transition-transform duration-150 ${focusRing}`}
        >
          <span
            aria-hidden
            className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-[hsl(152_70%_62%)] to-[hsl(165_55%_42%)] text-white text-sm font-extrabold tracking-wide flex items-center justify-center shadow-[0_1px_2px_hsl(160_40%_15%/0.15),0_6px_14px_-6px_hsl(160_50%_30%/0.6)]"
          >
            {loadingProfile ? "" : initials(displayName) || <User className="w-5 h-5" />}
          </span>
          <span className="min-w-0 flex-1">
            {loadingProfile ? (
              <span className="block space-y-1.5" aria-hidden>
                <span className="block h-3.5 w-28 rounded bg-sidebar-border animate-pulse" />
                <span className="block h-3 w-16 rounded bg-sidebar-border animate-pulse" />
              </span>
            ) : (
              <>
                <span className="block text-[15px] font-bold text-sidebar-foreground leading-tight truncate">
                  {displayName}
                </span>
                {role && RoleIcon ? (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-[hsl(152_55%_28%)] dark:text-primary">
                    <RoleIcon className="w-3 h-3" />
                    {role.label}
                  </span>
                ) : (
                  <span className="block text-xs text-muted-foreground mt-0.5">Ver meu perfil</span>
                )}
              </>
            )}
          </span>
        </NavLink>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-4 pt-6" aria-label="Menu principal">
        <p className="px-3 mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground/80">Menu</p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={isDrawer ? onClose : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold transition-colors duration-200 active:scale-[0.98] ${focusRing} ${
                    isActive
                      ? "bg-primary/15 text-sidebar-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  {isActive && (
                    <span aria-hidden className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                  )}
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-sidebar-accent text-sidebar-foreground/70"
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                  </span>
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Rodapé */}
      <div className="px-4 pb-5 pt-4 border-t border-sidebar-border space-y-3">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold text-sidebar-foreground/75 hover:bg-destructive/10 hover:text-destructive active:scale-[0.98] transition-transform ${focusRing}`}
        >
          <span className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
            <LogOut className="w-[18px] h-[18px]" />
          </span>
          Sair
        </button>
        <div className="px-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <NavLink
            to="/privacidade"
            onClick={isDrawer ? onClose : undefined}
            className={`hover:text-foreground hover:underline underline-offset-4 rounded ${focusRing}`}
          >
            Privacidade
          </NavLink>
          <span aria-hidden>·</span>
          <NavLink
            to="/termos"
            onClick={isDrawer ? onClose : undefined}
            className={`hover:text-foreground hover:underline underline-offset-4 rounded ${focusRing}`}
          >
            Termos de Uso
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
