import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const widths = {
    sm:   "max-w-sm",
    md:   "max-w-lg",
    lg:   "max-w-2xl",
    xl:   "max-w-4xl",
    full: "max-w-[95vw]",
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = "md",
    footer,
    className = "",
    hideHeader = false,
}) {
    const overlayRef = useRef(null);

    /* Escape key */
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === "Escape") onClose?.(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    /* Body scroll lock */
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        /* Backdrop */
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            {/* Panel */}
            <div
                className={[
                    "w-full flex flex-col max-h-[90vh]",
                    "bg-[var(--surface)] border border-[var(--border)]",
                    "rounded-[var(--radius-card)] shadow-[var(--shadow-xl)]",
                    "animate-scale-in",
                    widths[size] ?? widths.md,
                    className,
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                {/* Header */}
                {!hideHeader && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-base font-semibold text-[var(--text-primary)]"
                            >
                                {title}
                            </h2>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className={[
                                "flex items-center justify-center w-8 h-8 rounded-lg",
                                "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                                "hover:bg-[var(--surface-secondary)] transition-colors duration-150",
                                !title ? "ml-auto" : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
