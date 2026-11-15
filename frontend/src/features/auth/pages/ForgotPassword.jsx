import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { SEO } from "../../../seo";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
      <SEO
        title="Forgot Password"
        description="Contact an administrator for help resetting your employee management portal password."
      />
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to Login
          </Link>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Forgot Password</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Email-based password recovery is currently unavailable. Please contact your administrator to reset your password.
          </p>
        </div>
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-3 text-sm text-[var(--text-primary)]"
        >
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <span>Password reset links cannot be sent while email delivery is disabled.</span>
        </div>
      </div>
    </div>
  );
}
