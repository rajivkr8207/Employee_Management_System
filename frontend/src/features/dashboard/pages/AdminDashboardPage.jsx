import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
    Users,
    UserCheck,
    Clock,
    UserX,
    Store,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Activity,
    Sparkles,
} from "lucide-react";
import { fetchAdminDashboardStatsThunk } from "../../admin/adminSlice";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

function StatCard({ title, value, sub, icon: Icon, iconBg, iconColor, badge, linkTo }) {
    const cardContent = (
        <Card padding="md" hover={!!linkTo} className="relative overflow-hidden group">
            <div className="flex items-start justify-between mb-3">
                <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ background: iconBg }}
                >
                    <Icon size={19} style={{ color: iconColor }} />
                </div>
                {badge && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-1">
                {value != null ? value.toLocaleString() : "—"}
            </p>
            <p className="text-sm font-medium text-[var(--text-secondary)] truncate">{title}</p>
            {sub && <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{sub}</p>}
        </Card>
    );

    if (linkTo) {
        return <Link to={linkTo}>{cardContent}</Link>;
    }
    return cardContent;
}

export default function AdminDashboardPage() {
    const dispatch = useDispatch();
    const { stats, statsLoading, statsError } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchAdminDashboardStatsThunk());
    }, [dispatch]);

    if (!stats) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Admin Overview</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Manage every user, store, manager, and employee across the system
                    </p>
                </div>
                {statsError ? (
                    <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">
                        <span>{statsError}</span>
                        <Button variant="outline" size="sm" onClick={() => dispatch(fetchAdminDashboardStatsThunk())}>
                            Retry
                        </Button>
                    </div>
                ) : (
                    <Card className="text-sm text-[var(--text-muted)]">
                        {statsLoading ? "Loading dashboard..." : "Dashboard data is not available."}
                    </Card>
                )}
            </div>
        );
    }

    const s = stats;

    const userVerifyPct = s.users.total
        ? Math.round((s.users.verified / s.users.total) * 100)
        : 0;
    const storeActivePct = s.stores.total
        ? Math.round((s.stores.active / s.stores.total) * 100)
        : 0;
    const managerApprovePct = Math.round((s.managers.approved / (s.managers.total || 1)) * 100);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                            Admin Overview
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary-soft)] text-[var(--primary)]">
                            <Sparkles size={11} />
                            Master Control
                        </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Manage every user, store, manager, and employee across the system
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <Link to="/admin/user-verification">
                        <Button variant="outline" size="sm" icon={UserCheck}>
                            Verify Users ({s.users.pending})
                        </Button>
                    </Link>
                    <Link to="/admin/store-verification">
                        <Button variant="outline" size="sm" icon={Store}>
                            Verify Stores ({s.stores.pending})
                        </Button>
                    </Link>
                    <Link to="/admin/stores">
                        <Button variant="primary" size="sm" icon={Store}>
                            View Stores ({s.stores.total})
                        </Button>
                    </Link>
                </div>
            </div>

            {statsError && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">
                    <span>{statsError}</span>
                    <Button variant="outline" size="sm" onClick={() => dispatch(fetchAdminDashboardStatsThunk())}>
                        Retry
                    </Button>
                </div>
            )}

            {/* ── Section 1: User Verification Stats ── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        User Registration & Verification
                    </h2>
                    <Link to="/admin/user-verification" className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1">
                        Review All <ArrowRight size={12} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Users"
                        value={s.users.total}
                        sub="Registered in database"
                        icon={Users}
                        iconBg="var(--primary-soft)"
                        iconColor="var(--primary)"
                        linkTo="/admin/users"
                    />
                    <StatCard
                        title="Verified Users"
                        value={s.users.verified}
                        sub={`${userVerifyPct}% of user base`}
                        icon={UserCheck}
                        iconBg="var(--success-soft)"
                        iconColor="var(--success)"
                        linkTo="/admin/user-verification"
                    />
                    <StatCard
                        title="Pending Verification"
                        value={s.users.pending}
                        sub="Awaiting admin review"
                        icon={Clock}
                        iconBg="var(--warning-soft)"
                        iconColor="var(--warning)"
                        badge={s.users.pending > 0 ? "Action Required" : null}
                        linkTo="/admin/user-verification"
                    />
                    <StatCard
                        title="Blocked Users"
                        value={s.users.blocked}
                        sub="Blocked accounts"
                        icon={UserX}
                        iconBg="var(--danger-soft)"
                        iconColor="var(--danger)"
                        linkTo="/admin/users"
                    />
                </div>
            </div>

            {/* ── Section 2: Directory Totals ── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Store and Employee Directory
                    </h2>
                    <Link to="/admin/stores" className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1">
                        View Stores <ArrowRight size={12} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Stores"
                        value={s.stores.total}
                        sub="Across all organizations"
                        icon={Store}
                        iconBg="var(--info-soft)"
                        iconColor="var(--info)"
                        linkTo="/admin/stores"
                    />
                    <StatCard
                        title="Active Stores"
                        value={s.stores.active}
                        sub={`${storeActivePct}% of all stores`}
                        icon={CheckCircle2}
                        iconBg="var(--success-soft)"
                        iconColor="var(--success)"
                        linkTo="/admin/stores"
                    />
                    <StatCard
                        title="Pending Store Approval"
                        value={s.stores.pending}
                        sub="Awaiting administrator review"
                        icon={Clock}
                        iconBg="var(--warning-soft)"
                        iconColor="var(--warning)"
                        badge={s.stores.pending > 0 ? "Action Required" : null}
                        linkTo="/admin/store-verification"
                    />
                    <StatCard
                        title="Total Employees"
                        value={s.employees.total}
                        sub={`${s.employees.active} active`}
                        icon={Users}
                        iconBg="var(--primary-soft)"
                        iconColor="var(--primary)"
                        linkTo="/admin/employees"
                    />
                </div>
            </div>

            {/* ── Section 3: Manager Approvals & Verification Progress ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Manager Stats Card */}
                <Card padding="md" className="flex flex-col justify-between">
                    <Card.Header withBorder>
                        <Card.Title>Store Managers</Card.Title>
                        <Link to="/admin/manager-verification" className="text-xs text-[var(--primary)] font-semibold hover:underline">
                            Manage
                        </Link>
                    </Card.Header>
                    <Card.Body className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-3 rounded-[var(--radius-control)] bg-[var(--surface-secondary)]">
                                <p className="text-xl font-bold text-[var(--text-primary)]">{s.managers.total}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Total</p>
                            </div>
                            <div className="p-3 rounded-[var(--radius-control)] bg-[var(--success-soft)] text-[var(--success)]">
                                <p className="text-xl font-bold">{s.managers.approved}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Approved</p>
                            </div>
                            <div className="p-3 rounded-[var(--radius-control)] bg-[var(--warning-soft)] text-[var(--warning)]">
                                <p className="text-xl font-bold">{s.managers.pending}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Pending</p>
                            </div>
                        </div>

                        <div className="p-3 rounded-[var(--radius-control)] bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-xs text-[var(--text-primary)] space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-[var(--primary)]">
                                <ShieldCheck size={14} />
                                Governance Rule
                            </div>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                A store manager can only be authorized once their assigned store has been approved by an administrator.
                            </p>
                        </div>
                    </Card.Body>
                </Card>

                {/* Verification Health & Charts */}
                <Card padding="md" className="lg:col-span-2">
                    <Card.Header withBorder>
                        <Card.Title>Verification Statistics & Health</Card.Title>
                        <Badge variant="info">Live Metrics</Badge>
                    </Card.Header>
                    <Card.Body className="space-y-5 pt-1">
                        {/* Users Verification Progress */}
                        <div>
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                                    <Users size={13} className="text-[var(--primary)]" />
                                    Users Verification Completion
                                </span>
                                <span className="text-[var(--text-secondary)]">
                                    {s.users.verified} / {s.users.total} ({userVerifyPct}%)
                                </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                                    style={{ width: `${userVerifyPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Stores Approval Progress */}
                        <div>
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                                    <Store size={13} className="text-emerald-500" />
                                    Active Store Rate
                                </span>
                                <span className="text-[var(--text-secondary)]">
                                    {s.stores.active} / {s.stores.total} ({storeActivePct}%)
                                </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${storeActivePct}%` }}
                                />
                            </div>
                        </div>

                        {/* Manager Approval Progress */}
                        <div>
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                                    <ShieldCheck size={13} className="text-indigo-500" />
                                    Manager Assignment Compliance
                                </span>
                                <span className="text-[var(--text-secondary)]">
                                    {s.managers.approved} / {s.managers.total} ({managerApprovePct}%)
                                </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                    style={{ width: `${managerApprovePct}%` }}
                                />
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* ── Section 4: Recent registrations and directories ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Registrations */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title className="flex items-center gap-2">
                            <Activity size={16} className="text-[var(--primary)]" />
                            Recent Registrations
                        </Card.Title>
                        <Link to="/admin/user-verification" className="text-xs text-[var(--primary)] font-semibold hover:underline">
                            View All
                        </Link>
                    </Card.Header>
                    <Card.Body>
                        <div className="divide-y divide-[var(--border)]">
                            {s.recentRegistrations.map((item) => (
                                <div key={item.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)] shrink-0">
                                            {(item.name || "?")[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">
                                                Role: {item.role} • {item.time ? new Date(item.time).toLocaleDateString() : "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={item.status === "active" ? "success" : item.status === "blocked" ? "danger" : "warning"}
                                        dot
                                    >
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                            {!s.recentRegistrations.length && !statsLoading && (
                                <p className="py-6 text-center text-sm text-[var(--text-muted)]">No registrations found.</p>
                            )}
                            {statsLoading && (
                                <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading registrations...</p>
                            )}
                        </div>
                    </Card.Body>
                </Card>

                {/* Directory shortcuts */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title className="flex items-center gap-2">
                            <Users size={16} className="text-[var(--primary)]" />
                            System Directories
                        </Card.Title>
                    </Card.Header>
                    <Card.Body className="space-y-3">
                        <div className="flex items-center justify-between gap-4 rounded-lg bg-[var(--surface-secondary)] p-3">
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">All users</p>
                                <p className="text-xs text-[var(--text-muted)]">{s.users.total.toLocaleString()} accounts</p>
                            </div>
                            <Link to="/admin/users" className="text-xs font-semibold text-[var(--primary)] hover:underline">Open directory</Link>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-lg bg-[var(--surface-secondary)] p-3">
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">All stores</p>
                                <p className="text-xs text-[var(--text-muted)]">{s.stores.total.toLocaleString()} locations</p>
                            </div>
                            <Link to="/admin/stores" className="text-xs font-semibold text-[var(--primary)] hover:underline">Open directory</Link>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-lg bg-[var(--surface-secondary)] p-3">
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">All employees</p>
                                <p className="text-xs text-[var(--text-muted)]">{s.employees.total.toLocaleString()} people</p>
                            </div>
                            <Link to="/admin/employees" className="text-xs font-semibold text-[var(--primary)] hover:underline">Open directory</Link>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}
