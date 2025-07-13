"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: string;
  setAccent: (accent: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [accent, setAccentState] = useState<string>("262 83% 58%"); // purple-800

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    const savedAccent = localStorage.getItem("accent");

    if (savedTheme) setThemeState(savedTheme);
    if (savedAccent) setAccentState(savedAccent);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    localStorage.setItem("accent", accent);
  }, [accent]);

  const setTheme = (theme: Theme) => setThemeState(theme);
  const setAccent = (accent: string) => setAccentState(accent);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
