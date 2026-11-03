export const THEME_KEY = "ems-theme";

export function getInitialTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);

        if (saved === "light" || saved === "dark") {
            return saved;
        }
    } catch {
        // Storage unavailable
    }

    return window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches
        ? "dark"
        : "light";
}

export function applyTheme(theme) {
    document.documentElement.classList.toggle(
        "dark",
        theme === "dark"
    );

    document.documentElement.style.colorScheme = theme;

    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        // Theme still works for the current session
    }
}