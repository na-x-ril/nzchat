// lib/themes.ts

export interface Theme {
  name: string;
  background: string; // Tailwind bg-* atau raw hex
  text: string;       // Tailwind text-* atau raw hex
}

export const THEMES: Theme[] = [
  {
    name: "Purple",
    background: "#471396",
    text: "#ffffff",
  },
  {
    name: "Yellow",
    background: "#FFCC00",
    text: "#090040",
  },
  {
    name: "Indigo",
    background: "#4f46e5",
    text: "#ffffff",
  },
  {
    name: "Green",
    background: "#22c55e",
    text: "#ffffff",
  },
  {
    name: "Pink",
    background: "#ec4899",
    text: "#ffffff",
  },
];