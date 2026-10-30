import { useState, useEffect } from "react";
import { User, Mail, Briefcase, Phone, MapPin, Calendar, Camera, LogOut, Shield, Check } from "lucide-react";
import useAuth from "../hooks/useAuth";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

/* ── Avatar initials ── */
function Avatar({ user, size = "lg" }) {
    const initials = user?.name
        ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
        : "?";

    const dims = size === "lg"
        ? "w-24 h-24 text-2xl"
        : "w-10 h-10 text-sm";

    return (
        <div className={`${dims} rounded-full bg-[var(--primary)] text-white font-bold flex items-center justify-center shrink-0`}>
            {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : initials}
        </div>
    );
}

/* ── Info row ── */
function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-muted)] shrink-0 mt-0.5">
                <Icon size={15} />
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {value || <span className="text-[var(--text-muted)]">Not set</span>}
                </p>
            </div>
        </div>
    );
}

/* ── Role badge ── */
function RoleBadge({ role }) {
    const map = {
        admin:    { label: "Admin",      cls: "bg-[var(--primary-soft)] text-[var(--primary)]" },
        hr:       { label: "HR Manager", cls: "bg-[var(--info-soft)] text-[var(--info)]" },
        employee: { label: "Employee",   cls: "bg-[var(--success-soft)] text-[var(--success)]" },
    };
    const cfg = map[role] ?? map.employee;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
            <Shield size={11} />
            {cfg.label}
        </span>
    );
}

export default function Profile() {
    const {
        user, profileLoading, updateLoading, updateSuccess,
        updateProfileError, fetchProfile, updateProfile, logout,
    } = useAuth();

    const [tab, setTab]             = useState("overview");  // "overview" | "edit"
    const [form, setForm]           = useState({});
    const [successMsg, setSuccessMsg] = useState("");

    /* load latest profile on mount */
    useEffect(() => { fetchProfile(); }, []);

    /* populate form when user loads */
    useEffect(() => {
        if (user) {
            setForm({
                name:     user.name     ?? "",
                email:    user.email    ?? "",
                phone:    user.phone    ?? "",
                address:  user.address  ?? "",
                position: user.position ?? "",
            });
        }
    }, [user]);

    /* success toast */
    useEffect(() => {
        if (updateSuccess) {
            setSuccessMsg("Profile updated successfully!");
            setTab("overview");
            const t = setTimeout(() => setSuccessMsg(""), 3500);
            return () => clearTimeout(t);
        }
    }, [updateSuccess]);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        await updateProfile(form);
    };

    const inputCls = [
        "w-full h-10 px-3 text-sm rounded-[var(--radius-control)]",
        "bg-[var(--surface)] border border-[var(--border)]",
        "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
        "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]",
        "transition-colors duration-150",
    ].join(" ");

    if (profileLoading && !user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="w-8 h-8 rounded-full border-[3px] border-[var(--border)] border-t-[var(--primary)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* ── Page header ── */}
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">My Profile</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    Manage your personal information and account settings
                </p>
            </div>

            {/* ── Success banner ── */}
            {successMsg && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-control)] bg-[var(--success-soft)] border border-[var(--success)]/30 animate-slide-in-up">
                    <Check size={16} className="text-[var(--success)] shrink-0" />
                    <p className="text-sm font-medium text-[var(--success)]">{successMsg}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left: Avatar card ── */}
                <div className="lg:col-span-1">
                    <Card padding="lg">
                        <div className="flex flex-col items-center text-center">
                            {/* Avatar */}
                            <div className="relative mb-4">
                                <Avatar user={user} size="lg" />
                                <button
                                    type="button"
                                    className="absolute bottom-0 right-0 flex items-center justify-center w-7 h-7 rounded-full bg-[var(--primary)] text-white shadow-md hover:opacity-90 transition-opacity"
                                    title="Change photo"
                                >
                                    <Camera size={13} />
                                </button>
                            </div>

                            <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">
                                {user?.name ?? "—"}
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-3">
                                {user?.email ?? "—"}
                            </p>
                            <RoleBadge role={user?.role} />

                            {/* Join date */}
                            {user?.createdAt && (
                                <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                    <Calendar size={12} />
                                    Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </div>
                            )}

                            <div className="w-full mt-6 pt-5 border-t border-[var(--border)] space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setTab(tab === "edit" ? "overview" : "edit")}
                                >
                                    {tab === "edit" ? "Cancel editing" : "Edit Profile"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    icon={LogOut}
                                    className="w-full text-[var(--danger)] hover:!bg-[var(--danger-soft)]"
                                    onClick={logout}
                                >
                                    Sign out
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Right: Details / Edit ── */}
                <div className="lg:col-span-2">
                    {/* Tab switcher */}
                    <div className="flex gap-1 p-1 bg-[var(--surface-secondary)] rounded-[var(--radius-control)] mb-5 w-fit">
                        {["overview", "edit"].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTab(t)}
                                className={[
                                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 capitalize",
                                    tab === t
                                        ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                                ].join(" ")}
                            >
                                {t === "edit" ? "Edit Profile" : "Overview"}
                            </button>
                        ))}
                    </div>

                    {tab === "overview" ? (
                        /* ── Overview ── */
                        <Card padding="md">
                            <Card.Header withBorder>
                                <Card.Title>Personal Information</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <InfoRow icon={User}     label="Full Name"  value={user?.name} />
                                <InfoRow icon={Mail}     label="Email"      value={user?.email} />
                                <InfoRow icon={Phone}    label="Phone"      value={user?.phone} />
                                <InfoRow icon={Briefcase} label="Position"  value={user?.position} />
                                <InfoRow icon={MapPin}   label="Address"    value={user?.address} />
                                <InfoRow icon={Shield}   label="Role"       value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : null} />
                            </Card.Body>
                        </Card>
                    ) : (
                        /* ── Edit form ── */
                        <Card padding="md">
                            <Card.Header withBorder>
                                <Card.Title>Edit Profile</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                {updateProfileError && (
                                    <div className="mb-5 px-4 py-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger)]/30">
                                        <p className="text-sm text-[var(--danger)]">{updateProfileError}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSave} className="space-y-4">
                                    {/* Name */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-[var(--text-primary)]">Full Name</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]"><User size={15} /></span>
                                            <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className={`${inputCls} pl-9`} />
                                        </div>
                                    </div>

                                    {/* Email (readonly) */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-[var(--text-primary)]">Email Address</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]"><Mail size={15} /></span>
                                            <input name="email" value={form.email} readOnly
                                                className={`${inputCls} pl-9 opacity-60 cursor-not-allowed bg-[var(--surface-secondary)]`} />
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)]">Email cannot be changed</p>
                                    </div>

                                    {/* Phone & Position */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-[var(--text-primary)]">Phone</label>
                                            <div className="relative flex items-center">
                                                <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]"><Phone size={15} /></span>
                                                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900" className={`${inputCls} pl-9`} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-[var(--text-primary)]">Position</label>
                                            <div className="relative flex items-center">
                                                <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]"><Briefcase size={15} /></span>
                                                <input name="position" value={form.position} onChange={handleChange} placeholder="Software Engineer" className={`${inputCls} pl-9`} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-[var(--text-primary)]">Address</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 pointer-events-none text-[var(--text-muted)]"><MapPin size={15} /></span>
                                            <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, City" className={`${inputCls} pl-9`} />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setTab("overview")}
                                            disabled={updateLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            loading={updateLoading}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

