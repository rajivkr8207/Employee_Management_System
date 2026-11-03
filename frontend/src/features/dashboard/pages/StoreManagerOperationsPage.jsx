import { useState } from "react";
import { Users, CalendarCheck, CalendarOff, Clock } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";

export default function StoreManagerOperationsPage({ activeSection = "employees" }) {
    const [tab, setTab] = useState(activeSection);

    const storeEmployees = [
        { id: "e1", name: "Sunil Verma", role: "Inventory Lead", shift: "Morning (08:00 AM - 04:30 PM)", status: "Active" },
        { id: "e2", name: "Pooja Hegde", role: "Cashier Lead", shift: "Morning (08:00 AM - 04:30 PM)", status: "Active" },
        { id: "e3", name: "Ramesh Pawar", role: "Floor Assistant", shift: "Morning (08:00 AM - 04:30 PM)", status: "On Leave" },
        { id: "e4", name: "Divya Rao", role: "Customer Desk", shift: "Morning (08:00 AM - 04:30 PM)", status: "Active" },
        { id: "e5", name: "Rohan Patel", role: "Sales Associate", shift: "Evening (01:30 PM - 10:00 PM)", status: "Active" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                    Store Manager Operations
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    Branch employee management, shift roster, and attendance check-in
                </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--border)]">
                {[
                    { id: "employees", label: "Store Employees", icon: Users },
                    { id: "attendance", label: "Today's Attendance", icon: CalendarCheck },
                    { id: "leaves", label: "Leave Requests", icon: CalendarOff },
                    { id: "shifts", label: "Shift Schedule", icon: Clock },
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

            <Card padding="md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                <th className="px-4 py-3">Employee Name</th>
                                <th className="px-4 py-3">Designation</th>
                                <th className="px-4 py-3">Shift Timing</th>
                                <th className="px-4 py-3">Current Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {storeEmployees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-[var(--surface-secondary)]/50">
                                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{emp.name}</td>
                                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{emp.role}</td>
                                    <td className="px-4 py-3 text-xs text-[var(--text-primary)]">{emp.shift}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={emp.status === "Active" ? "success" : "warning"} dot>{emp.status}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
