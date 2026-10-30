import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const sizes = {
    sm: "h-9 text-sm",
    md: "h-10 text-sm",
    lg: "h-11 text-base",
};

const Select = forwardRef(function Select(
    {
        label,
        error,
        hint,
        options = [],
        placeholder,
        size = "md",
        id,
        className = "",
        wrapperClassName = "",
        required,
        ...rest
    },
    ref
) {
    const selectId =
        id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
        <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
            {/* Label */}
            {label && (
                <label
                    htmlFor={selectId}
                    className="text-sm font-medium text-[var(--text-primary)] leading-none"
                >
                    {label}
                    {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
                </label>
            )}

            {/* Select wrapper */}
            <div className="relative flex items-center">
                <select
                    ref={ref}
                    id={selectId}
                    required={required}
                    className={[
                        "w-full appearance-none pr-9 pl-3 cursor-pointer",
                        "rounded-[var(--radius-control)]",
                        "bg-[var(--surface)] border border-[var(--border)]",
                        "text-[var(--text-primary)]",
                        "transition-colors duration-150",
                        "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]",
                        sizes[size] ?? sizes.md,
                        error ? "border-[var(--danger)] focus:ring-[var(--danger-soft)]" : "",
                        className,
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    {...rest}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.disabled}
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* Arrow icon */}
                <span className="absolute right-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <ChevronDown size={15} />
                </span>
            </div>

            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            {!error && hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
        </div>
    );
});

export default Select;
