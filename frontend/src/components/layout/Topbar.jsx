import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Bell, User, LogOut, Settings, ChevronDown, Shield, CheckCheck, Clock } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import Breadcrumbs from "./Breadcrumbs";
import MobileSidebar from "./MobileSidebar";
import useAuth from "../../features/auth/hooks/useAuth";
import { normalizeRole, ROLE_LABELS } from "../../constants/roles";
import { notificationService } from "../../features/notifications/notificationService";

/* ── Notification Dropdown ── */
function NotificationDropdown({ notifications, unreadCount, onClose, onMarkAllRead, onNotificationClick }) {
    return (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-[var(--shadow-lg)] animate-slide-in-up overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[var(--primary)] text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 font-medium"
                    >
                        <CheckCheck size={13} /> Mark all read
                    </button>
                )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                        No notifications yet
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div
                            key={n._id}
                            onClick={() => onNotificationClick(n)}
                            className={`p-3.5 hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer ${
                                !n.isRead ? "bg-[var(--primary-soft)]/20" : ""
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className={`text-xs ${!n.isRead ? "font-bold text-[var(--text-primary)]" : "font-medium text-[var(--text-secondary)]"}`}>
                                    {n.title}
                                </p>
                                {!n.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-1" />
                                )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                                {n.message}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                                <Clock size={10} /> {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

/* ── User Avatar ── */
function UserAvatar({ user }) {
    const displayName = user?.fullName || user?.name || "User";
    const initials = displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)] text-white text-xs font-bold shrink-0 shadow-sm">
            {user?.avatar ? (
                <img src={user.avatar} alt={initials} className="w-full h-full rounded-full object-cover" />
            ) : (
                initials
            )}
        </div>
    );
}

/* ── Profile Dropdown ── */
function ProfileDropdown({ user, onClose, logout }) {
    const roleKey = normalizeRole(user?.role);
    const roleLabel = ROLE_LABELS[roleKey] || user?.role || "Employee";

    return (
        <div
            className={[
                "absolute right-0 top-full mt-2 w-60 z-50",
                "bg-[var(--surface)] border border-[var(--border)]",
                "rounded-[var(--radius-card)] shadow-[var(--shadow-lg)]",
                "animate-slide-in-up overflow-hidden",
            ].join(" ")}
        >
            {/* User info */}
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {user?.fullName || user?.name || "User"}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {user?.email || "user@company.com"}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                        <Shield size={10} />
                        {roleLabel}
                    </span>
                </div>
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
                    onClick={() => {
                        onClose();
                        logout();
                    }}
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
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    const roleKey = normalizeRole(user?.role);
    const roleLabel = ROLE_LABELS[roleKey] || "User";

    const fetchNotifications = async () => {
        try {
            const [nRes, uRes] = await Promise.all([
                notificationService.getNotifications({ limit: 15 }),
                notificationService.getUnreadCount(),
            ]);
            setNotifications(nRes.data?.data?.notifications || []);
            setUnreadCount(uRes.data?.data?.unreadCount || 0);
        } catch {
            // Silently handle if notifications are not ready
        }
    };

    useEffect(() => {
        if (user?._id || user?.id) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user?._id, user?.id]);

    /* Close dropdowns on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch {}
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await notificationService.markAsRead(notification._id);
                setUnreadCount((c) => Math.max(0, c - 1));
                setNotifications((prev) =>
                    prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
                );
            } catch {}
        }
        if (notification.actionUrl) {
            setNotifOpen(false);
            navigate(notification.actionUrl);
        }
    };

    const firstName = (user?.fullName || user?.name || "User").split(" ")[0];

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
                    {/* Role badge */}
                    <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--border)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                        {roleLabel}
                    </span>

                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => setNotifOpen((o) => !o)}
                            className="relative flex items-center justify-center w-9 h-9 rounded-[var(--radius-control)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] bg-[var(--surface)] transition-colors duration-150 shadow-[var(--shadow-xs)]"
                            aria-label="Notifications"
                        >
                            <Bell size={16} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--surface)]" />
                            )}
                        </button>
                        {notifOpen && (
                            <NotificationDropdown
                                notifications={notifications}
                                unreadCount={unreadCount}
                                onClose={() => setNotifOpen(false)}
                                onMarkAllRead={handleMarkAllRead}
                                onNotificationClick={handleNotificationClick}
                            />
                        )}
                    </div>

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
                            <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)] max-w-[110px] truncate">
                                {firstName}
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
