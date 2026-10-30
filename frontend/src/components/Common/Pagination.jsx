import { ChevronLeft, ChevronRight } from "lucide-react";

function getPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [];

    if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", total);
    } else if (current >= total - 3) {
        pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
    } else {
        pages.push(1, "...", current - 1, current, current + 1, "...", total);
    }

    return pages;
}

export default function Pagination({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalItems,
    itemsPerPage = 10,
}) {
    if (totalPages <= 1) return null;

    const from = (currentPage - 1) * itemsPerPage + 1;
    const to   = Math.min(currentPage * itemsPerPage, totalItems ?? currentPage * itemsPerPage);

    const pages = getPageRange(currentPage, totalPages);

    const btnBase =
        "inline-flex items-center justify-center h-9 min-w-[36px] px-2 rounded-[var(--radius-control)] text-sm font-medium transition-colors duration-150 border";

    const btnDefault =
        "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]";

    const btnActive =
        "bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm";

    const btnDisabled =
        "opacity-40 cursor-not-allowed pointer-events-none";

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            {/* Count */}
            {totalItems != null && (
                <p className="text-sm text-[var(--text-muted)] shrink-0">
                    Showing{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                        {from}–{to}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                        {totalItems}
                    </span>{" "}
                    entries
                </p>
            )}

            {/* Controls */}
            <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                    type="button"
                    onClick={() => onPageChange?.(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={[btnBase, btnDefault, currentPage === 1 ? btnDisabled : ""].join(" ")}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Pages */}
                {pages.map((p, i) =>
                    p === "..." ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="inline-flex items-center justify-center h-9 w-9 text-sm text-[var(--text-muted)]"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange?.(p)}
                            className={[
                                btnBase,
                                p === currentPage ? btnActive : btnDefault,
                            ].join(" ")}
                            aria-current={p === currentPage ? "page" : undefined}
                        >
                            {p}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    type="button"
                    onClick={() => onPageChange?.(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={[btnBase, btnDefault, currentPage === totalPages ? btnDisabled : ""].join(" ")}
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

