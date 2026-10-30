import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6">
            <div className="text-center max-w-sm animate-slide-in-up">
                {/* Icon */}
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)] mx-auto mb-6">
                    <AlertCircle size={36} strokeWidth={1.5} />
                </div>

                {/* 404 */}
                <p className="text-7xl font-black text-[var(--primary)] mb-2 leading-none">
                    404
                </p>

                <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                    Page not found
                </h1>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>

                <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-white rounded-[var(--radius-control)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all duration-150 active:scale-[0.98] shadow-sm"
                >
                    <Home size={15} />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}

