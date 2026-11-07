import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarCheck, CalendarOff, DollarSign, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { fetchMyEmployee } from "../../employees/employees.thunk";
import {
    fetchMyAttendanceRecords,
} from "../../attendance/attendance.thunk";
import {
    applyForLeave,
    cancelLeave,
    fetchMyLeaves,
} from "../../leave/leave.thunk";

const getId = (value) => (typeof value === "string" ? value : value?._id);
const toDateInput = (date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
};
const formatDate = (value) =>
    value
        ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(
              new Date(value),
          )
        : "—";
const formatTime = (value) =>
    value ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—";
const statusVariant = (status) =>
    status === "approved" || status === "present"
        ? "success"
        : status === "rejected" || status === "absent"
          ? "danger"
          : "warning";

function EmployeeOperationsContent({ activeSection = "attendance" }) {
    const dispatch = useDispatch();
    const { myEmployee, myEmployeeLoading, myEmployeeError } = useSelector((state) => state.employees);
    const {
        records: attendanceRecords,
        recordsLoading: attendanceLoading,
        recordsError: attendanceError,
    } = useSelector((state) => state.attendance);
    const { leaves, loading: leavesLoading, saving, error: leaveError } = useSelector(
        (state) => state.leave,
    );
    const [tab, setTab] = useState(activeSection);
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [form, setForm] = useState({ from: "", to: "", reason: "" });
    const organizationId = getId(myEmployee?.organizationId);

    useEffect(() => {
        dispatch(fetchMyEmployee());
    }, [dispatch]);

    useEffect(() => {
        if (!organizationId) return;
        if (tab === "attendance") {
            const today = new Date();
            const fromDate = toDateInput(new Date(today.getFullYear(), today.getMonth(), 1));
            const toDate = toDateInput(today);
            dispatch(fetchMyAttendanceRecords({ organizationId, fromDate, toDate }));
        }
        if (tab === "leaves") dispatch(fetchMyLeaves({ organizationId }));
    }, [dispatch, organizationId, tab]);

    const salary = myEmployee?.salary == null
        ? null
        : new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
          }).format(myEmployee.salary);

    const submitLeave = async (event) => {
        event.preventDefault();
        if (!organizationId) return;
        const result = await dispatch(applyForLeave({ organizationId, ...form }));
        if (applyForLeave.fulfilled.match(result)) {
            toast.success("Leave request submitted.");
            setForm({ from: "", to: "", reason: "" });
            setShowLeaveForm(false);
        } else {
            toast.error(result.payload || "Unable to submit leave request.");
        }

    };

    const handleCancelLeave = async (leaveId) => {
        const result = await dispatch(cancelLeave({ leaveId, organizationId }));
        if (cancelLeave.fulfilled.match(result)) toast.success("Pending leave request cancelled.");
        else toast.error(result.payload || "Unable to cancel leave request.");
    };

    if (myEmployeeLoading && !myEmployee) {
        return <p className="py-12 text-center text-sm text-[var(--text-secondary)]">Loading your employee profile...</p>;
    }

    if (myEmployeeError && !myEmployee) {
        return (
            <Card padding="md">
                <p role="alert" className="text-sm text-rose-600">{myEmployeeError}</p>
                <Button className="mt-3" size="sm" onClick={() => dispatch(fetchMyEmployee())}>Retry</Button>
            </Card>
        );
    }

    if (!myEmployee) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">My Workplace Records</h1>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Live attendance and leave records from your organization
                </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--border)] pb-1">
                {[
                    { id: "attendance", label: "My Attendance Log", icon: CalendarCheck },
                    { id: "leaves", label: "My Leave Requests", icon: CalendarOff },
                    { id: "salary", label: "My Salary", icon: DollarSign },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={[
                            "flex items-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-3.5 py-2 text-xs font-semibold transition-colors",
                            tab === id
                                ? "bg-[var(--primary)] text-white"
                                : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
                        ].join(" ")}
                    >
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {tab === "attendance" && (
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Attendance history</Card.Title>
                        <Button size="xs" variant="outline" onClick={() => {
                            const today = new Date();
                            dispatch(fetchMyAttendanceRecords({
                                organizationId,
                                fromDate: toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
                                toDate: toDateInput(today),
                            }));
                        }}>Refresh</Button>
                    </Card.Header>
                    {attendanceError && <p role="alert" className="mb-3 text-sm text-rose-600">{attendanceError}</p>}
                    <Card.Body>
                        {attendanceLoading ? (
                            <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading attendance...</p>
                        ) : attendanceRecords.length === 0 ? (
                            <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No attendance records for this month.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[620px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                            <th className="py-2.5">Date</th><th className="py-2.5">Check-in</th>
                                            <th className="py-2.5">Check-out</th><th className="py-2.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {attendanceRecords.map((record) => (
                                            <tr key={record._id}>
                                                <td className="py-3 font-medium text-[var(--text-primary)]">{formatDate(record.date)}</td>
                                                <td className="py-3 text-xs text-[var(--text-secondary)]">{formatTime(record.checkIn)}</td>
                                                <td className="py-3 text-xs text-[var(--text-secondary)]">{formatTime(record.checkOut)}</td>
                                                <td className="py-3"><Badge variant={statusVariant(record.status)} dot>{record.status || "unknown"}</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}

            {tab === "leaves" && (
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>My leave applications</Card.Title>
                        <Button size="xs" variant="primary" icon={showLeaveForm ? X : Plus} onClick={() => setShowLeaveForm((visible) => !visible)}>
                            {showLeaveForm ? "Close" : "Apply leave"}
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {showLeaveForm && (
                            <form onSubmit={submitLeave} className="mb-5 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 sm:grid-cols-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    From
                                    <input required type="date" value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-sm text-[var(--text-primary)]" />
                                </label>
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    To
                                    <input required min={form.from || undefined} type="date" value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-sm text-[var(--text-primary)]" />
                                </label>
                                <label className="text-xs font-medium text-[var(--text-secondary)] sm:col-span-2">
                                    Reason
                                    <textarea required maxLength={1000} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-sm text-[var(--text-primary)]" rows={3} />
                                </label>
                                {leaveError && <p role="alert" className="text-sm text-rose-600 sm:col-span-2">{leaveError}</p>}
                                <div className="sm:col-span-2">
                                    <Button type="submit" size="sm" disabled={saving}>{saving ? "Submitting..." : "Submit request"}</Button>
                                </div>
                            </form>
                        )}
                        {leaveError && !showLeaveForm && <p role="alert" className="mb-3 text-sm text-rose-600">{leaveError}</p>}
                        {leavesLoading ? (
                            <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading leave requests...</p>
                        ) : leaves.length === 0 ? (
                            <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No leave requests found.</p>
                        ) : (
                            <div className="divide-y divide-[var(--border)]">
                                {leaves.map((leave) => (
                                    <div key={leave._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)]">{formatDate(leave.from)} – {formatDate(leave.to)}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{leave.reason}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={statusVariant(leave.status)} dot>{leave.status}</Badge>
                                            {leave.status === "pending" && (
                                                <button type="button" disabled={saving} onClick={() => handleCancelLeave(leave._id)} className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50">Cancel</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}

            {tab === "salary" && (
                <Card padding="md">
                    <Card.Header withBorder><Card.Title>Compensation</Card.Title></Card.Header>
                    <Card.Body>
                        <p className="font-semibold text-[var(--text-primary)]">Configured salary</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--primary)]">{salary || "Not provided"}</p>
                        <p className="mt-3 text-sm text-[var(--text-secondary)]">
                            Payslip history and downloads are not available because the backend does not currently provide a payroll or payslip API.
                        </p>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
}

export default function EmployeeOperationsPage({ activeSection = "attendance" }) {
    return <EmployeeOperationsContent key={activeSection} activeSection={activeSection} />;
}
