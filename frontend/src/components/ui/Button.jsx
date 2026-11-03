import { Loader2 } from "lucide-react";

const base =
    "inline-flex items-center justify-center font-medium transition-all duration-150 select-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 active:scale-[0.97]";

const variants = {
    primary:
        "bg-[var(--primary)] text-white border border-transparent hover:bg-[var(--primary-hover)] shadow-sm",
    secondary:
        "bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--border)]",
    outline:
        "bg-transparent text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary-soft)]",
    ghost:
        "bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
    danger:
        "bg-[var(--danger)] text-white border border-transparent hover:opacity-90 shadow-sm",
    "danger-outline":
        "bg-transparent text-[var(--danger)] border border-[var(--danger)] hover:bg-[var(--danger-soft)]",
};

const sizes = {
    xs: "h-7 px-2.5 text-xs gap-1 rounded-md",
    sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
    md: "h-10 px-4 text-sm gap-2 rounded-[var(--radius-control)]",
    lg: "h-11 px-5 text-sm gap-2 rounded-[var(--radius-control)]",
    xl: "h-12 px-6 text-base gap-2 rounded-[var(--radius-card)]",
};

export default function Button({
    children,
    variant = "primary",
    size = "md",
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    className = "",
    type = "button",
    ...rest
}) {
    const isDisabled = disabled || loading;
    const iconSize = size === "xs" || size === "sm" ? 13 : 15;

    return (
        <button
            type={type}
            disabled={isDisabled}
            className={[
                base,
                variants[variant] ?? variants.primary,
                sizes[size] ?? sizes.md,
                isDisabled ? "opacity-55 !cursor-not-allowed" : "cursor-pointer",
                className,
            ].join(" ")}
            {...rest}
        >
            {loading ? (
                <Loader2 size={iconSize} className="animate-spin shrink-0" />
            ) : Icon ? (
                <Icon size={iconSize} className="shrink-0" />
            ) : null}

            {children && <span>{children}</span>}

            {!loading && IconRight && (
                <IconRight size={iconSize} className="shrink-0" />
            )}
        </button>
    );
}
