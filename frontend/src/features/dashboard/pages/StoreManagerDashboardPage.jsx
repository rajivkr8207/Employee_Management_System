import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Clock3, MapPin, Users } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { fetchEmployees } from "../../employees/employees.thunk";
import { fetchMyStores } from "../../store/store.thunk";

const employeeName = (employee) =>
    employee.userId?.fullName || employee.userId?.username || "Unnamed employee";

const storeAddress = (store) =>
    [store.address?.street, store.address?.city, store.address?.state, store.address?.pincode]
        .filter(Boolean)
        .join(", ") || "Address not provided";

export default function StoreManagerDashboardPage() {
    const dispatch = useDispatch();
    const { stores, loading: storesLoading, error: storesError } = useSelector((state) => state.store);
    const {
        employees,
        loading: employeesLoading,
        error: employeesError,
    } = useSelector((state) => state.employees);
    const store = stores[0];
    const organizationId = store?.organizationId?._id || store?.organizationId;

    useEffect(() => {
        dispatch(fetchMyStores());
    }, [dispatch]);

    useEffect(() => {
        if (organizationId && store?._id) {
            dispatch(fetchEmployees({ organizationId, storeId: store._id }));
        }
    }, [dispatch, organizationId, store?._id]);

    const storeEmployees = useMemo(
        () =>
            employees.filter((employee) => {
                const employeeStoreId = employee.storeId?._id || employee.storeId;
                return employeeStoreId === store?._id;
            }),
        [employees, store?._id],
    );
    const activeCount = storeEmployees.filter((employee) => employee.status === "active").length;
    const error = storesError || employeesError;

    const retry = () => {
        dispatch(fetchMyStores({ force: true }));
        if (organizationId && store?._id) {
            dispatch(fetchEmployees({ organizationId, storeId: store._id, force: true }));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <section className="rounded-[var(--radius-card)] border border-indigo-800/40 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-5 text-white shadow-[var(--shadow-md)] sm:p-6">
                {store ? (
                    <>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Assigned store</span>
                                    <Badge variant={store.status === "active" ? "success" : "warning"} dot>{store.status}</Badge>
                                </div>
                                <h1 className="text-xl font-bold sm:text-2xl">{store.name}</h1>
                                <p className="mt-2 flex items-center gap-1.5 text-sm text-indigo-200">
                                    <MapPin size={14} /> {storeAddress(store)}
                                </p>
                                <p className="mt-1 text-xs text-indigo-200/80">Store code: {store.code}</p>
                            </div>
                            <Link to="/store-manager/shifts" className="inline-flex items-center gap-2 self-start rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20">
                                <Clock3 size={16} /> Schedule shifts
                            </Link>
                        </div>
                    </>
                ) : (
                    <div>
                        <h1 className="text-xl font-bold sm:text-2xl">Store manager dashboard</h1>
                        <p className="mt-2 text-sm text-indigo-200">
                            {storesLoading ? "Loading your assigned store..." : "No active store is assigned to your account."}
                        </p>
                    </div>
                )}
            </section>

            {error && (
                <div className="flex flex-col gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-700 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm">{error}</p>
                    <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <Users className="text-indigo-500" size={22} />
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{storeEmployees.length}</p>
                            <p className="text-sm text-[var(--text-secondary)]">Employees in your store</p>
                        </div>
                    </div>
                </Card>
                <Card padding="md">
                    <div className="flex items-center gap-3">
                        <Users className="text-emerald-500" size={22} />
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{activeCount}</p>
                            <p className="text-sm text-[var(--text-secondary)]">Active employees</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card padding="md">
                <Card.Header withBorder>
                    <div>
                        <Card.Title>Employee details</Card.Title>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">Employee records assigned to {store?.name || "your store"}</p>
                    </div>
                    <Link to="/store-manager/employees" className="text-sm font-semibold text-[var(--primary)] hover:underline">Manage employees</Link>
                </Card.Header>
                <Card.Body>
                    {employeesLoading && storeEmployees.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading employee details...</p>
                    ) : storeEmployees.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-sm text-[var(--text-secondary)]">No employees are assigned to this store yet.</p>
                            <Link to="/store-manager/employees" className="mt-3 inline-block text-sm font-semibold text-[var(--primary)] hover:underline">Add an employee</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                        <th className="px-3 py-3">Employee</th>
                                        <th className="px-3 py-3">Contact</th>
                                        <th className="px-3 py-3">Designation</th>
                                        <th className="px-3 py-3">Employee code</th>
                                        <th className="px-3 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {storeEmployees.map((employee) => (
                                        <tr key={employee._id} className="hover:bg-[var(--surface-secondary)]/50">
                                            <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{employeeName(employee)}</td>
                                            <td className="px-3 py-3 text-[var(--text-secondary)]">{employee.userId?.email || employee.userId?.mobile || "—"}</td>
                                            <td className="px-3 py-3 text-[var(--text-secondary)]">{employee.designation || "—"}</td>
                                            <td className="px-3 py-3 text-[var(--text-secondary)]">{employee.employeeCode || "—"}</td>
                                            <td className="px-3 py-3"><Badge variant={employee.status === "active" ? "success" : "warning"} dot>{employee.status || "unknown"}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
