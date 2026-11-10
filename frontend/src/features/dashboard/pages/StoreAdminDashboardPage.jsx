import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Building2, Clock3, Mail, MapPin, Store, Users, UserRound, Megaphone } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { fetchEmployees } from "../../employees/employees.thunk";
import { fetchMyStores } from "../../store/store.thunk";
import BroadcastNotificationModal from "../../notifications/BroadcastNotificationModal";

const formatDate = (value) => {
    if (!value) return "Not provided";
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
};

const formatSalary = (value) => {
    if (value === undefined || value === null) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
};

export default function StoreAdminDashboardPage() {
    const dispatch = useDispatch();
    const { stores, loading: storesLoading, error: storesError } = useSelector((state) => state.store);
    const {
        employees,
        loading: employeesLoading,
        error: employeesError,
    } = useSelector((state) => state.employees);
    const [selectedStore, setSelectedStore] = useState("all");
    const [broadcastOpen, setBroadcastOpen] = useState(false);

    const organizationId = stores[0]?.organizationId?._id || stores[0]?.organizationId;

    useEffect(() => {
        dispatch(fetchMyStores());
    }, [dispatch]);

    useEffect(() => {
        if (organizationId) {
            dispatch(fetchEmployees({ organizationId }));
        }
    }, [dispatch, organizationId]);

    const filteredEmployees = useMemo(
        () =>
            selectedStore === "all"
                ? employees
                : employees.filter((employee) => {
                    const storeId = employee.storeId?._id || employee.storeId;
                    return storeId === selectedStore;
                }),
        [employees, selectedStore]
    );

    const managerCount = employees.filter(
        (employee) => ["manager", "storemanager"].includes(
            String(employee.userId?.role || "").toLowerCase().replace(/[-_]/g, "")
        )
    ).length;
    const activeCount = employees.filter((employee) => employee.status === "active").length;
    const loading = storesLoading || employeesLoading;
    const error = storesError || employeesError;

    const retryLoading = () => {
        dispatch(fetchMyStores({ force: true }));
        if (organizationId) {
            dispatch(fetchEmployees({ organizationId, force: true }));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        Store Admin Dashboard
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Your stores and employee records
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={selectedStore}
                        onChange={(event) => setSelectedStore(event.target.value)}
                        className="text-xs px-2.5 py-2 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    >
                        <option value="all">All Stores ({stores.length})</option>
                        {stores.map((store) => (
                            <option key={store._id} value={store._id}>{store.name}</option>
                        ))}
                    </select>
                    <Link
                        to="/store-admin/stores"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                    >
                        <Store size={14} /> My Stores
                    </Link>
                    <Link
                        to="/store-admin/employees"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-lg text-xs font-semibold transition-colors shadow-sm"
                    >
                        <Users size={14} /> Manage Employees
                    </Link>
                    <button
                        type="button"
                        onClick={() => setBroadcastOpen(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                    >
                        <Megaphone size={14} /> Broadcast Announcement
                    </button>
                    <Link
                        to="/store-admin/shifts"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-lg text-xs font-semibold transition-colors shadow-sm"
                    >
                        <Clock3 size={14} /> Schedule Shifts
                    </Link>
                </div>
            </div>

            {error && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-700">
                    <p className="text-sm">{error}</p>
                    <Button size="sm" variant="outline" onClick={retryLoading}>Retry</Button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <Store className="text-indigo-500" size={22} />
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{stores.length}</p>
                            <p className="text-sm text-[var(--text-secondary)]">Assigned stores</p>
                        </div>
                    </div>
                </Card>
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <Users className="text-blue-500" size={22} />
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{employees.length}</p>
                            <p className="text-sm text-[var(--text-secondary)]">Total employees</p>
                        </div>
                    </div>
                </Card>
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <UserRound className="text-emerald-500" size={22} />
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{managerCount}</p>
                            <p className="text-sm text-[var(--text-secondary)]">Store managers</p>
                            <p className="text-xs text-[var(--text-muted)]">{activeCount} active staff</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card padding="md">
                <Card.Header withBorder>
                    <div>
                        <Card.Title>Employee details</Card.Title>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Employee accounts and assignments across your stores
                        </p>
                    </div>
                    <Badge variant="info">{filteredEmployees.length} employees</Badge>
                </Card.Header>
                <Card.Body>
                    {loading && employees.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
                            Loading store and employee details...
                        </p>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="py-8 text-center">
                            <Users className="mx-auto mb-2 text-[var(--text-muted)]" size={28} />
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                                {selectedStore === "all" ? "No employees have been added yet" : "No employees in this store"}
                            </p>
                            <Link
                                to="/store-admin/employees"
                                className="inline-block mt-3 text-sm font-semibold text-[var(--primary)] hover:underline"
                            >
                                Add an employee
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                        <th className="px-3 py-3">Employee</th>
                                        <th className="px-3 py-3">Contact</th>
                                        <th className="px-3 py-3">Date of birth</th>
                                        <th className="px-3 py-3">Designation</th>
                                        <th className="px-3 py-3">Store</th>
                                        <th className="px-3 py-3">Salary</th>
                                        <th className="px-3 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {filteredEmployees.map((employee) => {
                                        const employeeName = employee.userId?.fullName || "Unnamed employee";
                                        const storeName = employee.storeId?.name || "Unassigned";
                                        return (
                                            <tr key={employee._id} className="hover:bg-[var(--surface-secondary)]/50">
                                                <td className="px-3 py-3">
                                                    <p className="font-semibold text-[var(--text-primary)]">{employeeName}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {employee.employeeCode || "No employee code"}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="inline-flex items-center gap-1.5 text-[var(--text-primary)]">
                                                        <Mail size={13} /> {employee.userId?.email || "No email"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                        {employee.userId?.mobile || "No phone"}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-[var(--text-secondary)]">
                                                    {formatDate(employee.Dob)}
                                                </td>
                                                <td className="px-3 py-3 text-[var(--text-secondary)]">
                                                    {employee.designation || "—"}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="inline-flex items-center gap-1.5 text-[var(--text-primary)]">
                                                        <MapPin size={13} /> {storeName}
                                                    </p>
                                                    {employee.organizationId?.name && (
                                                        <p className="mt-1 text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
                                                            <Building2 size={12} /> {employee.organizationId.name}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-[var(--text-secondary)]">
                                                    {formatSalary(employee.salary)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge variant={employee.status === "active" ? "success" : "warning"} dot>
                                                        {employee.status || "unknown"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {stores.length > 0 && (
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stores.map((store) => (
                        <Card key={store._id} padding="md">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold text-[var(--text-primary)]">{store.name}</h2>
                                    <p className="mt-1 text-xs text-[var(--text-muted)]">{store.code}</p>
                                </div>
                                <Badge variant={store.status === "active" ? "success" : "warning"} dot>
                                    {store.status}
                                </Badge>
                            </div>
                            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                <MapPin size={13} /> {store.address?.city || store.location?.address || "Location not set"}
                            </p>
                            <p className="mt-2 text-xs text-[var(--text-secondary)]">
                                {employees.filter((employee) => (employee.storeId?._id || employee.storeId) === store._id).length} staff assigned
                            </p>
                        </Card>
                    ))}
                </section>
            )}

            <BroadcastNotificationModal
                isOpen={broadcastOpen}
                onClose={() => setBroadcastOpen(false)}
            />
        </div>
    );
}
