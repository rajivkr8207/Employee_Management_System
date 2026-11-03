import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    LayoutDashboard,
    Users,
    Building2,
    CalendarCheck,
    CalendarOff,
    DollarSign,
    Settings,
    BarChart3,
    UserCheck,
    Store,
    ShieldCheck,
    FileText,
    Activity,
    Clock,
    Briefcase,
} from "lucide-react";
import { normalizeRole, ROLES, ROLE_LABELS } from "../../constants/roles";

function getNavSections(role, pendingUsersCount, pendingStoresCount, pendingManagersCount) {
    if (role === ROLES.ADMIN) {
        return [
            {
                heading: "Administration",
                items: [
                    { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
                    {
                        label: "User Verification",
                        icon: UserCheck,
                        to: "/admin/user-verification",
                        badge: pendingUsersCount,
                        badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                    },
                    {
                        label: "Store Verification",
                        icon: Store,
                        to: "/admin/store-verification",
                        badge: pendingStoresCount,
                        badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
                    },
                    {
                        label: "Manager Verification",
                        icon: ShieldCheck,
                        to: "/admin/manager-verification",
                        badge: pendingManagersCount,
                        badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
                    },
                ],
            },
            {
                heading: "Management",
                items: [
                    { label: "All Users", icon: Users, to: "/admin/users" },
                    { label: "All Stores", icon: Building2, to: "/admin/stores" },
                    { label: "All Employees", icon: Briefcase, to: "/admin/employees" },
                ],
            },
            {
                heading: "System & Reports",
                items: [
                    { label: "Reports & Analytics", icon: BarChart3, to: "/admin/analytics" },
                    { label: "Activity Logs", icon: Activity, to: "/admin/activity-logs" },
                    { label: "Settings", icon: Settings, to: "/settings" },
                ],
            },
        ];
    }

    if (role === ROLES.STORE_ADMIN) {
        return [
            {
                heading: "Store Admin Portal",
                items: [
                    { label: "Dashboard", icon: LayoutDashboard, to: "/store-admin/dashboard" },
                    { label: "Assigned Stores", icon: Store, to: "/store-admin/stores" },
                    { label: "Store Managers", icon: ShieldCheck, to: "/store-admin/managers" },
                    { label: "Employees", icon: Users, to: "/store-admin/employees" },
                ],
            },
            {
                heading: "Operations",
                items: [
                    { label: "Attendance", icon: CalendarCheck, to: "/store-admin/attendance" },
                    { label: "Leave Requests", icon: CalendarOff, to: "/store-admin/leaves" },
                    { label: "Settings", icon: Settings, to: "/settings" },
                ],
            },
        ];
    }

    if (role === ROLES.MANAGER) {
        return [
            {
                heading: "Store Operations",
                items: [
                    { label: "Store Dashboard", icon: LayoutDashboard, to: "/store-manager/dashboard" },
                    { label: "Store Employees", icon: Users, to: "/store-manager/employees" },
                    { label: "Attendance", icon: CalendarCheck, to: "/store-manager/attendance" },
                    { label: "Leave Requests", icon: CalendarOff, to: "/store-manager/leaves" },
                    { label: "Shift Schedule", icon: Clock, to: "/store-manager/shifts" },
                    { label: "Settings", icon: Settings, to: "/settings" },
                ],
            },
        ];
    }

    // Employee
    return [
        {
            heading: "Self Service",
            items: [
                { label: "My Dashboard", icon: LayoutDashboard, to: "/employee/dashboard" },
                { label: "My Attendance", icon: CalendarCheck, to: "/employee/attendance" },
                { label: "My Leaves", icon: CalendarOff, to: "/employee/leaves" },
                { label: "My Salary & Slips", icon: DollarSign, to: "/employee/salary" },
                { label: "My Profile", icon: FileText, to: "/profile" },
            ],
        },
    ];
}

export default function Sidebar() {
    const { user } = useSelector((state) => state.auth);
    const { users: pendingUsersList } = useSelector((state) => state.userVerification);
    const { stores: pendingStoresList } = useSelector((state) => state.storeVerification);
    const { managers: pendingManagersList } = useSelector((state) => state.managerVerification);

    const role = normalizeRole(user?.role);
    const roleLabel = ROLE_LABELS[role] || "Portal";

    // Count pending verifications for badge displays
    const pendingUsersCount = pendingUsersList.filter((u) => u.status === "pending").length || 3;
    const pendingStoresCount = pendingStoresList.filter((s) => s.status === "pending").length || 2;
    const pendingManagersCount = pendingManagersList.filter((m) => m.status === "pending").length || 2;

    const navSections = getNavSections(role, pendingUsersCount, pendingStoresCount, pendingManagersCount);

    const initials = user?.fullName || user?.name
        ? (user.fullName || user.name).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
        : "US";

    return (
        <aside
            className={[
                "hidden md:flex flex-col fixed top-0 left-0 h-screen w-[260px] z-30",
                "bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]",
            ].join(" ")}
        >
            {/* ── Brand ── */}
            <div className="flex items-center gap-3 px-5 py-[18px] border-b border-white/[0.07] shrink-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 shrink-0">
                    <Building2 size={18} className="text-indigo-300" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white leading-none mb-1 truncate">
                        EMS Enterprise
                    </p>
                    <p className="text-[11px] text-[var(--sidebar-text-muted)] leading-none truncate font-medium">
                        {roleLabel}
                    </p>
                </div>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                {navSections.map((section, sIdx) => (
                    <div key={section.heading || sIdx} className="space-y-1">
                        <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-text-muted)]">
                            {section.heading}
                        </p>
                        {section.items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    [
                                        "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-control)]",
                                        "text-sm font-medium transition-colors duration-150 group",
                                        isActive
                                            ? "bg-white/[0.13] text-white shadow-sm"
                                            : "text-[var(--sidebar-text)] hover:bg-white/[0.06] hover:text-white",
                                    ].join(" ")
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className={[
                                                "flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors duration-150",
                                                isActive
                                                    ? "bg-white/[0.15] text-white"
                                                    : "text-[var(--sidebar-text-muted)] group-hover:text-white",
                                            ].join(" ")}
                                        >
                                            <item.icon size={16} />
                                        </span>
                                        <span className="truncate">{item.label}</span>

                                        {item.badge != null && item.badge > 0 && (
                                            <span
                                                className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                    item.badgeColor || "bg-indigo-500/20 text-indigo-300"
                                                }`}
                                            >
                                                {item.badge}
                                            </span>
                                        )}

                                        {isActive && !item.badge && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* ── User Profile ── */}
            <div className="px-3 py-3 border-t border-white/[0.07] shrink-0">
                <NavLink
                    to="/profile"
                    className="flex items-center gap-3 p-2 rounded-[var(--radius-control)] hover:bg-white/[0.06] transition-colors duration-150"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)] text-white text-xs font-bold shrink-0 shadow-sm">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-none mb-1 truncate">
                            {user?.fullName || user?.name || "User"}
                        </p>
                        <p className="text-[11px] text-[var(--sidebar-text-muted)] leading-none truncate capitalize">
                            {roleLabel}
                        </p>
                    </div>
                </NavLink>
            </div>
        </aside>
    );
}
