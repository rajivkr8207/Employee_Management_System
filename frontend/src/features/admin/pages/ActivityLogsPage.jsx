import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Activity, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Pagination from "../../../components/Common/Pagination";
import SearchInput from "../../../components/Common/SearchInput";
import { fetchAdminActivityLogsThunk } from "../admin.thunk";

const PAGE_SIZE = 10;

const formatTimestamp = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown time";
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const outcomeDetails = {
    success: { label: "Successful", variant: "success", Icon: CheckCircle2 },
    failure: { label: "Failed", variant: "danger", Icon: XCircle },
};

export default function ActivityLogsPage() {
    const dispatch = useDispatch();
    const { activityLogs, activityLogsPagination, activityLogsLoading, activityLogsError } =
        useSelector((state) => state.admin);
    const [search, setSearch] = useState("");
    const [outcome, setOutcome] = useState("");
    const [page, setPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(
                fetchAdminActivityLogsThunk({
                    page,
                    limit: PAGE_SIZE,
                    outcome: outcome || undefined,
                    search: search.trim() || undefined,
                }),
            );
        }, search ? 250 : 0);

        return () => clearTimeout(timer);
    }, [dispatch, outcome, page, refreshKey, search]);

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(1);
    };

    const handleOutcomeChange = (event) => {
        setOutcome(event.target.value);
        setPage(1);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
                        Audit &amp; Activity Logs
                    </h1>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Review successful and failed actions across the system.
                    </p>
                </div>
                <Button
                    icon={RefreshCw}
                    variant="outline"
                    size="sm"
                    loading={activityLogsLoading}
                    onClick={() => setRefreshKey((key) => key + 1)}
                >
                    Refresh
                </Button>
            </div>

            <Card padding="md">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
                    <SearchInput
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Search action, admin, result, or endpoint..."
                    />
                    <label className="sr-only" htmlFor="activity-outcome-filter">
                        Filter by result
                    </label>
                    <select
                        id="activity-outcome-filter"
                        value={outcome}
                        onChange={handleOutcomeChange}
                        className="h-10 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
                    >
                        <option value="">All results</option>
                        <option value="success">Successful only</option>
                        <option value="failure">Failed only</option>
                    </select>
                </div>
            </Card>

            {activityLogsError && (
                <Card padding="md">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <p className="font-semibold text-[var(--danger)]">Could not load activity logs</p>
                            <p role="alert" className="mt-1 text-sm text-[var(--text-secondary)]">
                                {activityLogsError}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            loading={activityLogsLoading}
                            onClick={() => setRefreshKey((key) => key + 1)}
                        >
                            Try again
                        </Button>
                    </div>
                </Card>
            )}

            <Card padding="none" className="overflow-hidden">
                {activityLogsLoading ? (
                    <div className="py-16 text-center text-sm text-[var(--text-secondary)]">
                        Loading activity logs...
                    </div>
                ) : activityLogs.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <Activity size={30} className="mx-auto text-[var(--text-muted)]" />
                        <h2 className="mt-3 font-semibold text-[var(--text-primary)]">
                            {search || outcome ? "No matching activity" : "No activity recorded yet"}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {search || outcome
                                ? "Try a different search or result filter."
                                : "Authenticated create, update, and delete actions will appear here with their result."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left">
                                <thead className="bg-[var(--surface-secondary)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Time</th>
                                        <th className="px-5 py-3 font-semibold">Actor</th>
                                        <th className="px-5 py-3 font-semibold">Action</th>
                                        <th className="px-5 py-3 font-semibold">Result</th>
                                        <th className="px-5 py-3 font-semibold">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {activityLogs.map((log) => {
                                        const result = outcomeDetails[log.outcome] || outcomeDetails.failure;
                                        const ResultIcon = result.Icon;
                                        return (
                                            <tr key={log._id} className="align-top">
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--text-secondary)]">
                                                    {formatTimestamp(log.createdAt)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                                        {log.actorName || log.actorEmail}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                                        {log.actorEmail} · {log.actorRole}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                                        {log.action}
                                                    </p>
                                                    <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
                                                        {log.method} {log.route}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge variant={result.variant} dot>
                                                        <ResultIcon size={12} />
                                                        {result.label}
                                                    </Badge>
                                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                        HTTP {log.statusCode}
                                                    </p>
                                                </td>
                                                <td className="max-w-sm px-5 py-4 text-sm text-[var(--text-secondary)]">
                                                    {log.message}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-[var(--border)] px-5">
                            <Pagination
                                currentPage={activityLogsPagination.page}
                                totalPages={activityLogsPagination.totalPages}
                                totalItems={activityLogsPagination.total}
                                itemsPerPage={activityLogsPagination.limit}
                                onPageChange={setPage}
                            />
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
