import { useState } from "react";
import { CalendarCheck, CalendarOff, DollarSign, Download, Plus } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

export default function EmployeeOperationsPage({ activeSection = "attendance" }) {
    const [tab, setTab] = useState(activeSection);

    const attendanceRecords = [
        { date: "Nov 02, 2026", in: "07:58 AM", out: "04:30 PM", hours: "8.5 hrs", status: "Present" },
        { date: "Nov 01, 2026", in: "08:02 AM", out: "04:35 PM", hours: "8.5 hrs", status: "Present" },
        { date: "Oct 31, 2026", in: "07:55 AM", out: "04:28 PM", hours: "8.5 hrs", status: "Present" },
        { date: "Oct 30, 2026", in: "08:14 AM", out: "04:45 PM", hours: "8.5 hrs", status: "Late In" },
    ];

    const leaveHistory = [
        { id: "1", type: "Sick Leave", dates: "Oct 14, 2026", days: 1, reason: "Viral fever", status: "Approved" },
        { id: "2", type: "Casual Leave", dates: "Nov 06 - Nov 07", days: 2, reason: "Personal family commitment", status: "Pending" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                    My Workplace Records
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    View your monthly attendance log, leave submissions, and compensation statements
                </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--border)]">
                {[
                    { id: "attendance", label: "My Attendance Log", icon: CalendarCheck },
                    { id: "leaves", label: "My Leave Requests", icon: CalendarOff },
                    { id: "salary", label: "My Salary & Slips", icon: DollarSign },
                ].map((t) => {
                    const Icon = t.icon;
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={[
                                "flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-control)] text-xs font-semibold whitespace-nowrap transition-colors",
                                isActive
                                    ? "bg-[var(--primary)] text-white"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
                            ].join(" ")}
                        >
                            <Icon size={14} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {tab === "attendance" && (
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Punch & Check-in History</Card.Title>
                        <Badge variant="success">Current Month</Badge>
                    </Card.Header>
                    <Card.Body>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                    <th className="py-2.5">Date</th>
                                    <th className="py-2.5">Punch In</th>
                                    <th className="py-2.5">Punch Out</th>
                                    <th className="py-2.5">Duration</th>
                                    <th className="py-2.5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {attendanceRecords.map((r, idx) => (
                                    <tr key={idx}>
                                        <td className="py-3 font-medium text-[var(--text-primary)]">{r.date}</td>
                                        <td className="py-3 text-xs text-[var(--text-secondary)]">{r.in}</td>
                                        <td className="py-3 text-xs text-[var(--text-secondary)]">{r.out}</td>
                                        <td className="py-3 text-xs text-[var(--text-primary)] font-semibold">{r.hours}</td>
                                        <td className="py-3">
                                            <Badge variant={r.status === "Present" ? "success" : "warning"} dot>{r.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card.Body>
                </Card>
            )}

            {tab === "leaves" && (
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>My Leave Applications</Card.Title>
                        <Button size="xs" variant="primary" icon={Plus}>Apply Leave</Button>
                    </Card.Header>
                    <Card.Body>
                        <div className="divide-y divide-[var(--border)]">
                            {leaveHistory.map((l) => (
                                <div key={l.id} className="py-3 flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)]">{l.type} ({l.days} days)</p>
                                        <p className="text-xs text-[var(--text-muted)]">Dates: {l.dates} • Reason: {l.reason}</p>
                                    </div>
                                    <Badge variant={l.status === "Approved" ? "success" : "warning"} dot>{l.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            )}

            {tab === "salary" && (
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Monthly Payslips</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between">
                            <div>
                                <p className="font-bold text-[var(--text-primary)]">October 2026 Payslip</p>
                                <p className="text-xs text-[var(--text-muted)]">Net Amount Disbursed: ₹ 32,450</p>
                            </div>
                            <Button size="xs" variant="outline" icon={Download}>Download Slip</Button>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
}
