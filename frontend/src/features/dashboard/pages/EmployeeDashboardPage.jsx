import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    CalendarCheck,
    CalendarOff,
    Clock,
    DollarSign,
    Download,
    TrendingUp,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

export default function EmployeeDashboardPage() {
    const { user } = useSelector((state) => state.auth);
    const [clockedIn, setClockedIn] = useState(true);

    const displayName = user?.fullName || user?.name || "Rohan Patel";
    const employeeId = user?.employeeId || "EMP-2026-089";
    const department = user?.department || "Retail Operations - Bandra Store";
    const shift = "Morning Shift (08:00 AM - 04:30 PM)";

    const attendanceSummary = {
        daysPresent: 22,
        totalWorkingDays: 24,
        onTimeRate: "96%",
        totalHours: "176 hrs",
        todayCheckIn: "07:58 AM",
    };

    const leaveBalances = [
        { type: "Casual Leave", total: 10, used: 3, remaining: 7, color: "var(--primary)" },
        { type: "Sick Leave", total: 8, used: 1, remaining: 7, color: "var(--info)" },
        { type: "Annual Leave", total: 15, used: 5, remaining: 10, color: "var(--success)" },
    ];

    const recentLeaves = [
        { id: "l1", type: "Sick Leave", dates: "Oct 14, 2026", days: 1, status: "approved", reason: "Viral fever" },
        { id: "l2", type: "Casual Leave", dates: "Nov 06 - Nov 07", days: 2, status: "pending", reason: "Personal family commitment" },
    ];

    const salaryPreview = {
        netSalary: "₹ 32,450",
        payPeriod: "October 2026",
        basic: "₹ 24,000",
        allowances: "₹ 11,200",
        deductions: "₹ 2,750",
        status: "Paid",
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Employee Welcome & Profile Banner ── */}
            <div className="p-5 sm:p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0">
                            {displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                                    {displayName}
                                </h1>
                                <Badge variant="success" dot>Active Employee</Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                ID: <strong className="text-[var(--text-primary)]">{employeeId}</strong> • {department}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                                <Clock size={12} /> Shift: {shift}
                            </p>
                        </div>
                    </div>

                    {/* Clock In / Out Quick Action */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                        <div className="text-left sm:text-right">
                            <p className="text-xs text-[var(--text-muted)]">Check-in Status</p>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {clockedIn ? "Punched In at 07:58 AM" : "Not Checked In"}
                            </p>
                        </div>
                        <Button
                            variant={clockedIn ? "secondary" : "primary"}
                            onClick={() => setClockedIn(!clockedIn)}
                        >
                            {clockedIn ? "Punch Out" : "Punch In Now"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Metrics Grid: Attendance & Working Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card padding="md">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                            <CalendarCheck size={20} />
                        </div>
                        <Badge variant="success">Current Month</Badge>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">
                        {attendanceSummary.daysPresent} / {attendanceSummary.totalWorkingDays}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">Days Present</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">92% Month Turnout</p>
                </Card>

                <Card padding="md">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <span className="text-xs text-indigo-500 font-semibold flex items-center gap-0.5">
                            <TrendingUp size={12} /> {attendanceSummary.onTimeRate}
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">
                        {attendanceSummary.totalHours}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">Logged Hours</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Avg 8.0 hrs/day</p>
                </Card>

                <Card padding="md">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                            <CalendarOff size={20} />
                        </div>
                        <Badge variant="warning">Remaining</Badge>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">24 Days</p>
                    <p className="text-sm text-[var(--text-secondary)]">Total Leave Balance</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Across all leave categories</p>
                </Card>

                <Card padding="md">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                            <DollarSign size={20} />
                        </div>
                        <Badge variant="success">Paid</Badge>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">
                        {salaryPreview.netSalary}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">Last Salary Disbursed</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">October 2026 statement</p>
                </Card>
            </div>

            {/* ── Leave Balances & Status ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Leave Balances */}
                <Card padding="md" className="lg:col-span-1">
                    <Card.Header withBorder>
                        <Card.Title>Leave Category Balances</Card.Title>
                        <Link to="/employee/leaves" className="text-xs text-[var(--primary)] font-semibold hover:underline">
                            Apply
                        </Link>
                    </Card.Header>
                    <Card.Body className="space-y-4 pt-1">
                        {leaveBalances.map((item) => (
                            <div key={item.type} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-[var(--text-primary)] font-semibold">{item.type}</span>
                                    <span className="text-[var(--text-secondary)]">
                                        {item.remaining} of {item.total} left
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${(item.remaining / item.total) * 100}%`,
                                            backgroundColor: item.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="pt-2">
                            <Link to="/employee/leaves">
                                <Button variant="outline" size="sm" className="w-full">
                                    Submit New Leave Request
                                </Button>
                            </Link>
                        </div>
                    </Card.Body>
                </Card>

                {/* Recent Leave Requests */}
                <Card padding="md" className="lg:col-span-2">
                    <Card.Header withBorder>
                        <Card.Title>My Recent Leave Requests</Card.Title>
                        <Badge variant="info">Year 2026</Badge>
                    </Card.Header>
                    <Card.Body>
                        <div className="divide-y divide-[var(--border)]">
                            {recentLeaves.map((l) => (
                                <div key={l.id} className="py-3 flex items-center justify-between text-sm first:pt-0 last:pb-0">
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)]">{l.type} ({l.days} {l.days === 1 ? "day" : "days"})</p>
                                        <p className="text-xs text-[var(--text-muted)]">Dates: {l.dates} • Reason: {l.reason}</p>
                                    </div>
                                    <Badge variant={l.status === "approved" ? "success" : "warning"} dot>
                                        {l.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* ── Salary Slip & Payroll Preview ── */}
            <Card padding="md">
                <Card.Header withBorder>
                    <div>
                        <Card.Title>Salary & Compensation Statement</Card.Title>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Authorized payroll breakdown for period: {salaryPreview.payPeriod}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" icon={Download}>
                        Download Payslip PDF
                    </Button>
                </Card.Header>
                <Card.Body>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-[var(--radius-control)] bg-[var(--surface-secondary)] border border-[var(--border)]">
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase">Basic Salary</p>
                            <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">{salaryPreview.basic}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase">Allowances (HRA + Special)</p>
                            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{salaryPreview.allowances}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase">Deductions (PF + Tax)</p>
                            <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">{salaryPreview.deductions}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase">Net Take-Home</p>
                            <p className="text-lg font-extrabold text-[var(--primary)] mt-0.5">{salaryPreview.netSalary}</p>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
