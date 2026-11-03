import { FolderOpen } from "lucide-react";
import Button from "../ui/Button";

export default function EmptyState({
    icon: Icon = FolderOpen,
    title = "No data found",
    description = "There's nothing here yet.",
    action,
    className = "",
}) {
    return (
        <div
            className={[
                "flex flex-col items-center justify-center text-center py-16 px-6",
                className,
            ].join(" ")}
        >
            {/* Icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)] mb-5">
                <Icon size={28} strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-[var(--text-secondary)] max-w-xs leading-relaxed">
                {description}
            </p>

            {/* CTA */}
            {action && (
                <div className="mt-6">
                    <Button variant="primary" onClick={action.onClick}>
                        {action.label}
                    </Button>
                </div>
            )}
        </div>
    );
}

