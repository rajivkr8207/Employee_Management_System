import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarCheck, CalendarOff, ShieldCheck, Store, Users } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { fetchEmployees } from "../../employees/employees.thunk";
import {
    fetchManagedAttendanceRecords,
} from "../../attendance/attendance.thunk";
import { fetchManagedLeaves, reviewLeave } from "../../leave/leave.thunk";
import { fetchMyStores, fetchStoreManagers } from "../../store/store.thunk";

const getId = (value) => (typeof value === "string" ? value : value?._id);
const dayKey = (date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
};
const formatDate = (value) =>
    value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const formatTime = (value) =>
    value ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—";
const statusVariant = (status) =>
    status === "active" || status === "present" || status === "approved"
        ? "success"
        : status === "rejected" || status === "inactive" || status === "absent"
          ? "danger"
          : "warning";

function StoreAdminOperationsContent({ activeSection = "stores" }) {
    const dispatch = useDispatch();
    const { stores, managers, loading: storesLoading, managerLoading, error: storesError, managerError } = useSelector((state) => state.store);
    const { employees, loading: employeesLoading, error: employeesError } = useSelector((state) => state.employees);
    const { records, recordsLoading, recordsError } = useSelector((state) => state.attendance);
    const { leaves, loading: leavesLoading, saving, error: leavesError } = useSelector((state) => state.leave);
    const [tab, setTab] = useState(activeSection);
    const store = stores[0];
    const storeId = store?._id;
    const organizationId = getId(store?.organizationId);
    const storeManagers = managers[storeId] || [];

    useEffect(() => {
        dispatch(fetchMyStores());
    }, [dispatch]);

    useEffect(() => {
        if (!organizationId || !storeId) return;
        if (tab === "employees") dispatch(fetchEmployees({ organizationId, storeId }));
        if (tab === "managers") dispatch(fetchStoreManagers(storeId));
        if (tab === "attendance") {
            dispatch(fetchEmployees({ organizationId, storeId }));
            dispatch(fetchManagedAttendanceRecords({ organizationId, storeId, date: dayKey(new Date()) }));
        }

        if (tab === "leaves") dispatch(fetchManagedLeaves({ organizationId, storeId }));
    }, [dispatch, organizationId, storeId, tab]);

    const employeeById = useMemo(
        () => new Map(employees.map((employee) => [employee._id, employee])),
        [employees],
    );

    const handleReview = async (leaveId, status) => {
        const result = await dispatch(reviewLeave({ leaveId, organizationId, status }));
        if (reviewLeave.rejected.match(result)) return;
        dispatch(fetchManagedLeaves({ organizationId, storeId }));
    };

    const loading = storesLoading || employeesLoading || managerLoading || recordsLoading || leavesLoading;
    const error = storesError || managerError || employeesError || recordsError || leavesError;

    const tabs = [
        { id: "stores", label: "Assigned Stores", icon: Store },
        { id: "managers", label: "Store Managers", icon: ShieldCheck },
        { id: "employees", label: "Employees", icon: Users },
        { id: "attendance", label: "Attendance Roster", icon: CalendarCheck },
        { id: "leaves", label: "Leave Requests", icon: CalendarOff },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Store Operations Hub</h1>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Live store, team, attendance and leave records</p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--border)] pb-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={[
                            "flex items-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-3.5 py-2 text-xs font-semibold transition-colors",
                            tab === id ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]",
                        ].join(" ")}
                    >
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>
            {error && (
                <div role="alert" className="flex flex-col justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-700 sm:flex-row sm:items-center">
                    <p className="text-sm">{error}</p>
                    <Button size="sm" variant="outline" onClick={() => {
                        dispatch(fetchMyStores({ force: true }));
                        if (organizationId && storeId) {
                            if (tab === "employees" || tab === "attendance") dispatch(fetchEmployees({ organizationId, storeId, force: true }));
                            if (tab === "managers") dispatch(fetchStoreManagers(storeId));
                            if (tab === "attendance") dispatch(fetchManagedAttendanceRecords({ organizationId, storeId, date: dayKey(new Date()) }));
                            if (tab === "leaves") dispatch(fetchManagedLeaves({ organizationId, storeId }));
                        }

                    }}>Retry</Button>
                </div>
            )}

            {tab === "stores" && (
                loading ? <Card className="text-sm text-[var(--text-secondary)]">Loading stores...</Card>
                    : stores.length === 0 ? <Card className="text-sm text-[var(--text-secondary)]">No stores are assigned to your account.</Card>
                        : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {stores.map((item) => (
                                <Card key={item._id} padding="md" className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <h2 className="text-sm font-bold text-[var(--text-primary)]">{item.name}</h2>
                                        <Badge variant={statusVariant(item.status)} dot>{item.status || "unknown"}</Badge>
                                    </div>
                                    <p className="font-mono text-xs text-[var(--text-muted)]">{item.code} · {[item.address?.city, item.address?.state].filter(Boolean).join(", ")}</p>
                                    <p className="border-t border-[var(--border)] pt-2 text-xs text-[var(--text-secondary)]">Team records: {employees.length}</p>
                                </Card>
                            ))}
                        </div>
            )}

            {tab === "managers" && (
                <Card padding="md">
                    {managerLoading ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading managers...</p>
                        : storeManagers.length === 0 ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No managers are assigned to this store.</p>
                            : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {storeManagers.map((manager) => (
                                    <div key={manager._id} className="rounded-xl border border-[var(--border)] p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="font-semibold text-[var(--text-primary)]">{manager.fullName || manager.username}</h3>
                                            <Badge variant={statusVariant(manager.status)} dot>{manager.status || "unknown"}</Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-[var(--text-secondary)]">{manager.email}</p>
                                        <p className="mt-2 text-xs text-[var(--text-muted)]">{manager.designation || "Store Manager"} · {manager.employeeCode || "No employee code"}</p>
                                    </div>
                                ))}
                            </div>}
                </Card>
            )}

            {(tab === "employees" || tab === "attendance") && (
                <Card padding="md">
                    {(employeesLoading || (tab === "attendance" && recordsLoading)) ? (
                        <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading {tab === "employees" ? "employees" : "attendance"}...</p>
                    ) : tab === "employees" && employees.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No employees are assigned to this store.</p>
                    ) : tab === "attendance" && records.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No attendance records for today.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] text-left text-sm">
                                <thead><tr className="border-b border-[var(--border)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                    <th className="px-3 py-3">Employee</th>
                                    <th className="px-3 py-3">{tab === "employees" ? "Designation" : "Date"}</th>
                                    <th className="px-3 py-3">{tab === "employees" ? "Employee code" : "Check-in"}</th>
                                    <th className="px-3 py-3">{tab === "employees" ? "Store" : "Check-out"}</th>
                                    <th className="px-3 py-3">Status</th>
                                </tr></thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {(tab === "employees" ? employees : records).map((record) => {
                                        const employee = tab === "employees" ? record : employeeById.get(getId(record.employeeId));
                                        const status = tab === "employees" ? record.status : record.status;
                                        return (
                                            <tr key={record._id}>
                                                <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{employee?.userId?.fullName || employee?.userId?.username || employee?.employeeCode || "Employee"}</td>
                                                <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">{tab === "employees" ? record.designation : formatDate(record.date)}</td>
                                                <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">{tab === "employees" ? record.employeeCode : formatTime(record.checkIn)}</td>
                                                <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">{tab === "employees" ? record.storeId?.name || store?.name : formatTime(record.checkOut)}</td>
                                                <td className="px-3 py-3"><Badge variant={statusVariant(status)} dot>{status || "unknown"}</Badge></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {tab === "leaves" && (
                <Card padding="md">
                    {leavesLoading ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading leave requests...</p>
                        : leaves.length === 0 ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No leave requests found.</p>
                            : <div className="divide-y divide-[var(--border)]">
                                {leaves.map((leave) => (
                                    <div key={leave._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)]">{leave.employeeId?.userId?.fullName || leave.employeeId?.employeeCode || "Employee"} · {formatDate(leave.from)} – {formatDate(leave.to)}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{leave.reason}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={statusVariant(leave.status)} dot>{leave.status}</Badge>
                                            {leave.status === "pending" && <>
                                                <Button size="xs" disabled={saving} onClick={() => handleReview(leave._id, "approved")}>Approve</Button>
                                                <Button size="xs" variant="outline" disabled={saving} onClick={() => handleReview(leave._id, "rejected")}>Reject</Button>
                                            </>}
                                        </div>
                                    </div>
                                ))}
                            </div>}
                </Card>
            )}
        </div>
    );
}

export default function StoreAdminOperationsPage({ activeSection = "stores" }) {
    return <StoreAdminOperationsContent key={activeSection} activeSection={activeSection} />;
}
