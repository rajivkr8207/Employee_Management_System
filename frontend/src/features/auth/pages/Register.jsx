import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Users,
    AtSign,
    Phone,
    Store,
    ShieldAlert,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { api } from "../../../lib/api";

export default function Register() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const { register, registerLoading, registerError, clearAllErrors } = useAuth();

    const [form, setForm] = useState({
        fullName: "",
        username: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        role: "storeadmin",
    });
    const [showPwd, setShowPwd] = useState(false);
    const [showCPwd, setShowCPwd] = useState(false);
    const [errors, setErrors] = useState({});

    /* Invitation verification state */
    const [verifyingToken, setVerifyingToken] = useState(Boolean(token));
    const [tokenError, setTokenError] = useState("");
    const [invitationData, setInvitationData] = useState(null);

    useEffect(() => {
        clearAllErrors();

        if (token) {
            api.get("/auth/store-admin/invitations/verify", { params: { token } })
                .then((res) => {
                    const data = res.data?.data || res.data;
                    setInvitationData(data);
                    setForm((prev) => ({
                        ...prev,
                        email: data.email || prev.email,
                        role: "storeadmin",
                    }));
                })
                .catch((err) => {
                    setTokenError(
                        err.response?.data?.message ||
                        "This invitation link is invalid, expired, or has already been used."
                    );
                })
                .finally(() => {
                    setVerifyingToken(false);
                });
        }
    }, [token, clearAllErrors]);

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
        const payload = {
            fullName: form.fullName.trim(),
            username: form.username.trim(),
            email: form.email.trim(),
            mobile: form.mobile.trim(),
            password: form.password,
            token,
        };
        await register(payload);
    };

    /* If no token is provided in URL: show invitation requirement message */
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
                <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-6 sm:p-8 shadow-[var(--shadow-md)] text-center animate-fade-in">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)] flex items-center justify-center mb-5">
                        <ShieldAlert size={28} />
                    </div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                        Registration By Invitation Only
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                        Direct public registration is disabled. Accounts must be registered via an authorized invitation link or created by a store manager.
                    </p>
                    <div className="bg-[var(--surface-secondary)] border border-[var(--border)] rounded-lg p-4 text-left text-xs text-[var(--text-secondary)] space-y-2 mb-6">
                        <div className="flex items-start gap-2">
                            <Store size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
                            <span><strong>Store Administrators:</strong> Please use the registration link sent to your email by the System Administrator.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Users size={14} className="text-[var(--info)] shrink-0 mt-0.5" />
                            <span><strong>Store Managers & Staff:</strong> Your account will be created directly by your assigned Store Administrator.</span>
                        </div>
                    </div>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 text-sm font-semibold text-white rounded-[var(--radius-control)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all"
                    >
                        Return to Sign In <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    /* While validating token */
    if (verifyingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
                <div className="text-center space-y-3">
                    <span className="w-9 h-9 rounded-full border-3 border-[var(--border)] border-t-[var(--primary)] animate-spin inline-block" />
                    <p className="text-sm text-[var(--text-secondary)]">Validating invitation credentials...</p>
                </div>
            </div>
        );
    }

    /* Invalid or expired token */
    if (tokenError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
                <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-6 sm:p-8 shadow-[var(--shadow-md)] text-center animate-fade-in">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center mb-5">
                        <ShieldAlert size={28} />
                    </div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                        Invitation Invalid or Expired
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                        {tokenError}
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 text-sm font-semibold text-white rounded-[var(--radius-control)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all"
                    >
                        Go to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const fieldClass = (name) => [
        "w-full h-10 text-sm rounded-[var(--radius-control)]",
        "bg-[var(--surface)] border text-[var(--text-primary)]",
        "placeholder:text-[var(--text-muted)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]",
        "transition-colors duration-150",
        errors[name] ? "border-[var(--danger)] focus:border-[var(--danger)]" : "border-[var(--border)] focus:border-[var(--primary)]",
    ].join(" ");

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
            <div className="w-full max-w-lg">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] mb-3 shadow-sm">
                        <Store size={22} />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Register Store Administrator
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Complete your account setup for your designated store
                    </p>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
                    {/* Invitation Verified banner */}
                    {invitationData && (
                        <div className="mb-6 p-4 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-xs text-[var(--text-primary)] flex items-start gap-3">
                            <CheckCircle2 size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-sm text-[var(--primary)]">
                                    Official Invitation Verified
                                </p>
                                <p className="text-[var(--text-secondary)] mt-0.5">
                                    Invitation for: <span className="font-medium text-[var(--text-primary)]">{invitationData.email}</span>
                                </p>
                                <p className="text-[var(--text-secondary)] mt-0.5">
                                    Set up your credentials to get started. You can configure your store and team after your account is approved.
                                </p>
                            </div>
                        </div>
                    )}

                    {registerError && (
                        <div className="mb-5 px-4 py-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-sm text-[var(--danger)]">
                            {registerError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                                    autoComplete="name"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Jane Doe"
                                    className={`${fieldClass("fullName")} pl-9 pr-3`}
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
                                    placeholder="janedoe"
                                    className={`${fieldClass("username")} pl-9 pr-3`}
                                />
                            </div>
                            {errors.username && <p className="text-xs text-[var(--danger)]">{errors.username}</p>}
                        </div>

                        {/* Email (Readonly from Invitation) */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
                                Invited Email <span className="text-[var(--danger)]">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                                    <Mail size={15} />
                                </span>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    readOnly
                                    value={form.email}
                                    className={`${fieldClass("email")} pl-9 pr-3 opacity-70 bg-[var(--surface-secondary)] cursor-not-allowed`}
                                />
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)]">Locked to the invited email address</p>
                        </div>

                        {/* Mobile Number */}
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

                        {/* Password & Confirm Password */}
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
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd((p) => !p)}
                                        className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
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
                                    <button
                                        type="button"
                                        onClick={() => setShowCPwd((p) => !p)}
                                        className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
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
                                "shadow-sm focus-visible:outline-2 focus-visible:outline-[var(--primary)]",
                                registerLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                            ].join(" ")}
                        >
                            {registerLoading ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Submitting application...
                                </>
                            ) : (
                                "Complete Registration"
                            )}
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