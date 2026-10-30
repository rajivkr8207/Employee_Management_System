import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, Users, Briefcase, AtSign, Phone } from "lucide-react";
import useAuth from "../hooks/useAuth";

const ROLES = [
    { value: "admin", label: "Admin" },
    { value: "employ", label: "Employee" },
    { value: "storeadmin", label: "Store Admin" },
    { value: "manager", label: "Manager" },
];

export default function Register() {
    const { register, registerLoading, registerError, clearAllErrors } = useAuth();

    const [form, setForm] = useState({ fullName: "", username: "", email: "", mobile: "", password: "", confirmPassword: "", role: "employ" });
    const [showPwd, setShowPwd] = useState(false);
    const [showCPwd, setShowCPwd] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => () => clearAllErrors(), []);

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = "Full name is required";
        if (!form.username.trim()) e.username = "Username is required";
        else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username))
            e.username = "3–20 chars: letters, numbers, underscores only";
        if (!form.email) e.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
        if (!form.mobile.trim()) e.mobile = "Mobile number is required";
        else if (!/^\+?[0-9]{7,15}$/.test(form.mobile.replace(/\s/g, "")))
            e.mobile = "Enter a valid mobile number";
        if (!form.password) e.password = "Password is required";
        else if (form.password.length < 6) e.password = "At least 6 characters";
        if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
        else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
        if (!form.role) e.role = "Please select a role";
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
        const { confirmPassword, ...payload } = form;
        await register(payload);
    };

    /* reusable field renderer */
    const fieldClass = (key) => [
        "w-full h-10 text-sm rounded-[var(--radius-control)]",
        "bg-[var(--surface)] border text-[var(--text-primary)]",
        "placeholder:text-[var(--text-muted)]",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2",
        errors[key]
            ? "border-[var(--danger)] focus:ring-[var(--danger-soft)] focus:border-[var(--danger)]"
            : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary-soft)]",
    ].join(" ");

    return (
        <div className="min-h-screen flex bg-[var(--background)]">
            {/* ── Left decorative panel ── */}
            <div className="hidden lg:flex lg:w-5/12 bg-[var(--sidebar-bg)] flex-col items-center justify-center px-10 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)",
                    }}
                />
                <div className="absolute top-1/3 left-1/3 w-56 h-56 bg-indigo-600/30 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-violet-500/25 rounded-full blur-3xl" />

                <div className="relative z-10 text-center max-w-xs">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-6">
                        <Users size={30} className="text-indigo-300" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Join EMS Portal</h1>
                    <p className="text-indigo-200/70 text-sm leading-relaxed">
                        Create your account and start managing your workforce today.
                    </p>

                    <ul className="mt-8 space-y-3 text-left">
                        {[
                            "Real-time attendance tracking",
                            "Automated payroll processing",
                            "Leave management system",
                            "Department analytics",
                        ].map((f) => (
                            <li key={f} className="flex items-center gap-2.5 text-sm text-indigo-200/80">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--success)] flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-md animate-slide-in-up">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)] text-white">
                            <Users size={18} />
                        </div>
                        <span className="text-lg font-bold text-[var(--text-primary)]">EMS Portal</span>
                    </div>

                    <div className="mb-7">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                            Create an account
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Fill in your details to get started
                        </p>
                    </div>

                    {/* API error */}
                    {registerError && (
                        <div className="mb-5 px-4 py-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger)]/30">
                            <p className="text-sm text-[var(--danger)]">{registerError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        {/* Full Name + Username */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="fullName" className="text-sm font-medium text-[var(--text-primary)]">
                                    Full Name <span className="text-[var(--danger)]">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                                        <User size={15} />
                                    </span>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        autoComplete="fullName"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className={`${fieldClass("name")} pl-9 pr-3`}
                                    />
                                </div>
                                {errors.fullName && <p className="text-xs text-[var(--danger)]">{errors.fullName}</p>}
                            </div>

                            {/* Username */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="username" className="text-sm font-medium text-[var(--text-primary)]">
                                    Username <span className="text-[var(--danger)]">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                                        <AtSign size={15} />
                                    </span>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        value={form.username}
                                        onChange={handleChange}
                                        placeholder="john_doe"
                                        className={`${fieldClass("username")} pl-9 pr-3`}
                                    />
                                </div>
                                {errors.username && <p className="text-xs text-[var(--danger)]">{errors.username}</p>}
                                <p className="text-xs text-[var(--text-muted)]">Letters, numbers &amp; underscores</p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
                                Email Address <span className="text-[var(--danger)]">*</span>
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
                                    className={`${fieldClass("email")} pl-9 pr-3`}
                                />
                            </div>
                            {errors.email && <p className="text-xs text-[var(--danger)]">{errors.email}</p>}
                        </div>

                        {/* Mobile + Role — side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Mobile */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="mobile" className="text-sm font-medium text-[var(--text-primary)]">
                                    Mobile Number <span className="text-[var(--danger)]">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                                        <Phone size={15} />
                                    </span>
                                    <input
                                        id="mobile"
                                        name="mobile"
                                        type="tel"
                                        autoComplete="tel"
                                        value={form.mobile}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        className={`${fieldClass("mobile")} pl-9 pr-3`}
                                    />
                                </div>
                                {errors.mobile && <p className="text-xs text-[var(--danger)]">{errors.mobile}</p>}
                            </div>

                            {/* Role */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="role" className="text-sm font-medium text-[var(--text-primary)]">
                                    Role <span className="text-[var(--danger)]">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                                        <Briefcase size={15} />
                                    </span>
                                    <select
                                        id="role"
                                        name="role"
                                        value={form.role}
                                        onChange={handleChange}
                                        className={`${fieldClass("role")} pl-9 pr-9 appearance-none cursor-pointer`}
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3 pointer-events-none text-[var(--text-muted)]">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </div>
                                {errors.role && <p className="text-xs text-[var(--danger)]">{errors.role}</p>}
                            </div>
                        </div>

                        {/* Password */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="password" className="text-sm font-medium text-[var(--text-primary)]">
                                    Password <span className="text-[var(--danger)]">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                                        <Lock size={15} />
                                    </span>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPwd ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className={`${fieldClass("password")} pl-9 pr-10`}
                                    />
                                    <button type="button" onClick={() => setShowPwd((p) => !p)}
                                        className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-[var(--danger)]">{errors.password}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--text-primary)]">
                                    Confirm <span className="text-[var(--danger)]">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                                        <Lock size={15} />
                                    </span>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showCPwd ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className={`${fieldClass("confirmPassword")} pl-9 pr-10`}
                                    />
                                    <button type="button" onClick={() => setShowCPwd((p) => !p)}
                                        className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                        {showCPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-xs text-[var(--danger)]">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={registerLoading}
                            className={[
                                "w-full h-11 flex items-center justify-center gap-2",
                                "text-sm font-semibold text-white rounded-[var(--radius-control)]",
                                "bg-[var(--primary)] hover:bg-[var(--primary-hover)]",
                                "transition-all duration-150 active:scale-[0.98]",
                                "shadow-sm focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2",
                                registerLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                            ].join(" ")}
                        >
                            {registerLoading ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Creating account...
                                </>
                            ) : "Create Account"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                        Already have an account?{" "}
                        <Link to="/login" className="text-[var(--primary)] font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

