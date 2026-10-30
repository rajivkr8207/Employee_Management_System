import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getInitialTheme } from "../../theme/theme";

export default function ThemeToggle({ showLabel = false }) {
    const [theme, setTheme] = useState(getInitialTheme);
    const isDark = theme === "dark";

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            className={[
                "inline-flex items-center justify-center gap-2 transition-all duration-200",
                "border border-[var(--border)] rounded-[var(--radius-control)]",
                "bg-[var(--surface)] text-[var(--text-secondary)]",
                "hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
                "shadow-[var(--shadow-xs)]",
                showLabel ? "h-9 px-3" : "h-9 w-9",
            ].join(" ")}
        >
            <span className={`flex items-center transition-transform duration-300 ${isDark ? "rotate-0" : "rotate-180"}`}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </span>
            {showLabel && (
                <span className="text-sm font-medium">
                    {isDark ? "Light" : "Dark"}
                </span>
            )}
        </button>
    );
}
