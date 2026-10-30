/* ── Spinner ── */
function Spinner({ size = "md" }) {
    const dims = { sm: "w-5 h-5 border-2", md: "w-8 h-8 border-[3px]", lg: "w-12 h-12 border-4" };
    return (
        <span
            className={[
                "rounded-full border-[var(--border)] border-t-[var(--primary)] animate-spin",
                dims[size] ?? dims.md,
            ].join(" ")}
            role="status"
            aria-label="Loading"
        />
    );
}

/* ── Dots ── */
function Dots() {
    return (
        <div className="flex items-center gap-1.5" role="status" aria-label="Loading">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[var(--primary)]"
                    style={{ animation: `bounceDot 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
            ))}
        </div>
    );
}

/* ── Skeleton rows ── */
function SkeletonRows({ rows = 4 }) {
    return (
        <div className="w-full flex flex-col gap-3" role="status" aria-label="Loading">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-12 w-full rounded-[var(--radius-control)] skeleton"
                    style={{ opacity: 1 - i * 0.15 }}
                />
            ))}
        </div>
    );
}

/* ── Main export ── */
export default function Loader({
    size = "md",
    variant = "spinner",
    text,
    fullPage = false,
    rows,
}) {
    const inner = (
        <div className="flex flex-col items-center justify-center gap-3">
            {variant === "spinner" && <Spinner size={size} />}
            {variant === "dots"    && <Dots />}
            {variant === "skeleton" && <SkeletonRows rows={rows} />}
            {text && (
                <p className="text-sm text-[var(--text-muted)] animate-pulse">{text}</p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm">
                {inner}
            </div>
        );
    }

    return inner;
}

