import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/Common/SearchInput";
import { fetchAdminEmployeesThunk } from "../admin.thunk";

function roleLabel(role) {
    if (role === "manager") return "Store Manager";
    if (role === "employ") return "Employee";
    return role || "—";
}

export default function AllEmployeesPage() {
    const dispatch = useDispatch();
    const { employees, employeesLoading, employeesError } = useSelector((state) => state.admin);
    const [search, setSearch] = useState("");

    useEffect(() => {
        dispatch(fetchAdminEmployeesThunk());
    }, [dispatch]);

    const filteredEmployees = useMemo(() => employees.filter((employee) => {
        const name = employee.userId?.fullName || "";
        const email = employee.userId?.email || "";
        const designation = employee.designation || "";
        const store = employee.storeId?.name || "";
        const searchText = `${name} ${email} ${designation} ${store} ${employee.employeeCode || ""}`
            .toLowerCase();
        return !search || searchText.includes(search.toLowerCase());
    }), [employees, search]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">All Employees</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    Staff and store managers across all organizations and locations
                </p>
            </div>

            {employeesError && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">
                    <span>{employeesError}</span>
                    <Button variant="outline" size="sm" onClick={() => dispatch(fetchAdminEmployeesThunk())}>Retry</Button>
                </div>
            )}

            <Card padding="sm">
                <SearchInput
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onClear={() => setSearch("")}
                    placeholder="Search employee, role, store..."
                />
            </Card>

            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                <th className="px-4 py-3.5">Employee</th>
                                <th className="px-4 py-3.5">Designation</th>
                                <th className="px-4 py-3.5">Organization</th>
                                <th className="px-4 py-3.5">Assigned Store</th>
                                <th className="px-4 py-3.5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filteredEmployees.map((employee) => {
                                const status = employee.status || "unknown";
                                const active = status === "active";
                                return (
                                    <tr key={employee._id} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <p className="font-semibold text-[var(--text-primary)]">{employee.userId?.fullName || "Unknown user"}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{employee.userId?.email || "—"}</p>
                                            <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">{employee.employeeCode || "—"}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)]">
                                            <p>{employee.designation || "—"}</p>
                                            <p className="text-[var(--text-muted)] mt-0.5">{roleLabel(employee.userId?.role)}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)]">{employee.organizationId?.name || "—"}</td>
                                        <td className="px-4 py-3.5 text-xs text-[var(--text-primary)]">{employee.storeId?.name || "—"}</td>
                                        <td className="px-4 py-3.5">
                                            <Badge variant={active ? "success" : "neutral"} dot>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!employeesLoading && !employeesError && filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                                        {employees.length ? "No employees match your search." : "No employees found."}
                                    </td>
                                </tr>
                            )}
                            {employeesLoading && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Loading employees...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {!employeesError && (
                <p className="text-xs text-[var(--text-muted)]">{filteredEmployees.length.toLocaleString()} employees shown</p>
            )}
        </div>
    );
}
