import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Bell, User, LogOut, Settings, ChevronDown } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import Breadcrumbs from "./Breadcrumbs";
import MobileSidebar from "./MobileSidebar";
import useAuth from "../../features/auth/hooks/useAuth";

/* ── User Avatar ── */
function UserAvatar({ user }) {
    const initials = user?.name
        ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
        : "AD";
    return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)] text-white text-xs font-bold shrink-0">
            {user?.avatar
                ? <img src={user.avatar} alt={initials} className="w-full h-full rounded-full object-cover" />
                : initials}
        </div>
    );
}

/* ── Profile Dropdown ── */
function ProfileDropdown({ user, onClose, logout }) {
    return (
        <div
            className={[
                "absolute right-0 top-full mt-2 w-56 z-50",
                "bg-[var(--surface)] border border-[var(--border)]",
                "rounded-[var(--radius-card)] shadow-[var(--shadow-lg)]",
                "animate-slide-in-up overflow-hidden",
            ].join(" ")}
        >
            {/* User info */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {user?.name ?? "Admin User"}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {user?.email ?? "admin@company.com"}
                </p>
            </div>

            {/* Menu items */}
            <div className="py-1">
                <Link
                    to="/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors duration-150"
                >
                    <User size={15} className="text-[var(--text-muted)]" />
                    My Profile
                </Link>
                <Link
                    to="/settings"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors duration-150"
                >
                    <Settings size={15} className="text-[var(--text-muted)]" />
                    Settings
                </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-[var(--border)] py-1">
                <button
                    type="button"
                    onClick={() => { onClose(); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors duration-150"
                >
                    <LogOut size={15} />
                    Sign out
                </button>
            </div>
        </div>
    );
}

export default function Topbar() {
    const { user, logout }       = useAuth();
    const [mobileOpen, setMobileOpen]   = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    /* Close dropdown on outside click */
    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [dropdownOpen]);

    return (
        <>
            <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

            <header
                className={[
                    "fixed top-0 right-0 z-20",
                    "left-0 md:left-[260px]",
                    "h-16 flex items-center gap-4 px-4 sm:px-6",
                    "bg-[var(--surface)] border-b border-[var(--border)]",
                    "shadow-[var(--shadow-xs)]",
                ].join(" ")}
            >
                {/* ── Left ── */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Hamburger — mobile only */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden flex items-center justify-center w-9 h-9 rounded-[var(--radius-control)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
                        aria-label="Open navigation"
                    >
                        <Menu size={20} />
                    </button>
                    <Breadcrumbs />
                </div>

                {/* ── Right ── */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Notifications */}
                    <button
                        type="button"
                        className="relative flex items-center justify-center w-9 h-9 rounded-[var(--radius-control)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] bg-[var(--surface)] transition-colors duration-150 shadow-[var(--shadow-xs)]"
                        aria-label="Notifications"
                    >
                        <Bell size={16} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--surface)]" />
                    </button>

                    {/* Theme toggle */}
                    <ThemeToggle />

                    {/* Profile dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((o) => !o)}
                            className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-[var(--radius-control)] hover:bg-[var(--surface-secondary)] transition-colors duration-150"
                            aria-label="User menu"
                            aria-expanded={dropdownOpen}
                        >
                            <UserAvatar user={user} />
                            <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)] max-w-[100px] truncate">
                                {user?.name?.split(" ")[0] ?? "Admin"}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`text-[var(--text-muted)] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {dropdownOpen && (
                            <ProfileDropdown
                                user={user}
                                onClose={() => setDropdownOpen(false)}
                                logout={logout}
                            />
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
