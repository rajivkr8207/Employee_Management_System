import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { CalendarCheck, CalendarOff, Mail, MapPin, UserRound } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import { fetchMyEmployee } from "../../employees/employeeSlice";

const formatDate = (value) => {
    if (!value) return "Not provided";
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
};

const formatSalary = (value) => {
    if (value === undefined || value === null) return "Not provided";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
};

export default function EmployeeDashboardPage() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { myEmployee, myEmployeeLoading, myEmployeeError } = useSelector(
        (state) => state.employees
    );

    useEffect(() => {
        dispatch(fetchMyEmployee());
    }, [dispatch]);

    if (myEmployeeLoading && !myEmployee) {
        return (
            <div className="min-h-64 flex items-center justify-center text-[var(--text-secondary)]">
                Loading your employee profile...
            </div>
        );
    }

    if (myEmployeeError && !myEmployee) {
        return (
            <div className="max-w-3xl mx-auto p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)]">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Employee profile unavailable</h1>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{myEmployeeError}</p>
                <button
                    type="button"
                    onClick={() => dispatch(fetchMyEmployee())}
                    className="mt-4 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!myEmployee) return null;

    const employeeName = myEmployee.userId?.fullName || user?.fullName || "Employee";
    const employeeEmail = myEmployee.userId?.email || user?.email || "Not provided";
    const storeName = myEmployee.storeId?.name || "Not assigned";
    const organizationName = myEmployee.organizationId?.name || "Not provided";
    const initials = employeeName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            <section className="p-5 sm:p-7 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-2xl shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{employeeName}</h1>
                            <Badge variant={myEmployee.status === "active" ? "success" : "warning"} dot>
                                {myEmployee.status}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {myEmployee.designation} · {myEmployee.employeeCode}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <UserRound className="text-[var(--primary)]" size={20} />
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">Employee ID</p>
                            <p className="font-semibold text-[var(--text-primary)]">{myEmployee.employeeCode}</p>
                        </div>
                    </div>
                </Card>
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <MapPin className="text-[var(--primary)]" size={20} />
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">Store</p>
                            <p className="font-semibold text-[var(--text-primary)]">{storeName}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{organizationName}</p>
                        </div>
                    </div>
                </Card>
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <Mail className="text-[var(--primary)]" size={20} />
                        <div className="min-w-0">
                            <p className="text-xs text-[var(--text-muted)]">Work account</p>
                            <p className="font-semibold text-[var(--text-primary)] break-all">{employeeEmail}</p>
                        </div>
                    </div>
                </Card>
                <Card padding="md">
                    <p className="text-xs text-[var(--text-muted)]">Joining date</p>
                    <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {formatDate(myEmployee.joiningDate)}
                    </p>
                </Card>
                <Card padding="md">
                    <p className="text-xs text-[var(--text-muted)]">Monthly salary</p>
                    <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {formatSalary(myEmployee.salary)}
                    </p>
                </Card>
                <Card padding="md">
                    <p className="text-xs text-[var(--text-muted)]">Position</p>
                    <p className="mt-1 font-semibold text-[var(--text-primary)]">
                        {myEmployee.designation}
                    </p>
                </Card>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
                <Link
                    to="/employee/attendance"
                    className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <CalendarCheck className="text-[var(--primary)]" size={22} />
                        <div>
                            <h2 className="font-semibold text-[var(--text-primary)]">My attendance</h2>
                            <p className="text-sm text-[var(--text-secondary)]">View your attendance records</p>
                        </div>
                    </div>
                </Link>
                <Link
                    to="/employee/leaves"
                    className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <CalendarOff className="text-[var(--primary)]" size={22} />
                        <div>
                            <h2 className="font-semibold text-[var(--text-primary)]">My leave requests</h2>
                            <p className="text-sm text-[var(--text-secondary)]">Review or request time off</p>
                        </div>
                    </div>
                </Link>
            </section>
        </div>
    );
}
