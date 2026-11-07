import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, Store, Users, UserCheck, Clock3 } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { fetchAdminDashboardStatsThunk } from "../admin.thunk";

const number = (value) => Number(value || 0).toLocaleString();
const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);

function downloadSummary(stats) {
    const rows = [
        ["Metric", "Value"],
        ["Total users", stats.users.total],
        ["Verified users", stats.users.verified],
        ["Pending user approvals", stats.users.pending],
        ["Blocked users", stats.users.blocked],
        ["Total stores", stats.stores.total],
        ["Active stores", stats.stores.active],
        ["Pending store approvals", stats.stores.pending],
        ["Total employees", stats.employees.total],
        ["Active employees", stats.employees.active],
        ["Total managers", stats.managers.total],
        ["Approved managers", stats.managers.approved],
        ["Pending managers", stats.managers.pending],
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee-management-summary.csv";
    link.click();
    URL.revokeObjectURL(url);
}

function MetricCard({ title, value, detail, icon: Icon, color }) {
    return (
        <Card padding="md">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-[var(--text-secondary)]">{title}</p>
                    <p className="mt-2 text-3xl font-extrabold text-[var(--text-primary)]">{number(value)}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p>
                </div>
                <span className={`rounded-xl p-3 ${color}`}><Icon size={20} /></span>
            </div>
        </Card>
    );
}

export default function ReportsAnalyticsPage() {
    const dispatch = useDispatch();
    const { stats, statsLoading, statsError } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchAdminDashboardStatsThunk());
    }, [dispatch]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Reports & Workforce Overview</h1>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Counts are loaded from the admin dashboard API.</p>
                </div>
                <Button variant="outline" size="sm" icon={Download} disabled={!stats} onClick={() => downloadSummary(stats)}>
                    Export CSV
                </Button>
            </div>

            {statsError && (
                <div role="alert" className="flex flex-col justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-700 sm:flex-row sm:items-center">
                    <p className="text-sm">{statsError}</p>
                    <Button size="sm" variant="outline" onClick={() => dispatch(fetchAdminDashboardStatsThunk())}>Retry</Button>
                </div>
            )}

            {statsLoading && !stats ? (
                <Card className="text-sm text-[var(--text-secondary)]">Loading report data...</Card>
            ) : stats ? (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard title="Users" value={stats.users.total} detail={`${number(stats.users.verified)} verified · ${percent(stats.users.verified, stats.users.total)}%`} icon={Users} color="bg-indigo-500/10 text-indigo-600" />
                        <MetricCard title="Active stores" value={stats.stores.active} detail={`${number(stats.stores.pending)} awaiting approval of ${number(stats.stores.total)}`} icon={Store} color="bg-emerald-500/10 text-emerald-600" />
                        <MetricCard title="Employees" value={stats.employees.total} detail={`${number(stats.employees.active)} active`} icon={UserCheck} color="bg-sky-500/10 text-sky-600" />
                        <MetricCard title="Pending manager reviews" value={stats.managers.pending} detail={`${number(stats.managers.approved)} approved of ${number(stats.managers.total)}`} icon={Clock3} color="bg-amber-500/10 text-amber-600" />
                    </div>
                    <Card padding="md">
                        <Card.Header withBorder><Card.Title>Data scope</Card.Title><Badge variant="info">Live API</Badge></Card.Header>
                        <Card.Body>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Attendance-rate trends, verification turnaround, activity history and payroll reports are not included: the backend currently does not expose reporting endpoints for those metrics. No sample figures are shown.
                            </p>
                        </Card.Body>
                    </Card>
                </>
            ) : !statsError ? (
                <Card className="text-sm text-[var(--text-secondary)]">No report data is available.</Card>
            ) : null}
        </div>
    );
}
