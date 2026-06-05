"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "neutral";

type ThemeContextType = {
  theme: Theme;
  darkMode: boolean;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  darkMode: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") ?? "dark") as Theme;
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  function applyTheme(t: Theme) {
    const html = document.documentElement;
    html.classList.remove("dark", "neutral");
    if (t === "dark") html.classList.add("dark");
    if (t === "neutral") html.classList.add("neutral");
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem("theme", t);
  }

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : theme === "light" ? "neutral" : "dark";
    setTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, darkMode: theme === "dark", setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
