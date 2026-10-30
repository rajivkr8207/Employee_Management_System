import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Users } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function Login() {
    const { login, loginLoading, loginError, clearAllErrors } = useAuth();

    const [form, setForm]       = useState({ email: "", password: "" });
    const [showPwd, setShowPwd] = useState(false);
    const [errors, setErrors]   = useState({});

    /* clear redux error on unmount */
    useEffect(() => () => clearAllErrors(), []);

    const validate = () => {
        const e = {};
        if (!form.email)    e.email    = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
        if (!form.password) e.password = "Password is required";
        else if (form.password.length < 6) e.password = "At least 6 characters";
        return e;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        await login(form);
    };

    return (
        <div className="min-h-screen flex bg-[var(--background)]">
            {/* ── Left panel (decorative) ── */}
            <div className="hidden lg:flex lg:w-1/2 bg-[var(--sidebar-bg)] flex-col items-center justify-center px-12 relative overflow-hidden">
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)",
                    }}
                />

                {/* Glow blobs */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/30 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 text-center max-w-sm">
                    {/* Logo */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-6">
                        <Users size={30} className="text-indigo-300" />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
                        Employee Management System
                    </h1>
                    <p className="text-indigo-200/70 text-sm leading-relaxed">
                        Manage your workforce efficiently. Track attendance, payroll,
                        leaves and more — all in one place.
                    </p>

                    {/* Stats */}
                    <div className="mt-10 grid grid-cols-3 gap-4">
                        {[
                            { label: "Employees", val: "1,200+" },
                            { label: "Departments", val: "24" },
                            { label: "Uptime", val: "99.9%" },
                        ].map((s) => (
                            <div
                                key={s.label}
                                className="bg-white/[0.08] rounded-xl px-3 py-4 border border-white/10"
                            >
                                <p className="text-xl font-bold text-white">{s.val}</p>
                                <p className="text-xs text-indigo-300 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right panel (form) ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-md animate-slide-in-up">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)] text-white">
                            <Users size={18} />
                        </div>
                        <span className="text-lg font-bold text-[var(--text-primary)]">EMS Portal</span>
                    </div>

                    {/* Heading */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                            Welcome back
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Sign in to your account to continue
                        </p>
                    </div>

                    {/* Global API error */}
                    {loginError && (
                        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger)]/30">
                            <span className="text-[var(--danger)] text-sm leading-snug">{loginError}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
                                Email address <span className="text-[var(--danger)]">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                                    <Mail size={15} />
                                </span>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@company.com"
                                    className={[
                                        "w-full h-10 pl-9 pr-3 text-sm rounded-[var(--radius-control)]",
                                        "bg-[var(--surface)] border text-[var(--text-primary)]",
                                        "placeholder:text-[var(--text-muted)]",
                                        "transition-colors duration-150",
                                        "focus:outline-none focus:ring-2",
                                        errors.email
                                            ? "border-[var(--danger)] focus:ring-[var(--danger-soft)] focus:border-[var(--danger)]"
                                            : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary-soft)]",
                                    ].join(" ")}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-[var(--danger)]">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium text-[var(--text-primary)]">
                                    Password <span className="text-[var(--danger)]">*</span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-[var(--primary)] hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative flex items-center">
                                <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                                    <Lock size={15} />
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPwd ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={[
                                        "w-full h-10 pl-9 pr-10 text-sm rounded-[var(--radius-control)]",
                                        "bg-[var(--surface)] border text-[var(--text-primary)]",
                                        "placeholder:text-[var(--text-muted)]",
                                        "transition-colors duration-150",
                                        "focus:outline-none focus:ring-2",
                                        errors.password
                                            ? "border-[var(--danger)] focus:ring-[var(--danger-soft)] focus:border-[var(--danger)]"
                                            : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary-soft)]",
                                    ].join(" ")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((p) => !p)}
                                    className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150"
                                    aria-label="Toggle password"
                                >
                                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-[var(--danger)]">{errors.password}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loginLoading}
                            className={[
                                "w-full h-11 flex items-center justify-center gap-2",
                                "text-sm font-semibold text-white rounded-[var(--radius-control)]",
                                "bg-[var(--primary)] hover:bg-[var(--primary-hover)]",
                                "transition-all duration-150 active:scale-[0.98]",
                                "shadow-sm focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2",
                                loginLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                            ].join(" ")}
                        >
                            {loginLoading ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>

                    {/* Register link */}
                    <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/register"
                            className="text-[var(--primary)] font-medium hover:underline"
                        >
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

