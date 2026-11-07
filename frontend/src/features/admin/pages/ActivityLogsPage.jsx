import { Activity } from "lucide-react";
import Card from "../../../components/ui/Card";

export default function ActivityLogsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Audit & Activity Logs</h1>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Administrative event history
                </p>
            </div>
            <Card padding="lg" className="text-center">
                <Activity size={28} className="mx-auto text-[var(--text-muted)]" />
                <h2 className="mt-3 font-semibold text-[var(--text-primary)]">Activity logs are not available yet</h2>
                <p className="mx-auto mt-1 max-w-xl text-sm text-[var(--text-secondary)]">
                    The backend does not currently store or expose an activity-log API. This page will show real audit events once that backend feature is implemented.
                </p>
            </Card>
        </div>
    );
}
