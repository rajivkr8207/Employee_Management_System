import { Activity } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";

export default function ActivityLogsPage() {
    const logs = [
        { id: "1", action: "Approved Store", target: "QuickMart Express - Indiranagar", by: "Admin (admin@company.com)", time: "Today, 11:30 AM", type: "success" },
        { id: "2", action: "Verified User", target: "Pooja Hegde (Store Admin)", by: "Admin (admin@company.com)", time: "Today, 10:15 AM", type: "success" },
        { id: "3", action: "Rejected User", target: "Karan Verma (Store Manager)", by: "Admin (admin@company.com)", time: "Yesterday, 04:45 PM", type: "danger", note: "Blur document scans" },
        { id: "4", action: "Rejected Store", target: "Metro Retail - CP", by: "Admin (admin@company.com)", time: "Yesterday, 02:10 PM", type: "danger", note: "Missing Fire NOC" },
        { id: "5", action: "Approved Manager", target: "Rajesh Kulkarni for Indiranagar", by: "Admin (admin@company.com)", time: "Oct 29, 05:20 PM", type: "success" },
        { id: "6", action: "Document Request", target: "Nexus Superstore - Bandra", by: "Admin (admin@company.com)", time: "Oct 28, 01:00 PM", type: "warning", note: "Requested commercial lease agreement" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                    Audit & Activity Logs
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    Immutable security and governance records of all administrative verification events
                </p>
            </div>

            <Card padding="md">
                <div className="divide-y divide-[var(--border)]">
                    {logs.map((log) => (
                        <div key={log.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                                    <Activity size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        {log.action}: <span className="font-normal">{log.target}</span>
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                        Executed by {log.by} • {log.time}
                                    </p>
                                    {log.note && (
                                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 italic">
                                            Note: &ldquo;{log.note}&rdquo;
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Badge variant={log.type === "success" ? "success" : log.type === "danger" ? "danger" : "warning"}>
                                {log.action.split(" ")[0]}
                            </Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
