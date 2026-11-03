import { Download } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

export default function ReportsAnalyticsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        Reports & Workforce Analytics
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Enterprise metrics on attendance compliance, store coverage, and approval turnaround
                    </p>
                </div>
                <Button variant="outline" size="sm" icon={Download}>
                    Export Executive Summary (CSV)
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Attendance Consistency</Card.Title>
                    </Card.Header>
                    <Card.Body className="space-y-3">
                        <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">93.4%</p>
                        <p className="text-xs text-[var(--text-secondary)]">Average monthly attendance turnout across all retail stores</p>
                        <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "93.4%" }} />
                        </div>
                    </Card.Body>
                </Card>

                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Verification Turnaround</Card.Title>
                    </Card.Header>
                    <Card.Body className="space-y-3">
                        <p className="text-3xl font-extrabold text-[var(--primary)]">14.2 hrs</p>
                        <p className="text-xs text-[var(--text-secondary)]">Average time from user registration to administrator verification</p>
                        <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                            <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: "80%" }} />
                        </div>
                    </Card.Body>
                </Card>

                <Card padding="md">
                    <Card.Header withBorder>
                        <Card.Title>Store Approval Rate</Card.Title>
                    </Card.Header>
                    <Card.Body className="space-y-3">
                        <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">86.0%</p>
                        <p className="text-xs text-[var(--text-secondary)]">74 of 86 submitted commercial facilities approved</p>
                        <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: "86%" }} />
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}
