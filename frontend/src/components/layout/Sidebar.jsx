import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Building2,
    CalendarCheck,
    CalendarOff,
    DollarSign,
    Settings,
    BarChart3,
} from "lucide-react";

const NAV_MAIN = [
    { label: "Dashboard",   icon: LayoutDashboard, to: "/dashboard" },
    { label: "Employees",   icon: Users,           to: "/employees" },
    { label: "Departments", icon: Building2,        to: "/departments" },
    { label: "Attendance",  icon: CalendarCheck,   to: "/attendance" },
    { label: "Leave",       icon: CalendarOff,     to: "/leave" },
    { label: "Payroll",     icon: DollarSign,      to: "/payroll" },
];

const NAV_SYSTEM = [
    { label: "Analytics", icon: BarChart3, to: "/analytics" },
    { label: "Settings",  icon: Settings,  to: "/settings" },
];

function SidebarNavItem({ item }) {
    return (
        <NavLink
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
                [
                    "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)]",
                    "text-sm font-medium transition-colors duration-150 group",
                    isActive
                        ? "bg-white/[0.13] text-white"
                        : "text-[var(--sidebar-text)] hover:bg-white/[0.06] hover:text-white",
                ].join(" ")
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className={[
                            "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors duration-150",
                            isActive
                                ? "bg-white/[0.15] text-white"
                                : "text-[var(--sidebar-text-muted)] group-hover:text-white",
                        ].join(" ")}
                    >
                        <item.icon size={17} />
                    </span>
                    <span>{item.label}</span>
                    {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                    )}
                </>
            )}
        </NavLink>
    );
}

export default function Sidebar() {
    return (
        <aside
            className={[
                "hidden md:flex flex-col fixed top-0 left-0 h-screen w-[260px] z-30",
                "bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]",
            ].join(" ")}
        >
            {/* ── Brand ── */}
            <div className="flex items-center gap-3 px-5 py-[18px] border-b border-white/[0.07] shrink-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.1] shrink-0">
                    <Users size={18} className="text-indigo-300" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white leading-none mb-0.5">
                        EMS Portal
                    </p>
                    <p className="text-[11px] text-[var(--sidebar-text-muted)] leading-none">
                        HR Management
                    </p>
                </div>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--sidebar-text-muted)]">
                    Main Menu
                </p>

                {NAV_MAIN.map((item) => (
                    <SidebarNavItem key={item.to} item={item} />
                ))}

                <div className="my-3 border-t border-white/[0.07]" />

                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--sidebar-text-muted)]">
                    System
                </p>

                {NAV_SYSTEM.map((item) => (
                    <SidebarNavItem key={item.to} item={item} />
                ))}
            </nav>

            {/* ── User Profile ── */}
            <div className="px-4 py-3 border-t border-white/[0.07] shrink-0">
                <div className="flex items-center gap-3 p-2 rounded-[var(--radius-control)] hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)] text-white text-xs font-bold shrink-0">
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-none mb-0.5 truncate">
                            Admin User
                        </p>
                        <p className="text-[11px] text-[var(--sidebar-text-muted)] leading-none truncate">
                            HR Administrator
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
