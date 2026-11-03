import { Link, useLocation } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";

/* Prettify a URL segment → readable label */
function formatSegment(seg) {
    return seg
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumbs() {
    const { pathname } = useLocation();

    const segments = pathname
        .split("/")
        .filter(Boolean); // remove empty strings

    if (segments.length === 0) {
        return (
            <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-1 text-sm">
                    <li className="flex items-center text-[var(--text-primary)] font-medium">
                        <Home size={15} className="mr-1.5" />
                        Home
                    </li>
                </ol>
            </nav>
        );
    }

    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-sm flex-wrap">
                {/* Home */}
                <li className="flex items-center gap-1">
                    <Link
                        to="/"
                        className="flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150"
                    >
                        <Home size={14} />
                    </Link>
                    <ChevronRight size={13} className="text-[var(--text-muted)]" />
                </li>

                {segments.map((seg, idx) => {
                    const isLast = idx === segments.length - 1;
                    const to = "/" + segments.slice(0, idx + 1).join("/");
                    const label = formatSegment(seg);

                    return (
                        <li key={to} className="flex items-center gap-1">
                            {isLast ? (
                                <span className="font-semibold text-[var(--text-primary)] max-w-[160px] truncate">
                                    {label}
                                </span>
                            ) : (
                                <>
                                    <Link
                                        to={to}
                                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150 max-w-[120px] truncate"
                                    >
                                        {label}
                                    </Link>
                                    <ChevronRight size={13} className="text-[var(--text-muted)]" />
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

