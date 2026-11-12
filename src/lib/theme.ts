/** Tema claro/escuro: guardado em localStorage("theme") e aplicado pela classe "dark" no <html>. */
const EVENT = "alergica:theme";

export const isDarkTheme = () => document.documentElement.classList.contains("dark");

export const applySavedTheme = () => {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem("theme");
  } catch {
    /* armazenamento indisponível */
  }
  // Só aplica escuro se o usuário escolheu explicitamente — ignora a preferência do sistema
  document.documentElement.classList.toggle("dark", saved === "dark");
};

export const setDarkTheme = (dark: boolean) => {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    /* armazenamento indisponível */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: dark }));
};

/** Avisa quando o tema muda em qualquer lugar do app (mantém os botões sincronizados). */
export const onThemeChange = (cb: (dark: boolean) => void) => {
  const handler = (e: Event) => cb((e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};
