import { AlertTriangle } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",   // "default" | "danger"
    loading = false,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            hideHeader
        >
            <div className="flex flex-col items-center text-center gap-4 py-2">
                {/* Icon */}
                <div
                    className={[
                        "flex items-center justify-center w-14 h-14 rounded-2xl",
                        variant === "danger"
                            ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                            : "bg-[var(--primary-soft)] text-[var(--primary)]",
                    ].join(" ")}
                >
                    <AlertTriangle size={26} strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {title}
                </h3>

                {/* Message */}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 w-full pt-2">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        {cancelLabel}
                    </Button>

                    <Button
                        variant={variant === "danger" ? "danger" : "primary"}
                        onClick={onConfirm}
                        loading={loading}
                        className="flex-1"
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

