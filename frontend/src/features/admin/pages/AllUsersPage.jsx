import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/Common/SearchInput";
import { fetchAdminUsersThunk } from "../adminSlice";

const roleLabels = {
    admin: "Administrator",
    storeadmin: "Store Admin",
    manager: "Store Manager",
    employ: "Employee",
};

function getUserStatus(user) {
    if (user.isBlocked) return "Blocked";
    if (!user.isActive) return "Inactive";
    if (!user.isVerified) return "Unverified";
    if (!user.isApproved) return "Pending";
    return "Active";
}

function statusVariant(status) {
    if (status === "Active") return "success";
    if (status === "Pending" || status === "Unverified") return "warning";
    if (status === "Blocked") return "danger";
    return "neutral";
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default function AllUsersPage() {
    const dispatch = useDispatch();
    const { users, usersLoading, usersError } = useSelector((state) => state.admin);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    useEffect(() => {
        dispatch(fetchAdminUsersThunk());
    }, [dispatch]);

    const filteredUsers = useMemo(() => users.filter((user) => {
        const role = user.role || "";
        const searchText = `${user.fullName || ""} ${user.email || ""} ${user.mobile || ""}`
            .toLowerCase();
        return (roleFilter === "all" || role === roleFilter) &&
            (!search || searchText.includes(search.toLowerCase()));
    }), [users, roleFilter, search]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        All Registered Users
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        All accounts across administrators, store teams, and employees
                    </p>
                </div>
                <Link to="/admin/user-verification">
                    <Button variant="primary" size="sm" icon={UserCheck}>
                        Go to Verification Portal
                    </Button>
                </Link>
            </div>

            {usersError && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">
                    <span>{usersError}</span>
                    <Button variant="outline" size="sm" onClick={() => dispatch(fetchAdminUsersThunk())}>
                        Retry
                    </Button>
                </div>
            )}

            <Card padding="sm" className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="user-role-filter" className="text-xs font-semibold text-[var(--text-muted)]">Role:</label>
                    <select
                        id="user-role-filter"
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value)}
                        className="text-xs px-2.5 py-1.5 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)]"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Administrator</option>
                        <option value="storeadmin">Store Admin</option>
                        <option value="manager">Store Manager</option>
                        <option value="employ">Employee</option>
                    </select>
                </div>
                <div className="w-full sm:w-72">
                    <SearchInput
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Search name, email, phone..."
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
                            {filteredUsers.map((user) => {
                                const status = getUserStatus(user);
                                const name = user.fullName || user.username || "Unnamed user";
                                return (
                                    <tr key={user._id} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                    {name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-[var(--text-primary)]">{name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)]">
                                            <p>{user.email || "—"}</p>
                                            <p className="text-[var(--text-muted)] mt-0.5">{user.mobile || "—"}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)]">
                                                {roleLabels[user.role] || user.role || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-[var(--text-muted)]">{formatDate(user.createdAt)}</td>
                                        <td className="px-4 py-3.5">
                                            <Badge variant={statusVariant(status)} dot>{status}</Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!usersLoading && !usersError && filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                                        {users.length ? "No users match your filters." : "No users found."}
                                    </td>
                                </tr>
                            )}
                            {usersLoading && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Loading users...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {!usersError && (
                <p className="text-xs text-[var(--text-muted)]">{filteredUsers.length.toLocaleString()} users shown</p>
            )}
        </div>
    );
}
