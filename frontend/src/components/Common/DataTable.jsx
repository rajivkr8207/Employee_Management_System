import { ChevronUp, ChevronDown } from "lucide-react";
import EmptyState from "./EmptyState";

/* ── Skeleton row ── */
function SkeletonRow({ cols }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 rounded skeleton" style={{ width: `${60 + (i % 3) * 20}%` }} />
                </td>
            ))}
        </tr>
    );
}

/* ── Sort indicator ── */
function SortIcon({ col, sortKey, sortDir }) {
    if (!col.sortable) return null;
    const isActive = sortKey === col.key;
    return (
        <span className="inline-flex flex-col ml-1.5 opacity-50 group-hover:opacity-100">
            <ChevronUp
                size={10}
                className={isActive && sortDir === "asc" ? "text-[var(--primary)] opacity-100" : ""}
            />
            <ChevronDown
                size={10}
                className={isActive && sortDir === "desc" ? "text-[var(--primary)] opacity-100" : ""}
                style={{ marginTop: "-2px" }}
            />
        </span>
    );
}

export default function DataTable({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = "No records found",
    emptyDescription,
    onSort,
    sortKey,
    sortDir = "asc",
    className = "",
    striped = false,
}) {
    const skeletonCount = 5;

    return (
        <div className={`w-full overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] ${className}`}>
            <table className="w-full border-collapse text-sm">
                {/* ── Header ── */}
                <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                scope="col"
                                onClick={col.sortable ? () => onSort?.(col.key) : undefined}
                                className={[
                                    "px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap select-none group",
                                    col.sortable ? "cursor-pointer hover:text-[var(--text-primary)] transition-colors duration-150" : "",
                                    col.width ? `w-[${col.width}]` : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            >
                                <span className="inline-flex items-center">
                                    {col.header}
                                    <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* ── Body ── */}
                <tbody className="bg-[var(--surface)] divide-y divide-[var(--border)]">
                    {loading ? (
                        Array.from({ length: skeletonCount }).map((_, i) => (
                            <SkeletonRow key={i} cols={columns.length} />
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length}>
                                <EmptyState
                                    title={emptyMessage}
                                    description={emptyDescription}
                                />
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIdx) => (
                            <tr
                                key={row.id ?? rowIdx}
                                className={[
                                    "transition-colors duration-100",
                                    "hover:bg-[var(--surface-secondary)]",
                                    striped && rowIdx % 2 === 1
                                        ? "bg-[var(--background)]"
                                        : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className="px-4 py-3 text-[var(--text-primary)] whitespace-nowrap"
                                    >
                                        {col.render
                                            ? col.render(row[col.key], row, rowIdx)
                                            : row[col.key] ?? "—"}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

