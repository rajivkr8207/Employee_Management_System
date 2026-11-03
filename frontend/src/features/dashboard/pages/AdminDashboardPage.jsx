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
    XCircle,
    Activity,
    AlertCircle,
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
    const { stats } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchAdminDashboardStatsThunk());
    }, [dispatch]);

    // Fallback data if loading or null
    const s = stats || {
        users: { total: 1248, verified: 1180, pending: 48, rejected: 20 },
        stores: { total: 86, approved: 74, pending: 9, rejected: 3 },
        managers: { total: 92, approved: 81, pending: 8, rejected: 3 },
        recentRegistrations: [
            { id: "reg_1", name: "Rohan Patel", role: "Employee", time: "10 mins ago", status: "pending" },
            { id: "reg_2", name: "Ananya Sharma", role: "Store Manager", time: "45 mins ago", status: "pending" },
            { id: "reg_3", name: "Apex Hypermarket", role: "Store", time: "2 hours ago", status: "pending" },
            { id: "reg_4", name: "Vikram Malhotra", role: "Store Admin", time: "3 hours ago", status: "pending" },
        ],
        recentApprovals: [
            { id: "app_1", subject: "Pooja Hegde (Store Admin)", action: "Approved", time: "1 hour ago", status: "approved" },
            { id: "app_2", subject: "QuickMart Express - Indiranagar", action: "Approved", time: "3 hours ago", status: "approved" },
            { id: "app_3", subject: "Metro Retail - CP", action: "Rejected", time: "Yesterday", status: "rejected", reason: "Expired NOC" },
        ],
    };

    const userVerifyPct = Math.round((s.users.verified / (s.users.total || 1)) * 100);
    const storeApprovePct = Math.round((s.stores.approved / (s.stores.total || 1)) * 100);
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
                        System-level verification, store authorization, and live governance metrics
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <Link to="/admin/user-verification">
                        <Button variant="outline" size="sm" icon={UserCheck}>
                            Verify Users ({s.users.pending})
                        </Button>
                    </Link>
                    <Link to="/admin/store-verification">
                        <Button variant="primary" size="sm" icon={Store}>
                            Approve Stores ({s.stores.pending})
                        </Button>
                    </Link>
                </div>
            </div>

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
                        title="Rejected Users"
                        value={s.users.rejected}
                        sub="Declined applications"
                        icon={UserX}
                        iconBg="var(--danger-soft)"
                        iconColor="var(--danger)"
                        linkTo="/admin/user-verification"
                    />
                </div>
            </div>

            {/* ── Section 2: Store Verification Stats ── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Store Approvals & Facilities
                    </h2>
                    <Link to="/admin/store-verification" className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1">
                        Review Stores <ArrowRight size={12} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Stores"
                        value={s.stores.total}
                        sub="Enterprise locations"
                        icon={Store}
                        iconBg="var(--info-soft)"
                        iconColor="var(--info)"
                        linkTo="/admin/stores"
                    />
                    <StatCard
                        title="Approved Stores"
                        value={s.stores.approved}
                        sub="Active & operational"
                        icon={CheckCircle2}
                        iconBg="var(--success-soft)"
                        iconColor="var(--success)"
                        linkTo="/admin/store-verification"
                    />
                    <StatCard
                        title="Pending Approvals"
                        value={s.stores.pending}
                        sub="Submitted for validation"
                        icon={AlertCircle}
                        iconBg="var(--warning-soft)"
                        iconColor="var(--warning)"
                        badge={s.stores.pending > 0 ? `${s.stores.pending} Stores` : null}
                        linkTo="/admin/store-verification"
                    />
                    <StatCard
                        title="Rejected Stores"
                        value={s.stores.rejected}
                        sub="Incomplete documents"
                        icon={XCircle}
                        iconBg="var(--danger-soft)"
                        iconColor="var(--danger)"
                        linkTo="/admin/store-verification"
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
                                    Store Approval Rate
                                </span>
                                <span className="text-[var(--text-secondary)]">
                                    {s.stores.approved} / {s.stores.total} ({storeApprovePct}%)
                                </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${storeApprovePct}%` }}
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

            {/* ── Section 4: Live Activities Feeds ── */}
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
                                            {item.name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">
                                                Role: {item.role} • {item.time}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={item.status === "verified" ? "success" : "warning"} dot>
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>

                {/* Recent Approvals & Actions */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Recent Approval Activities
                        </Card.Title>
                        <Link to="/admin/activity-logs" className="text-xs text-[var(--primary)] font-semibold hover:underline">
                            Activity Log
                        </Link>
                    </Card.Header>
                    <Card.Body>
                        <div className="divide-y divide-[var(--border)]">
                            {s.recentApprovals.map((item) => (
                                <div key={item.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                            {item.subject}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                                            {item.action} • {item.time}
                                            {item.reason && ` (Reason: ${item.reason})`}
                                        </p>
                                    </div>
                                    <Badge variant={item.status === "approved" ? "success" : "danger"}>
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}
