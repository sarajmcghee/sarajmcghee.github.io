import { useEffect, useState } from "react";

// Three states, matching DESIGN.md: "system" stamps nothing and lets
// prefers-color-scheme decide; "light"/"dark" stamp data-theme and win over the OS.
const ORDER = ["system", "light", "dark"];

const LABEL = {
  system: "Match system",
  light: "Light",
  dark: "Dark",
};

function apply(mode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState(() => {
    if (typeof localStorage === "undefined") return "system";
    return localStorage.getItem("theme") ?? "system";
  });

  useEffect(() => {
    apply(mode);
    localStorage.setItem("theme", mode);
  }, [mode]);

  const next = () => setMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]);

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`Theme: ${LABEL[mode]}. Click to change.`}
      className="label cursor-pointer rounded-sm border border-rule px-2.5 py-1 text-faint transition-colors duration-200 hover:border-maple hover:text-maple"
    >
      {LABEL[mode]}
    </button>
  );
}
