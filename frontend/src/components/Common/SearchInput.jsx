import { X, Search } from "lucide-react";

export default function SearchInput({
    value = "",
    onChange,
    onClear,
    placeholder = "Search...",
    className = "",
}) {
    const handleClear = () => {
        onChange?.({ target: { value: "" } });
        onClear?.();
    };

    return (
        <div className={`relative flex items-center ${className}`}>
            {/* Search icon */}
            <span className="absolute left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Search size={15} />
            </span>

            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={[
                    "w-full h-10 pl-9 pr-9 text-sm",
                    "rounded-[var(--radius-control)]",
                    "bg-[var(--surface)] border border-[var(--border)]",
                    "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                    "transition-colors duration-150",
                    "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]",
                ].join(" ")}
            />

            {/* Clear button */}
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150"
                    aria-label="Clear search"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

