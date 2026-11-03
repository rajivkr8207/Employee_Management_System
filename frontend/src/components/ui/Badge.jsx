const variants = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    danger:  "bg-[var(--danger-soft)] text-[var(--danger)]",
    info:    "bg-[var(--info-soft)] text-[var(--info)]",
    neutral: "bg-[var(--surface-secondary)] text-[var(--text-secondary)]",
};

const dotColors = {
    primary: "bg-[var(--primary)]",
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    danger:  "bg-[var(--danger)]",
    info:    "bg-[var(--info)]",
    neutral: "bg-[var(--text-muted)]",
};

const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-0.5 text-xs",
};

export default function Badge({
    children,
    variant = "neutral",
    size = "md",
    dot = false,
    className = "",
}) {
    return (
        <span
            className={[
                "inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap",
                variants[variant] ?? variants.neutral,
                sizes[size] ?? sizes.md,
                className,
            ].join(" ")}
        >
            {dot && (
                <span
                    className={[
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        dotColors[variant] ?? dotColors.neutral,
                    ].join(" ")}
                />
            )}
            {children}
        </span>
    );
}
