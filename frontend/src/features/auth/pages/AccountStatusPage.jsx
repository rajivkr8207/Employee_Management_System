import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, XCircle, ShieldAlert, RefreshCw, LogOut, Mail, User, Phone, CheckCircle2 } from "lucide-react";
import useAuth from "../hooks/useAuth";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import { ROLE_LABELS, normalizeRole, getRoleDashboardPath } from "../../../constants/roles";

export default function AccountStatusPage() {
    const { user, fetchProfile, profileLoading, logout } = useAuth();

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const status = user?.status || (user?.isApproved === false ? "pending" : (user?.isBlocked ? "suspended" : "verified"));
    const roleKey = normalizeRole(user?.role);
    const roleLabel = ROLE_LABELS[roleKey] || user?.role || "User";

    const isPending = status === "pending";
    const isRejected = status === "rejected";
    const isSuspended = status === "suspended" || user?.isBlocked;
    const isVerified = status === "verified" || (user?.isApproved && !user?.isBlocked && !isRejected && !isPending);

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-xl animate-fade-in">
                <Card padding="lg" className="border-t-4 border-t-[var(--primary)] shadow-[var(--shadow-lg)]">
                    <div className="text-center mb-6">
                        {isPending && (
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)] flex items-center justify-center mb-4 shadow-sm animate-pulse">
                                <Clock size={32} />
                            </div>
                        )}
                        {isRejected && (
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center mb-4 shadow-sm">
                                <XCircle size={32} />
                            </div>
                        )}
                        {isSuspended && (
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center mb-4 shadow-sm">
                                <ShieldAlert size={32} />
                            </div>
                        )}
                        {isVerified && (
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center mb-4 shadow-sm">
                                <CheckCircle2 size={32} />
                            </div>
                        )}

                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                            {isPending && "Account Verification Pending"}
                            {isRejected && "Registration Application Rejected"}
                            {isSuspended && "Account Suspended"}
                            {isVerified && "Account Verified & Approved"}
                        </h1>

                        <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
                            {isPending && "Your account was submitted for review. System administrators manually verify all identity and role credentials before granting system access."}
                            {isRejected && (user?.rejectionReason ? `Reason: ${user.rejectionReason}` : "Your application could not be approved with the submitted information. Please contact management.")}
                            {isSuspended && "This account has been temporarily restricted. Contact your organization administrator for reinstatement."}
                            {isVerified && "Your account is active and verified. You have full access to your assigned portal."}
                        </p>
                    </div>

                    {/* Account Details Summary */}
                    <div className="bg-[var(--surface-secondary)] rounded-[var(--radius-control)] p-4 sm:p-5 border border-[var(--border)] mb-6 space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                Current Status
                            </span>
                            {isPending && <Badge variant="warning" dot>Pending Approval</Badge>}
                            {isRejected && <Badge variant="danger" dot>Rejected</Badge>}
                            {isSuspended && <Badge variant="danger" dot>Suspended</Badge>}
                            {isVerified && <Badge variant="success" dot>Verified & Active</Badge>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
                            <div className="flex items-center gap-2.5">
                                <User size={15} className="text-[var(--text-muted)] shrink-0" />
                                <div className="truncate">
                                    <p className="text-xs text-[var(--text-muted)]">Full Name</p>
                                    <p className="font-medium text-[var(--text-primary)] truncate">{user?.fullName || user?.name || "—"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Mail size={15} className="text-[var(--text-muted)] shrink-0" />
                                <div className="truncate">
                                    <p className="text-xs text-[var(--text-muted)]">Email</p>
                                    <p className="font-medium text-[var(--text-primary)] truncate">{user?.email || "—"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Phone size={15} className="text-[var(--text-muted)] shrink-0" />
                                <div className="truncate">
                                    <p className="text-xs text-[var(--text-muted)]">Mobile</p>
                                    <p className="font-medium text-[var(--text-primary)] truncate">{user?.mobile || user?.phone || "—"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <div className="w-4 h-4 rounded bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-[10px] font-bold shrink-0">
                                    R
                                </div>
                                <div className="truncate">
                                    <p className="text-xs text-[var(--text-muted)]">Assigned Role</p>
                                    <p className="font-medium text-[var(--text-primary)] truncate">{roleLabel}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        {isVerified ? (
                            <Link to={getRoleDashboardPath(user?.role)} className="w-full sm:w-auto">
                                <Button variant="primary" className="w-full">
                                    Proceed to Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                variant="outline"
                                icon={RefreshCw}
                                loading={profileLoading}
                                onClick={() => fetchProfile()}
                                className="w-full sm:w-auto"
                            >
                                Check Verification Status
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            icon={LogOut}
                            onClick={() => logout()}
                            className="w-full sm:w-auto text-[var(--danger)] hover:!bg-[var(--danger-soft)]"
                        >
                            Sign Out
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

