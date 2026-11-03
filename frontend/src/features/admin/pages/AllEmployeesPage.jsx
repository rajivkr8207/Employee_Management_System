import { useState } from "react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/Common/SearchInput";

export default function AllEmployeesPage() {
    const [search, setSearch] = useState("");

    const employees = [
        { id: "e1", name: "Sunil Verma", role: "Inventory Lead", store: "Nexus Superstore - Bandra", status: "Active", shift: "Morning" },
        { id: "e2", name: "Pooja Hegde", role: "Cashier", store: "Nexus Superstore - Bandra", status: "Active", shift: "Morning" },
        { id: "e3", name: "Ramesh Pawar", role: "Floor Assistant", store: "Nexus Superstore - Bandra", status: "On Leave", shift: "Morning" },
        { id: "e4", name: "Priya Nair", role: "Floor Supervisor", store: "QuickMart - Indiranagar", status: "Active", shift: "Morning" },
        { id: "e5", name: "Rohan Patel", role: "Sales Associate", store: "Nexus Superstore - Bandra", status: "Active", shift: "General" },
        { id: "e6", name: "Ketan Shinde", role: "Store Stacker", store: "QuickMart - Indiranagar", status: "Active", shift: "Night" },
    ];

    const filtered = employees.filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                    All Employees Roster
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    Consolidated staff directory across all stores and shift rosters
                </p>
            </div>

            <Card padding="sm">
                <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search employee name, role..." />
            </Card>

            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                            <th className="px-4 py-3.5">Employee</th>
                            <th className="px-4 py-3.5">Designation</th>
                            <th className="px-4 py-3.5">Assigned Store</th>
                            <th className="px-4 py-3.5">Shift</th>
                            <th className="px-4 py-3.5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {filtered.map((emp) => (
                            <tr key={emp.id} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                                <td className="px-4 py-3.5 font-semibold text-[var(--text-primary)]">{emp.name}</td>
                                <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)]">{emp.role}</td>
                                <td className="px-4 py-3.5 text-xs text-[var(--text-primary)]">{emp.store}</td>
                                <td className="px-4 py-3.5 text-xs text-[var(--text-muted)]">{emp.shift}</td>
                                <td className="px-4 py-3.5">
                                    <Badge variant={emp.status === "Active" ? "success" : "warning"} dot>{emp.status}</Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
