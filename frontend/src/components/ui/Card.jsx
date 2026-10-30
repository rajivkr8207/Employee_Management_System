const paddings = {
    none: "",
    sm:   "p-4",
    md:   "p-5",
    lg:   "p-6",
};

// ─── Root Card ──────────────────────────────────────────────────────────────
function Card({ children, className = "", padding = "md", hover = false, noBorder = false }) {
    return (
        <div
            className={[
                "bg-[var(--surface)] rounded-[var(--radius-card)]",
                noBorder ? "" : "border border-[var(--border)]",
                "shadow-[var(--shadow-xs)]",
                paddings[padding] ?? paddings.md,
                hover
                    ? "transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 cursor-pointer"
                    : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    );
}

// ─── Card.Header ────────────────────────────────────────────────────────────
function CardHeader({ children, className = "", withBorder = false }) {
    return (
        <div
            className={[
                "flex items-center justify-between",
                withBorder
                    ? "pb-4 mb-4 border-b border-[var(--border)]"
                    : "pb-4",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    );
}

// ─── Card.Title ─────────────────────────────────────────────────────────────
function CardTitle({ children, className = "" }) {
    return (
        <h3 className={`text-base font-semibold text-[var(--text-primary)] leading-snug ${className}`}>
            {children}
        </h3>
    );
}

// ─── Card.Body ──────────────────────────────────────────────────────────────
function CardBody({ children, className = "" }) {
    return <div className={className}>{children}</div>;
}

// ─── Card.Footer ────────────────────────────────────────────────────────────
function CardFooter({ children, className = "" }) {
    return (
        <div
            className={[
                "pt-4 mt-4 border-t border-[var(--border)] flex items-center gap-3",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    );
}

Card.Header = CardHeader;
Card.Title  = CardTitle;
Card.Body   = CardBody;
Card.Footer = CardFooter;

export default Card;
