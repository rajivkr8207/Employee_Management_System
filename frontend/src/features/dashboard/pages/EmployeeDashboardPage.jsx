import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
    CalendarCheck,
    CalendarOff,
    Check,
    Clock3,
    Mail,
    MapPin,
    RefreshCw,
    ScanFace,
    UserRound,
} from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import { fetchMyEmployee } from "../../employees/employees.thunk";
import {
    enrollMyFace,
    fetchTodayAttendance,
    recordCheckIn,
    recordCheckOut,
} from "../../attendance/attendance.thunk";
import FaceAttendanceModal from "../../attendance/components/FaceAttendanceModal";

const getOrganizationId = (value) => (typeof value === "string" ? value : value?._id);

const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Location access is not available in this browser."));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
            reject,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 },
        );
    });

const formatShiftTime = (time) => {
    if (!time) return "—";
    const [hours, minutes] = time.split(":").map(Number);
    const hour = hours % 12 || 12;
    return `${hour}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
};

const formatTime = (value) =>
    value
        ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(
              new Date(value),
          )
        : "Not recorded";

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
    const {
        today,
        loading: attendanceLoading,
        actionLoading,
        enrollmentLoading,
        error: attendanceError,
    } =
        useSelector((state) => state.attendance);
    const { myEmployee, myEmployeeLoading, myEmployeeError } = useSelector(
        (state) => state.employees
    );
    const [locationError, setLocationError] = useState("");
    const [modalAction, setModalAction] = useState("");

    useEffect(() => {
        dispatch(fetchMyEmployee());
    }, [dispatch]);

    const organizationId = getOrganizationId(myEmployee?.organizationId);
    const refreshToday = useCallback(async () => {
        if (!organizationId) return;
        try {
            const location = await getCurrentLocation();
            setLocationError("");
            dispatch(fetchTodayAttendance({ organizationId, location }));
        } catch (error) {
            setLocationError(
                error.code === 1
                    ? "Allow location access to check whether you are near your store."
                    : error.message || "Unable to get your current location.",
            );
            dispatch(fetchTodayAttendance({ organizationId }));
        }
    }, [dispatch, organizationId]);

    useEffect(() => {
        if (!organizationId) return undefined;
        const initialRequest = window.setTimeout(refreshToday, 0);
        const timer = window.setInterval(refreshToday, 30000);
        return () => {
            window.clearTimeout(initialRequest);
            window.clearInterval(timer);
        };
    }, [organizationId, refreshToday]);

    const verifyAndRecordAttendance = useCallback(
        async (image) => {
            try {
                if (modalAction === "enroll") {
                    await dispatch(enrollMyFace(image)).unwrap();
                    try {
                        const location = await getCurrentLocation();
                        dispatch(fetchTodayAttendance({ organizationId, location }));
                    } catch {
                        dispatch(fetchTodayAttendance({ organizationId }));
                    }
                    return true;
                }
                const location = await getCurrentLocation();
                setLocationError("");
                const action = modalAction === "check-in" ? recordCheckIn : recordCheckOut;
                await dispatch(action({ organizationId, location, image })).unwrap();
                dispatch(fetchTodayAttendance({ organizationId, location }));
                return true;
            } catch (error) {
                if (typeof error !== "string" && !error.response) {
                    setLocationError(error.message || "Unable to verify your location.");
                }
                return false;
            }
        },
        [dispatch, modalAction, organizationId],
    );
    const closeFaceModal = useCallback(() => setModalAction(""), []);

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
            <Card padding="md">
                <Card.Header withBorder>
                    <div>
                        <Card.Title>Today's shift</Card.Title>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {today?.store?.name || storeName}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={refreshToday}
                        disabled={attendanceLoading}
                        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                    >
                        <RefreshCw size={15} className={attendanceLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </Card.Header>
                <Card.Body>
                    {attendanceError && (
                        <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                            {attendanceError}
                        </p>
                    )}
                    {locationError && (
                        <p role="alert" className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                            {locationError}
                        </p>
                    )}
                    {!today?.shift ? (
                        <div className="rounded-xl bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                            {attendanceLoading ? "Loading today's shift..." : "No shift is assigned for today."}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Clock3 size={18} className="text-[var(--primary)]" />
                                    <h2 className="font-semibold text-[var(--text-primary)]">
                                        {today.shift.name}
                                    </h2>
                                </div>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                    {formatShiftTime(today.shift.startTime)} – {formatShiftTime(today.shift.endTime)}
                                </p>
                                <p className="mt-2 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                    <MapPin size={14} />
                                    {today.distanceMeters === null || today.distanceMeters === undefined
                                        ? "Store distance unavailable"
                                        : `${today.distanceMeters} m from store · ${today.radius} m allowed`}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="min-w-32 rounded-lg bg-[var(--surface-secondary)] px-3 py-2">
                                    <p className="text-xs text-[var(--text-muted)]">Check-in</p>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                        {formatTime(today.attendance?.checkIn)}
                                    </p>
                                </div>
                                <div className="min-w-32 rounded-lg bg-[var(--surface-secondary)] px-3 py-2">
                                    <p className="text-xs text-[var(--text-muted)]">Check-out</p>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                        {formatTime(today.attendance?.checkOut)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {today?.reason && (
                        <p className="mt-3 text-sm text-[var(--text-secondary)]">{today.reason}</p>
                    )}
                    {today && !today.faceEnrolled && (
                        <button
                            type="button"
                            onClick={() => setModalAction("enroll")}
                            disabled={enrollmentLoading}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60 sm:w-auto"
                        >
                            <ScanFace size={18} />
                            {enrollmentLoading ? "Enrolling face..." : "Enroll your face"}
                        </button>
                    )}
                    {today?.faceEnrolled && (today?.canCheckIn || today?.canCheckOut) && (
                        <button
                            type="button"
                            onClick={() => setModalAction(today.canCheckIn ? "check-in" : "check-out")}
                            disabled={actionLoading}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-3 font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60 sm:w-auto"
                        >
                            {today.canCheckIn ? <MapPin size={18} /> : <Check size={18} />}
                            {today.canCheckIn ? "Check in" : "Check out"}
                        </button>
                    )}
                </Card.Body>
            </Card>

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
            {modalAction && (
                <FaceAttendanceModal
                    action={modalAction}
                    loading={modalAction === "enroll" ? enrollmentLoading : actionLoading}
                    error={attendanceError}
                    onClose={closeFaceModal}
                    onVerified={verifyAndRecordAttendance}
                />
            )}
        </div>
    );
}
