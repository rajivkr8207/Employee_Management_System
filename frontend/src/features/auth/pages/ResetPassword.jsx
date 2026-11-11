import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, ShieldAlert } from "lucide-react";
import { api } from "../../../lib/api";
import { SEO } from "../../../seo";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid or expired reset token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
      <SEO
        title="Reset Password"
        description="Set a new secure password for your employee portal account."
        noindex
      />
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Reset Password</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Choose a new strong password for your account.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Password updated</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Your password has been reset successfully. Redirecting you to login...
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block mt-4 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Go to Login now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                New password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
                  <Lock size={15} />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full h-10 pl-9 pr-10 text-sm rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)] focus:border-[var(--primary)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Confirm new password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
                  <Lock size={15} />
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full h-10 pl-9 pr-3 text-sm rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)] focus:border-[var(--primary)] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
