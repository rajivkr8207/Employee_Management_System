import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CalendarCheck, CalendarOff, Clock, Users } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { fetchEmployees } from "../../employees/employees.thunk";
import { fetchManagedAttendanceRecords } from "../../attendance/attendance.thunk";
import { fetchManagedLeaves, reviewLeave } from "../../leave/leave.thunk";
import { fetchMyStores } from "../../store/store.thunk";
import { fetchShiftSchedule } from "../../shift/shift.thunk";

const getId = (value) => (typeof value === "string" ? value : value?._id);
const dayKey = (date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
};
const formatDate = (value) =>
    value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const formatTime = (value) =>
    value ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—";
const formatShift = (shift) => {
    if (!shift) return "No shift assigned";
    return `${shift.name} (${shift.startTime}–${shift.endTime})`;
};
const statusVariant = (status) =>
    status === "active" || status === "present" || status === "approved"
        ? "success"
        : status === "inactive" || status === "absent" || status === "rejected"
          ? "danger"
          : "warning";

function StoreManagerOperationsContent({ activeSection = "employees" }) {
    const dispatch = useDispatch();
    const { stores, loading: storesLoading, error: storesError } = useSelector((state) => state.store);
    const { employees, loading: employeesLoading, error: employeesError } = useSelector((state) => state.employees);
    const { records, recordsLoading, recordsError } = useSelector((state) => state.attendance);
    const { leaves, loading: leavesLoading, saving, error: leavesError } = useSelector((state) => state.leave);
    const { assignments, loading: shiftsLoading, error: shiftsError } = useSelector((state) => state.shiftSchedule);
    const [tab, setTab] = useState(activeSection);
    const store = stores[0];
    const storeId = store?._id;
    const organizationId = getId(store?.organizationId);
    const today = dayKey(new Date());

    useEffect(() => {
        dispatch(fetchMyStores());
    }, [dispatch]);

    useEffect(() => {
        if (!organizationId || !storeId) return;
        if (tab === "employees" || tab === "attendance") {
            dispatch(fetchEmployees({ organizationId, storeId }));
        }

        if (tab === "attendance") {
            dispatch(fetchManagedAttendanceRecords({ organizationId, storeId, date: today }));
        }

        if (tab === "leaves") dispatch(fetchManagedLeaves({ organizationId, storeId }));
        if (tab === "shifts") dispatch(fetchShiftSchedule({ organizationId, storeId, date: today }));
    }, [dispatch, organizationId, storeId, tab, today]);

    const employeeById = useMemo(
        () => new Map(employees.map((employee) => [employee._id, employee])),
        [employees],
    );
    const assignmentByEmployee = useMemo(
        () => new Map(assignments.map((assignment) => [getId(assignment.employeeId), assignment])),
        [assignments],
    );
    const error = storesError || employeesError || recordsError || leavesError || shiftsError;

    const handleReview = async (leaveId, status) => {
        const result = await dispatch(reviewLeave({ leaveId, organizationId, status }));
        if (reviewLeave.rejected.match(result)) return;
        dispatch(fetchManagedLeaves({ organizationId, storeId }));
    };

    const tabs = [
        { id: "employees", label: "Store Employees", icon: Users },
        { id: "attendance", label: "Today's Attendance", icon: CalendarCheck },
        { id: "leaves", label: "Leave Requests", icon: CalendarOff },
        { id: "shifts", label: "Shift Schedule", icon: Clock },
    ];
    const loading = storesLoading || employeesLoading || recordsLoading || leavesLoading || shiftsLoading;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Store Manager Operations</h1>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    {store?.name || "Your assigned store"} · live employee and operations data
                </p>
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
                            if (tab === "attendance") dispatch(fetchManagedAttendanceRecords({ organizationId, storeId, date: today }));
                            if (tab === "leaves") dispatch(fetchManagedLeaves({ organizationId, storeId }));
                            if (tab === "shifts") dispatch(fetchShiftSchedule({ organizationId, storeId, date: today }));
                        }
                    }}>Retry</Button>
                </div>
            )}

            {tab === "shifts" && (
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Today's shift assignments</Card.Title>
                        <Link to="/store-manager/shifts" className="text-xs font-semibold text-[var(--primary)] hover:underline">Manage schedule</Link>
                    </Card.Header>
                    {shiftsLoading ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading shift assignments...</p>
                        : assignments.length === 0 ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No shifts are assigned for today.</p>
                            : <div className="divide-y divide-[var(--border)]">
                                {assignments.map((assignment) => (
                                    <div key={assignment._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)]">{assignment.employeeId?.userId?.fullName || assignment.employeeId?.employeeCode || "Employee"}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{assignment.employeeId?.designation || "—"} · {formatShift(assignment.shiftId)}</p>
                                        </div>
                                        <Badge variant={statusVariant(assignment.employeeId?.status)} dot>{assignment.employeeId?.status || "scheduled"}</Badge>
                                    </div>
                                ))}
                            </div>}
                </Card>
            )}

            {(tab === "employees" || tab === "attendance") && (
                <Card padding="md">
                    {loading ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading {tab === "employees" ? "employees" : "attendance"}...</p>
                        : tab === "employees" && employees.length === 0 ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No employees are assigned to this store.</p>
                            : tab === "attendance" && records.length === 0 ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No attendance records for today.</p>
                                : <div className="overflow-x-auto">
                                    <table className="w-full min-w-[640px] text-left text-sm">
                                        <thead><tr className="border-b border-[var(--border)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                            <th className="px-3 py-3">Employee</th>
                                            <th className="px-3 py-3">{tab === "employees" ? "Designation" : "Check-in"}</th>
                                            <th className="px-3 py-3">{tab === "employees" ? "Employee code" : "Check-out"}</th>
                                            <th className="px-3 py-3">{tab === "employees" ? "Today's shift" : "Date"}</th>
                                            <th className="px-3 py-3">Status</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {(tab === "employees" ? employees : records).map((record) => {
                                                const employee = tab === "employees" ? record : employeeById.get(getId(record.employeeId));
                                                const assignment = employee ? assignmentByEmployee.get(employee._id) : null;
                                                return (
                                                    <tr key={record._id}>
                                                        <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{employee?.userId?.fullName || employee?.userId?.username || employee?.employeeCode || "Employee"}</td>
                                                        <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">{tab === "employees" ? record.designation : formatTime(record.checkIn)}</td>
                                                        <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">{tab === "employees" ? record.employeeCode : formatTime(record.checkOut)}</td>
                                                        <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">{tab === "employees" ? formatShift(assignment?.shiftId) : formatDate(record.date)}</td>
                                                        <td className="px-3 py-3"><Badge variant={statusVariant(tab === "employees" ? record.status : record.status)} dot>{record.status || "unknown"}</Badge></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>}
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

export default function StoreManagerOperationsPage({ activeSection = "employees" }) {
    return <StoreManagerOperationsContent key={activeSection} activeSection={activeSection} />;
}
