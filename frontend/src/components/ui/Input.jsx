import { forwardRef } from "react";

const sizes = {
    sm: "h-9 text-sm px-3",
    md: "h-10 text-sm px-3",
    lg: "h-11 text-base px-4",
};

const Input = forwardRef(function Input(
    {
        label,
        error,
        hint,
        icon: Icon,
        iconRight: IconRight,
        size = "md",
        id,
        className = "",
        wrapperClassName = "",
        required,
        ...rest
    },
    ref
) {
    const inputId =
        id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
        <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
            {/* Label */}
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-[var(--text-primary)] leading-none"
                >
                    {label}
                    {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
                </label>
            )}

            {/* Input wrapper */}
            <div className="relative flex items-center">
                {/* Left icon */}
                {Icon && (
                    <span className="absolute left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                        <Icon size={15} />
                    </span>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    required={required}
                    className={[
                        "w-full rounded-[var(--radius-control)]",
                        "bg-[var(--surface)] border border-[var(--border)]",
                        "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                        "transition-colors duration-150",
                        "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]",
                        sizes[size] ?? sizes.md,
                        Icon       ? "pl-9"  : "",
                        IconRight  ? "pr-9"  : "",
                        error
                            ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger-soft)]"
                            : "",
                        className,
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    {...rest}
                />

                {/* Right icon */}
                {IconRight && (
                    <span className="absolute right-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                        <IconRight size={15} />
                    </span>
                )}
            </div>

            {/* Error */}
            {error && (
                <p className="text-xs text-[var(--danger)]">{error}</p>
            )}
            {/* Hint */}
            {!error && hint && (
                <p className="text-xs text-[var(--text-muted)]">{hint}</p>
            )}
        </div>
    );
});

export default Input;
