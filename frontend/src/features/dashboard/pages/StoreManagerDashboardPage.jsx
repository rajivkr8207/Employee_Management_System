import { Link } from "react-router-dom";
import {
    CalendarCheck,
    CalendarOff,
    Clock,
    UserCheck,
    UserX,
    UserPlus,
    MapPin,
    CheckCircle2,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

export default function StoreManagerDashboardPage() {
    // Current manager's assigned store
    const assignedStore = {
        name: "Nexus Superstore - Bandra",
        code: "STR-MUM-01",
        address: "Plot 14, Linking Road, Bandra West, Mumbai",
        status: "approved",
        totalEmployees: 34,
        shiftTiming: "08:00 AM - 10:00 PM (2 Shifts)",
    };

    const attendanceStats = {
        present: 30,
        absent: 2,
        late: 3,
        onLeave: 2,
    };

    const presentEmployees = [
        { id: "e1", name: "Sunil Verma", designation: "Inventory Lead", shift: "Morning", time: "07:55 AM" },
        { id: "e2", name: "Pooja Hegde", designation: "Cashier", shift: "Morning", time: "08:00 AM" },
        { id: "e3", name: "Ramesh Pawar", designation: "Floor Assistant", shift: "Morning", time: "08:12 AM" },
        { id: "e4", name: "Divya Rao", designation: "Customer Desk", shift: "Morning", time: "08:05 AM" },
    ];

    const absentEmployees = [
        { id: "e5", name: "Ketan Shinde", designation: "Store Stacker", reason: "Unreported Absent" },
        { id: "e6", name: "Meena Chawla", designation: "Billing Specialist", reason: "Approved Casual Leave" },
    ];

    const pendingLeaves = [
        { id: "l1", employee: "Rohan Patel", designation: "Sales Associate", type: "Sick Leave", dates: "Nov 03 - Nov 04", reason: "Severe headache & viral fever" },
        { id: "l2", employee: "Kavita Rao", designation: "Cashier", type: "Casual Leave", dates: "Nov 05", reason: "Family event" },
    ];

    const recentEmployeeActivities = [
        { id: "a1", text: "Sunil Verma clocked in for Morning Shift", time: "07:55 AM" },
        { id: "a2", text: "Rohan Patel applied for Sick Leave (2 days)", time: "08:30 AM" },
        { id: "a3", text: "Daily store opening checklist verified by Floor Lead", time: "08:45 AM" },
        { id: "a4", text: "Shift handover log signed off for Night team", time: "Yesterday, 10:15 PM" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Assigned Store Banner ── */}
            <div className="p-5 sm:p-6 rounded-[var(--radius-card)] bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/40 shadow-[var(--shadow-md)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                                Assigned Store
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 size={11} /> Approved & Active
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            {assignedStore.name}
                        </h1>
                        <p className="text-xs sm:text-sm text-indigo-200/80 flex items-center gap-1.5 pt-0.5">
                            <MapPin size={14} className="shrink-0" />
                            {assignedStore.address} • Store Code: <strong className="text-white">{assignedStore.code}</strong>
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-3 py-1.5 rounded-[var(--radius-control)] bg-white/10 text-indigo-100 border border-white/10">
                            {assignedStore.shiftTiming}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Quick Action Shortcuts ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link to="/store-manager/attendance" className="p-3.5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm transition-all group flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <CalendarCheck size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">Mark Attendance</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">Roster check-in</p>
                    </div>
                </Link>

                <Link to="/store-manager/employees" className="p-3.5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm transition-all group flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <UserPlus size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">Add Employee</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">Branch onboard</p>
                    </div>
                </Link>

                <Link to="/store-manager/leaves" className="p-3.5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm transition-all group flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <CalendarOff size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">Review Leaves</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{pendingLeaves.length} pending</p>
                    </div>
                </Link>

                <Link to="/store-manager/shifts" className="p-3.5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm transition-all group flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Clock size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">Shift Schedule</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">Roster management</p>
                    </div>
                </Link>
            </div>

            {/* ── Key Numbers ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card padding="md">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        Store Employees
                    </p>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">
                        {assignedStore.totalEmployees}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Active staff in Bandra branch
                    </p>
                </Card>

                <Card padding="md">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                        Present Today
                    </p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {attendanceStats.present}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        88% attendance turnout
                    </p>
                </Card>

                <Card padding="md">
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                        Absent Employees
                    </p>
                    <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                        {attendanceStats.absent}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Unexcused staff today
                    </p>
                </Card>

                <Card padding="md">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                        On Leave / Late
                    </p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {attendanceStats.onLeave + attendanceStats.late}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {attendanceStats.late} late check-ins, {attendanceStats.onLeave} on leave
                    </p>
                </Card>
            </div>

            {/* ── Attendance lists (Present / Absent) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Present staff */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title className="flex items-center gap-2">
                            <UserCheck size={16} className="text-emerald-500" />
                            Checked In (Today)
                        </Card.Title>
                        <Link to="/store-manager/attendance" className="text-xs text-[var(--primary)] font-semibold hover:underline">
                            Full Log
                        </Link>
                    </Card.Header>
                    <Card.Body className="space-y-2">
                        {presentEmployees.map((emp) => (
                            <div key={emp.id} className="p-3 rounded-[var(--radius-control)] bg-[var(--surface-secondary)] flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)]">{emp.name}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{emp.designation} • Shift: {emp.shift}</p>
                                </div>
                                <Badge variant="success">In: {emp.time}</Badge>
                            </div>
                        ))}
                        {/* Absent employees */}
                        <div className="pt-2 border-t border-[var(--border)]">
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2 flex items-center gap-1.5">
                                <UserX size={13} /> Absent Staff (Today)
                            </p>
                            <div className="space-y-1.5">
                                {absentEmployees.map((ab) => (
                                    <div key={ab.id} className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-xs flex justify-between items-center">
                                        <span className="font-semibold text-[var(--text-primary)]">{ab.name} ({ab.designation})</span>
                                        <span className="text-rose-600 dark:text-rose-400 font-medium">{ab.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Absent staff & Pending Leaves */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title className="flex items-center gap-2">
                            <CalendarOff size={16} className="text-amber-500" />
                            Pending Leave Approvals
                        </Card.Title>
                        <Badge variant="warning">{pendingLeaves.length} requests</Badge>
                    </Card.Header>
                    <Card.Body className="space-y-3">
                        {pendingLeaves.map((l) => (
                            <div key={l.id} className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{l.employee}</p>
                                    <Badge variant="info">{l.type}</Badge>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)]">Dates: {l.dates} • {l.designation}</p>
                                <p className="text-xs text-[var(--text-muted)] italic">&ldquo;{l.reason}&rdquo;</p>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                                    <Button size="xs" variant="ghost" className="text-rose-500">Decline</Button>
                                    <Button size="xs" variant="primary">Approve Leave</Button>
                                </div>
                            </div>
                        ))}
                        {/* Absent employees */}
                        <div className="pt-2 border-t border-[var(--border)]">
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2 flex items-center gap-1.5">
                                <UserX size={13} /> Absent Staff (Today)
                            </p>
                            <div className="space-y-1.5">
                                {absentEmployees.map((ab) => (
                                    <div key={ab.id} className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-xs flex justify-between items-center">
                                        <span className="font-semibold text-[var(--text-primary)]">{ab.name} ({ab.designation})</span>
                                        <span className="text-rose-600 dark:text-rose-400 font-medium">{ab.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* ── Recent Employee Activities ── */}
            <Card padding="md">
                <Card.Header withBorder>
                    <Card.Title>Store Activity Stream</Card.Title>
                    <span className="text-xs text-[var(--text-muted)]">Live updates today</span>
                </Card.Header>
                <Card.Body>
                    <div className="divide-y divide-[var(--border)]">
                        {recentEmployeeActivities.map((act) => (
                            <div key={act.id} className="py-2.5 flex items-center justify-between text-sm first:pt-0 last:pb-0">
                                <span className="text-[var(--text-primary)] font-medium">{act.text}</span>
                                <span className="text-xs text-[var(--text-muted)] shrink-0 ml-4">{act.time}</span>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
