import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

function DialogContent({
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant,
    loading,
    requireReason,
    reasonLabel,
    reasonPlaceholder,
}) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const handleConfirm = () => {
        if (requireReason && !reason.trim()) {
            setError("Please provide a reason before proceeding.");
            return;
        }
        onConfirm(reason.trim());
    };

    return (
        <div className="flex flex-col items-center text-center gap-3 py-2">
            {/* Icon */}
            <div
                className={[
                    "flex items-center justify-center w-14 h-14 rounded-2xl",
                    variant === "danger"
                        ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                        : variant === "warning"
                        ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                        : variant === "info"
                        ? "bg-[var(--info-soft)] text-[var(--info)]"
                        : "bg-[var(--primary-soft)] text-[var(--primary)]",
                ].join(" ")}
            >
                {variant === "info" ? (
                    <Info size={26} strokeWidth={1.5} />
                ) : (
                    <AlertTriangle size={26} strokeWidth={1.5} />
                )}
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">
                {message}
            </p>

            {/* Reason Textarea (if required) */}
            {requireReason && (
                <div className="w-full text-left mt-2">
                    <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                        {reasonLabel} <span className="text-[var(--danger)]">*</span>
                    </label>
                    <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder={reasonPlaceholder}
                        className="w-full text-sm p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)] transition-colors resize-none placeholder:text-[var(--text-muted)]"
                    />
                    {error && (
                        <p className="text-xs text-[var(--danger)] mt-1">{error}</p>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 w-full pt-3">
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
                    onClick={handleConfirm}
                    loading={loading}
                    className="flex-1"
                >
                    {confirmLabel}
                </Button>
            </div>
        </div>
    );
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",   // "default" | "danger" | "warning" | "info"
    loading = false,
    requireReason = false,
    reasonLabel = "Reason / Feedback",
    reasonPlaceholder = "Please provide details...",
}) {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            hideHeader
        >
            <DialogContent
                onClose={onClose}
                onConfirm={onConfirm}
                title={title}
                message={message}
                confirmLabel={confirmLabel}
                cancelLabel={cancelLabel}
                variant={variant}
                loading={loading}
                requireReason={requireReason}
                reasonLabel={reasonLabel}
                reasonPlaceholder={reasonPlaceholder}
            />
        </Modal>
    );
}
