import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Users, UserCheck, UserX, CalendarOff,
    Clock, TrendingUp, Building2, ArrowUpRight,
    CheckCircle, AlertCircle, UserPlus,
} from "lucide-react";
import {
    fetchDashboardStatsThunk,
    fetchRecentActivityThunk,
    fetchDeptStatsThunk,
} from "../dashboard.thunk";
import useAuth from "../../auth/hooks/useAuth";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";

/* ─── Fallback mock data (shown when API not connected) ─── */
const MOCK_STATS = {
    totalEmployees:   248,
    presentToday:     201,
    absentToday:       23,
    onLeave:           24,
    pendingApprovals:   7,
    newHires:           5,
};

const MOCK_DEPT = [
    { name: "Engineering",  count: 72,  color: "#4f46e5" },
    { name: "Marketing",    count: 38,  color: "#0284c7" },
    { name: "HR",           count: 21,  color: "#16a34a" },
    { name: "Finance",      count: 34,  color: "#d97706" },
    { name: "Operations",   count: 45,  color: "#dc2626" },
    { name: "Design",       count: 28,  color: "#7c3aed" },
    { name: "Sales",        count: 10,  color: "#0891b2" },
];

const MOCK_ACTIVITY = [
    { id: 1, type: "join",     text: "Sarah Johnson joined Engineering",      time: "2 min ago",  status: "success" },
    { id: 2, type: "leave",    text: "Mark Davis submitted leave request",     time: "15 min ago", status: "warning" },
    { id: 3, type: "approve",  text: "Leave approved for Emily Rodriguez",     time: "1 hr ago",   status: "success" },
    { id: 4, type: "absent",   text: "5 employees marked absent today",        time: "2 hr ago",   status: "danger"  },
    { id: 5, type: "join",     text: "Alex Kim joined Product team",           time: "3 hr ago",   status: "success" },
    { id: 6, type: "payroll",  text: "Payroll processed for October",          time: "Yesterday",  status: "info"    },
];

/* ─── Stat Card ─── */
function StatCard({ title, value, icon: Icon, iconBg, iconColor, trend, trendLabel, loading }) {
    if (loading) {
        return (
            <Card padding="md">
                <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl skeleton" />
                    <div className="w-14 h-5 rounded-full skeleton" />
                </div>
                <div className="w-16 h-7 rounded-lg skeleton mb-1" />
                <div className="w-24 h-4 rounded skeleton" />
            </Card>
        );
    }

    return (
        <Card padding="md" hover>
            <div className="flex items-start justify-between mb-3">
                <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{ background: iconBg }}
                >
                    <Icon size={18} style={{ color: iconColor }} />
                </div>
                {trend != null && (
                    <span
                        className={[
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                            trend >= 0
                                ? "bg-[var(--success-soft)] text-[var(--success)]"
                                : "bg-[var(--danger-soft)] text-[var(--danger)]",
                        ].join(" ")}
                    >
                        <ArrowUpRight size={11} className={trend < 0 ? "rotate-90" : ""} />
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] leading-none mb-1">
                {value?.toLocaleString() ?? "—"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{title}</p>
            {trendLabel && (
                <p className="text-xs text-[var(--text-muted)] mt-1">{trendLabel}</p>
            )}
        </Card>
    );
}

/* ─── Department Bar ─── */
function DeptBar({ dept, total }) {
    const pct = total > 0 ? Math.round((dept.count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--text-primary)] w-28 shrink-0 truncate">{dept.name}</p>
            <div className="flex-1 h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: dept.color }}
                />
            </div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] w-10 text-right shrink-0">
                {dept.count}
            </p>
        </div>
    );
}

/* ─── Activity Item ─── */
const activityIconMap = {
    join:    { Icon: UserPlus,    variant: "success" },
    leave:   { Icon: CalendarOff, variant: "warning" },
    approve: { Icon: CheckCircle, variant: "success" },
    absent:  { Icon: AlertCircle, variant: "danger"  },
    payroll: { Icon: TrendingUp,  variant: "info"    },
};

function ActivityItem({ item }) {
    const cfg = activityIconMap[item.type] ?? activityIconMap.join;
    const Icon = cfg.Icon;
    return (
        <div className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
            <div
                className={[
                    "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5",
                    "bg-[var(--surface-secondary)]",
                ].join(" ")}
            >
                <Badge variant={cfg.variant} className="!p-0 !bg-transparent !rounded-none">
                    <Icon size={14} />
                </Badge>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] leading-snug">{item.text}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.time}</p>
            </div>
        </div>
    );
}

/* ─── Attendance Donut ─── */
function AttendanceRing({ present, absent, onLeave, total }) {
    const pPct  = total > 0 ? (present / total) * 100 : 0;
    const aPct  = total > 0 ? (absent  / total) * 100 : 0;
    const lPct  = total > 0 ? (onLeave / total) * 100 : 0;

    // SVG circle trick
    const r = 52;
    const circ = 2 * Math.PI * r;
    const presLen   = (pPct  / 100) * circ;
    const absLen    = (aPct  / 100) * circ;
    const leaveLen  = (lPct  / 100) * circ;
    const presOffset  = 0;
    const absOffset   = presLen;
    const leaveOffset = presLen + absLen;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-secondary)" strokeWidth="12" />
                    {/* Present */}
                    <circle cx="60" cy="60" r={r} fill="none"
                        stroke="var(--success)" strokeWidth="12"
                        strokeDasharray={`${presLen} ${circ}`}
                        strokeDashoffset={-presOffset}
                        strokeLinecap="butt" />
                    {/* Absent */}
                    <circle cx="60" cy="60" r={r} fill="none"
                        stroke="var(--danger)" strokeWidth="12"
                        strokeDasharray={`${absLen} ${circ}`}
                        strokeDashoffset={-absOffset}
                        strokeLinecap="butt" />
                    {/* On Leave */}
                    <circle cx="60" cy="60" r={r} fill="none"
                        stroke="var(--warning)" strokeWidth="12"
                        strokeDasharray={`${leaveLen} ${circ}`}
                        strokeDashoffset={-leaveOffset}
                        strokeLinecap="butt" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-[var(--text-primary)] leading-none">{Math.round(pPct)}%</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Present</p>
                </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs">
                {[
                    { color: "var(--success)", label: "Present", val: present },
                    { color: "var(--danger)",  label: "Absent",  val: absent  },
                    { color: "var(--warning)", label: "On Leave",val: onLeave },
                ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
                        <span className="text-[var(--text-secondary)]">{l.label}</span>
                        <span className="font-semibold text-[var(--text-primary)]">{l.val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════ */
export default function DashboardPage() {
    const dispatch = useDispatch();
    const { user } = useAuth();

    const { stats, recentActivity, deptStats, statsStatus, activityStatus, deptStatus } =
        useSelector((state) => state.dashboard);

    const statsLoading    = statsStatus    === "loading";
    const activityLoading = activityStatus === "loading";
    const deptLoading     = deptStatus     === "loading";

    useEffect(() => {
        dispatch(fetchDashboardStatsThunk());
        dispatch(fetchRecentActivityThunk());
        dispatch(fetchDeptStatsThunk());
    }, [dispatch]);

    /* Use mock data if API hasn't returned yet or failed */
    const displayStats    = statsStatus    === "succeeded" ? stats         : MOCK_STATS;
    const displayActivity = activityStatus === "succeeded" ? recentActivity : MOCK_ACTIVITY;
    const displayDept     = deptStatus     === "succeeded" ? deptStats      : MOCK_DEPT;
    const deptTotal       = displayDept.reduce((sum, d) => sum + (d.count ?? 0), 0);

    /* Greeting */
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const today    = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)]">
                        {greeting}, {user?.name?.split(" ")[0] ?? "Admin"} 👋
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">{today}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--success-soft)] text-[var(--success)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                        System Online
                    </span>
                </div>
            </div>

            {/* ── Bento: Stat Cards (row 1) ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    title="Total Employees" value={displayStats.totalEmployees}
                    icon={Users} iconBg="var(--primary-soft)" iconColor="var(--primary)"
                    trend={4} trendLabel="vs last month" loading={statsLoading}
                />
                <StatCard
                    title="Present Today" value={displayStats.presentToday}
                    icon={UserCheck} iconBg="var(--success-soft)" iconColor="var(--success)"
                    loading={statsLoading}
                />
                <StatCard
                    title="Absent Today" value={displayStats.absentToday}
                    icon={UserX} iconBg="var(--danger-soft)" iconColor="var(--danger)"
                    loading={statsLoading}
                />
                <StatCard
                    title="On Leave" value={displayStats.onLeave}
                    icon={CalendarOff} iconBg="var(--warning-soft)" iconColor="var(--warning)"
                    loading={statsLoading}
                />
                <StatCard
                    title="Pending Approvals" value={displayStats.pendingApprovals}
                    icon={Clock} iconBg="var(--info-soft)" iconColor="var(--info)"
                    loading={statsLoading}
                />
                <StatCard
                    title="New Hires" value={displayStats.newHires}
                    icon={TrendingUp} iconBg="var(--primary-soft)" iconColor="var(--primary-muted)"
                    trend={12} loading={statsLoading}
                />
            </div>

            {/* ── Bento row 2: Attendance ring + Dept breakdown + Activity ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Attendance Ring */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Today&apos;s Attendance</Card.Title>
                        <Badge variant="success" dot>{today.split(",")[0]}</Badge>
                    </Card.Header>
                    <Card.Body className="flex justify-center pt-2">
                        {statsLoading ? (
                            <div className="w-32 h-32 rounded-full skeleton" />
                        ) : (
                            <AttendanceRing
                                present={displayStats.presentToday}
                                absent={displayStats.absentToday}
                                onLeave={displayStats.onLeave}
                                total={displayStats.totalEmployees}
                            />
                        )}
                    </Card.Body>
                </Card>

                {/* Department Breakdown */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Departments</Card.Title>
                        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <Building2 size={13} />
                            {displayDept.length} depts
                        </span>
                    </Card.Header>
                    <Card.Body className="space-y-3 pt-1">
                        {deptLoading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-24 h-4 rounded skeleton" />
                                    <div className="flex-1 h-2 rounded-full skeleton" />
                                    <div className="w-8 h-4 rounded skeleton" />
                                </div>
                            ))
                            : displayDept.map((d) => (
                                <DeptBar key={d.name} dept={d} total={deptTotal} />
                            ))
                        }
                    </Card.Body>
                </Card>

                {/* Recent Activity */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Recent Activity</Card.Title>
                        {displayStats.pendingApprovals > 0 && (
                            <Badge variant="warning" dot>{displayStats.pendingApprovals} pending</Badge>
                        )}
                    </Card.Header>
                    <Card.Body>
                        {activityLoading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex gap-3 py-3 border-b border-[var(--border)] last:border-0">
                                    <div className="w-8 h-8 rounded-lg skeleton shrink-0" />
                                    <div className="flex-1 space-y-1.5 pt-1">
                                        <div className="h-4 w-3/4 rounded skeleton" />
                                        <div className="h-3 w-1/3 rounded skeleton" />
                                    </div>
                                </div>
                            ))
                            : displayActivity.map((item) => (
                                <ActivityItem key={item.id} item={item} />
                            ))
                        }
                    </Card.Body>
                </Card>
            </div>

            {/* ── Bento row 3: Quick stats cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: "Attendance Rate",
                        value: displayStats.totalEmployees > 0
                            ? `${Math.round((displayStats.presentToday / displayStats.totalEmployees) * 100)}%`
                            : "—",
                        sub: "Of total workforce today",
                        color: "var(--success)",
                        bg:    "var(--success-soft)",
                        icon:  UserCheck,
                    },
                    {
                        label: "Leave Utilization",
                        value: displayStats.totalEmployees > 0
                            ? `${Math.round((displayStats.onLeave / displayStats.totalEmployees) * 100)}%`
                            : "—",
                        sub: "Employees currently on leave",
                        color: "var(--warning)",
                        bg:    "var(--warning-soft)",
                        icon:  CalendarOff,
                    },
                    {
                        label: "Pending Reviews",
                        value: displayStats.pendingApprovals,
                        sub: "Leave & approval requests",
                        color: "var(--info)",
                        bg:    "var(--info-soft)",
                        icon:  Clock,
                    },
                ].map((item) => (
                    <Card key={item.label} padding="md">
                        <div className="flex items-center gap-4">
                            <div
                                className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                                style={{ background: item.bg }}
                            >
                                <item.icon size={20} style={{ color: item.color }} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[var(--text-primary)] leading-none mb-0.5">
                                    {statsLoading
                                        ? <span className="inline-block w-16 h-7 rounded-lg skeleton" />
                                        : item.value
                                    }
                                </p>
                                <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                                <p className="text-xs text-[var(--text-muted)]">{item.sub}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

