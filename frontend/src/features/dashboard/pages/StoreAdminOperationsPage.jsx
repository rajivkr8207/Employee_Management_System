import { useState } from "react";
import { Store, Users, ShieldCheck, CalendarCheck, CalendarOff } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";

export default function StoreAdminOperationsPage({ activeSection = "stores" }) {
    const [tab, setTab] = useState(activeSection);

    const stores = [
        { id: "s1", name: "Nexus Superstore - Bandra", code: "STR-MUM-01", city: "Mumbai", staff: 34, manager: "Sunil Verma", status: "Active" },
        { id: "s2", name: "QuickMart Express - Indiranagar", code: "STR-BLR-02", city: "Bengaluru", staff: 28, manager: "Rajesh Kulkarni", status: "Active" },
        { id: "s3", name: "Apex Hypermarket - CyberCity", code: "STR-GGN-03", city: "Gurugram", staff: 45, manager: "Siddharth Nair", status: "Active" },
    ];

    const managers = [
        { id: "m1", name: "Sunil Verma", email: "sunil.v@nexusretail.in", store: "Bandra", phone: "9820123456", status: "Active" },
        { id: "m2", name: "Rajesh Kulkarni", email: "rajesh.k@quickmart.com", store: "Indiranagar", phone: "9845012345", status: "Active" },
        { id: "m3", name: "Siddharth Nair", email: "siddharth.n@hypermarket.in", store: "CyberCity", phone: "9711002233", status: "Active" },
    ];

    const employees = [
        { id: "e1", name: "Amit Sharma", role: "Cashier Lead", store: "Bandra", shift: "Morning", status: "Present" },
        { id: "e2", name: "Priya Nair", role: "Floor Supervisor", store: "Indiranagar", shift: "Morning", status: "Present" },
        { id: "e3", name: "Rohan Patel", role: "Sales Associate", store: "Bandra", shift: "Morning", status: "Present" },
        { id: "e4", name: "Sneha Patil", role: "Billing Associate", store: "Indiranagar", shift: "Morning", status: "Absent" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        Store Operations Hub
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Manage stores, branch managers, employees, and operations
                    </p>
                </div>
            </div>

            {/* Quick switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--border)]">
                {[
                    { id: "stores", label: "Assigned Stores", icon: Store },
                    { id: "managers", label: "Store Managers", icon: ShieldCheck },
                    { id: "employees", label: "Employees", icon: Users },
                    { id: "attendance", label: "Attendance Roster", icon: CalendarCheck },
                    { id: "leaves", label: "Leave Requests", icon: CalendarOff },
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

            {tab === "stores" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stores.map((s) => (
                        <Card key={s.id} padding="md" className="space-y-2">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-[var(--text-primary)] text-sm">{s.name}</h3>
                                <Badge variant="success" dot>{s.status}</Badge>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] font-mono">{s.code} • {s.city}</p>
                            <div className="pt-2 border-t border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
                                <p>Manager: <strong className="text-[var(--text-primary)]">{s.manager}</strong></p>
                                <p>Total Staff: <strong className="text-[var(--text-primary)]">{s.staff} Employees</strong></p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {tab === "managers" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {managers.map((m) => (
                        <Card key={m.id} padding="md" className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                                    {m.name.split(" ").map((w) => w[0]).join("")}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{m.name}</h4>
                                    <p className="text-xs text-[var(--text-muted)]">{m.email}</p>
                                </div>
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)] space-y-1">
                                <p>Branch: <strong className="text-[var(--text-primary)]">{m.store} Store</strong></p>
                                <p>Phone: {m.phone}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {(tab === "employees" || tab === "attendance" || tab === "leaves") && (
                <Card padding="md">
                    <div className="rounded-[var(--radius-control)] border border-[var(--border)] overflow-hidden">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Store</th>
                                    <th className="px-4 py-3">Shift</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {employees.map((e) => (
                                    <tr key={e.id} className="hover:bg-[var(--surface-secondary)]/50">
                                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{e.name}</td>
                                        <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{e.role}</td>
                                        <td className="px-4 py-3 text-xs text-[var(--text-primary)]">{e.store}</td>
                                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{e.shift}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={e.status === "Present" ? "success" : "danger"} dot>{e.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
