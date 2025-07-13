"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Palette, Sun, Moon } from "lucide-react";

const colors = [
  { name: "Purple", value: "267 80% 48%" },
  { name: "Blue", value: "221.2 83.2% 53.3%" },
  { name: "Green", value: "142.1 70.6% 45.3%" },
  { name: "Pink", value: "318 80% 59%" },
  { name: "Orange", value: "24 94% 50%" },
];

export function AccentModal() {
  const [currentAccent, setCurrentAccent] = useState<string>(
    () => localStorage.getItem("accent-color") || "267 80% 48%"
  );
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "dark") return true;
      if (storedTheme === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", currentAccent);
    localStorage.setItem("accent-color", currentAccent);
  }, [currentAccent]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Palette className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Appearance Settings</DialogTitle>
        </DialogHeader>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">Dark Mode</span>
          <Button
            className="rounded-full"
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Accent Color Picker */}
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                setCurrentAccent(color.value);
                setOpen(false);
              }}
              style={{ backgroundColor: `hsl(${color.value})` }}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                currentAccent === color.value
                  ? "border-black dark:border-white scale-110"
                  : "border-transparent"
              }`}
              aria-label={`Select ${color.name}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
