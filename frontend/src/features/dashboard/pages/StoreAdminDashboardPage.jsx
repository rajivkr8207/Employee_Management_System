import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Store,
    Users,
    ShieldCheck,
    CalendarOff,
    UserCheck,
    UserX,
    Clock,
    Building2,
    TrendingUp,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

export default function StoreAdminDashboardPage() {
    const [selectedStore, setSelectedStore] = useState("all");

    // Mock data for assigned stores
    const assignedStores = [
        { id: "str_1", name: "Nexus Superstore - Bandra", code: "STR-MUM-01", location: "Mumbai", employees: 34, managers: 2, attendanceRate: 94 },
        { id: "str_2", name: "QuickMart Express - Indiranagar", code: "STR-BLR-02", location: "Bengaluru", employees: 28, managers: 1, attendanceRate: 89 },
        { id: "str_3", name: "Apex Hypermarket - CyberCity", code: "STR-GGN-03", location: "Gurugram", employees: 45, managers: 2, attendanceRate: 91 },
    ];

    const todayAttendance = {
        total: 107,
        present: 96,
        absent: 6,
        onLeave: 5,
        pendingLeaves: 4,
    };

    const presentEmployees = [
        { id: "emp_1", name: "Amit Sharma", role: "Cashier Lead", store: "Bandra", inTime: "08:55 AM" },
        { id: "emp_2", name: "Priya Nair", role: "Floor Supervisor", store: "Indiranagar", inTime: "09:02 AM" },
        { id: "emp_3", name: "Sunil Verma", role: "Inventory Specialist", store: "CyberCity", inTime: "08:45 AM" },
        { id: "emp_4", name: "Divya Rao", role: "Customer Service", store: "Bandra", inTime: "09:10 AM" },
    ];

    const absentEmployees = [
        { id: "emp_5", name: "Deepak Joshi", role: "Warehouse Associate", store: "CyberCity", reason: "Unannounced" },
        { id: "emp_6", name: "Sneha Patil", role: "Billing Associate", store: "Indiranagar", reason: "Medical Emergency" },
    ];

    const pendingLeaves = [
        { id: "lv_1", name: "Ramesh Pawar", store: "Bandra", type: "Sick Leave", duration: "Nov 03 - Nov 05 (3 days)", reason: "Fever & recovery" },
        { id: "lv_2", name: "Anjali Gupta", store: "Indiranagar", type: "Casual Leave", duration: "Nov 04 (1 day)", reason: "Personal family event" },
        { id: "lv_3", name: "Vikas Sethi", store: "CyberCity", type: "Annual Leave", duration: "Nov 10 - Nov 14 (5 days)", reason: "Annual family vacation" },
    ];

    const recentActivities = [
        { id: "act_1", text: "New employee Pooja R. onboarded at Bandra Store", time: "25 mins ago", type: "user" },
        { id: "act_2", text: "Inventory audit completed for Indiranagar Store", time: "2 hours ago", type: "audit" },
        { id: "act_3", text: "Rajesh Kulkarni approved shift schedule for CyberCity", time: "4 hours ago", type: "shift" },
        { id: "act_4", text: "Store maintenance ticket resolved at Bandra location", time: "Yesterday", type: "maintenance" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Page Header & Store Filter ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        Store Admin Dashboard
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Oversee assigned stores, store managers, attendance, and branch compliance
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">
                        Store View:
                    </label>
                    <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="text-sm px-3 py-1.5 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    >
                        <option value="all">All Assigned Stores (3)</option>
                        {assignedStores.map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Key Metrics Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card padding="md">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                            <Store size={20} />
                        </div>
                        <Badge variant="primary">Assigned</Badge>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">3</p>
                    <p className="text-sm text-[var(--text-secondary)]">Assigned Stores</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Mumbai, Bengaluru, Gurugram</p>
                </Card>

                <Card padding="md">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                            <ShieldCheck size={20} />
                        </div>
                        <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">5</p>
                    <p className="text-sm text-[var(--text-secondary)]">Store Managers</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Across all branches</p>
                </Card>

                <Card padding="md">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <span className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5">
                            <TrendingUp size={12} /> +4 this mo
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">107</p>
                    <p className="text-sm text-[var(--text-secondary)]">Total Employees</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Full-time & retail shifts</p>
                </Card>

                <Card padding="md">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                            <CalendarOff size={20} />
                        </div>
                        {todayAttendance.pendingLeaves > 0 && (
                            <Badge variant="warning" dot>{todayAttendance.pendingLeaves} Pending</Badge>
                        )}
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">{todayAttendance.pendingLeaves}</p>
                    <p className="text-sm text-[var(--text-secondary)]">Pending Leave Requests</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Requires review</p>
                </Card>
            </div>

            {/* ── Today's Attendance Overview ── */}
            <Card padding="md">
                <Card.Header withBorder>
                    <div>
                        <Card.Title>Today&apos;s Store Attendance Roster</Card.Title>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Real-time check-in status across all assigned retail locations
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[var(--text-secondary)]">Present: <strong>{todayAttendance.present}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="text-[var(--text-secondary)]">Absent: <strong>{todayAttendance.absent}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="text-[var(--text-secondary)]">On Leave: <strong>{todayAttendance.onLeave}</strong></span>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                        {/* Present employees sample */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                                <UserCheck size={14} />
                                Checked In Today
                            </h3>
                            <div className="space-y-2">
                                {presentEmployees.map((e) => (
                                    <div key={e.id} className="p-2.5 rounded-[var(--radius-control)] bg-[var(--surface-secondary)] flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)]">{e.name}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{e.role} • {e.store} Store</p>
                                        </div>
                                        <Badge variant="success">{e.inTime}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Absent employees */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                                <UserX size={14} />
                                Absent Employees
                            </h3>
                            <div className="space-y-2">
                                {absentEmployees.map((e) => (
                                    <div key={e.id} className="p-2.5 rounded-[var(--radius-control)] bg-[var(--surface-secondary)] flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)]">{e.name}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{e.role} • {e.store} Store</p>
                                        </div>
                                        <Badge variant="danger">{e.reason}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* ── Pending Leave Requests & Store Activities ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leave Requests */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title className="flex items-center gap-2">
                            <Clock size={16} className="text-amber-500" />
                            Pending Leave Requests
                        </Card.Title>
                        <Badge variant="warning">{pendingLeaves.length} items</Badge>
                    </Card.Header>
                    <Card.Body className="space-y-3">
                        {pendingLeaves.map((lv) => (
                            <div key={lv.id} className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-[var(--text-primary)]">{lv.name}</p>
                                    <Badge variant="info">{lv.type}</Badge>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Branch: {lv.store} Store • Period: {lv.duration}
                                </p>
                                <p className="text-xs text-[var(--text-muted)] italic">
                                    &ldquo;{lv.reason}&rdquo;
                                </p>
                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]">
                                    <Button size="xs" variant="ghost" className="text-rose-500">
                                        Decline
                                    </Button>
                                    <Button size="xs" variant="primary">
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </Card.Body>
                </Card>

                {/* Recent Activities */}
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Recent Store Activities</Card.Title>
                        <Link to="/store-admin/stores" className="text-xs text-[var(--primary)] font-semibold hover:underline">
                            Stores List
                        </Link>
                    </Card.Header>
                    <Card.Body>
                        <div className="divide-y divide-[var(--border)]">
                            {recentActivities.map((act) => (
                                <div key={act.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                                        <Building2 size={15} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{act.text}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}
