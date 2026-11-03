import { useState } from "react";
import { Link } from "react-router-dom";
import { UserCheck } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/Common/SearchInput";

export default function AllUsersPage() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const users = [
        { id: "u1", name: "Vikram Malhotra", email: "vikram.m@nexusretail.in", mobile: "9820123456", role: "Store Admin", status: "pending", joined: "Oct 25, 2026" },
        { id: "u2", name: "Ananya Sharma", email: "ananya.s@nexusretail.in", mobile: "9876543210", role: "Store Manager", status: "pending", joined: "Oct 28, 2026" },
        { id: "u3", name: "Pooja Hegde", email: "pooja.h@quickmart.com", mobile: "9845123456", role: "Store Admin", status: "verified", joined: "Oct 18, 2026" },
        { id: "u4", name: "Rajesh Kulkarni", email: "rajesh.k@quickmart.com", mobile: "9845012345", role: "Store Manager", status: "verified", joined: "Oct 19, 2026" },
        { id: "u5", name: "Rohan Patel", email: "rohan.p@quickmart.com", mobile: "9712345678", role: "Employee", status: "verified", joined: "Oct 22, 2026" },
        { id: "u6", name: "Karan Verma", email: "karan.v@apexmart.com", mobile: "9988776655", role: "Store Manager", status: "rejected", joined: "Oct 20, 2026" },
        { id: "u7", name: "Kavita Rao", email: "kavita.r@nexusretail.in", mobile: "9812345670", role: "Employee", status: "verified", joined: "Oct 29, 2026" },
        { id: "u8", name: "Deepak Choudhury", email: "deepak.c@apexmart.com", mobile: "9811223344", role: "Store Admin", status: "verified", joined: "Oct 10, 2026" },
    ];

    const filtered = users.filter((u) => {
        const matchesSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        All Registered Users
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Central user directory across all enterprise roles and retail locations
                    </p>
                </div>
                <Link to="/admin/user-verification">
                    <Button variant="primary" size="sm" icon={UserCheck}>
                        Go to Verification Portal
                    </Button>
                </Link>
            </div>

            <Card padding="sm" className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Role:</span>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="text-xs px-2.5 py-1.5 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)]"
                    >
                        <option value="all">All Roles</option>
                        <option value="Store Admin">Store Admin</option>
                        <option value="Store Manager">Store Manager</option>
                        <option value="Employee">Employee</option>
                    </select>
                </div>
                <div className="w-full sm:w-72">
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Search name, email..."
                    />
                </div>
            </Card>

            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                <th className="px-4 py-3.5">User</th>
                                <th className="px-4 py-3.5">Contact</th>
                                <th className="px-4 py-3.5">Role</th>
                                <th className="px-4 py-3.5">Registered</th>
                                <th className="px-4 py-3.5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filtered.map((u) => (
                                <tr key={u.id} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-[var(--text-primary)]">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)]">
                                        <p>{u.email}</p>
                                        <p className="text-[var(--text-muted)] mt-0.5">{u.mobile}</p>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)]">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-[var(--text-muted)]">
                                        {u.joined}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <Badge variant={u.status === "verified" ? "success" : u.status === "rejected" ? "danger" : "warning"} dot>
                                            {u.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
