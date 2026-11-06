import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    UserCheck,
    Clock,
    XCircle,
    Users,
    Eye,
    Check,
    X,
    Mail,
    Phone,
    Calendar,
} from "lucide-react";
import { toast } from "react-toastify";
import {
    fetchUsersThunk,
    verifyUserThunk,
    rejectUserThunk,
    setActiveTab,
    setSelectedUser,
    clearSelectedUser,
} from "../userVerificationSlice";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import SearchInput from "../../../components/Common/SearchInput";
import Pagination from "../../../components/Common/Pagination";
import ConfirmDialog from "../../../components/Common/ConfirmDialog";

export default function UserVerificationPage() {
    const dispatch = useDispatch();
    const { users, activeTab, loading, actionLoading, selectedUser, error } = useSelector(
        (state) => state.userVerification
    );

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Confirm dialogs
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        user: null,
    });

    useEffect(() => {
        dispatch(fetchUsersThunk("all"));
    }, [dispatch]);

    // Counts for tabs
    const counts = useMemo(() => {
        return {
            all: users.length,
            pending: users.filter((u) => u.status === "pending").length,
            verified: users.filter((u) => u.status === "verified").length,
            rejected: users.filter((u) => u.status === "rejected").length,
        };
    }, [users]);

    // Filter by tab and search
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesTab = activeTab === "all" || u.status === activeTab;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                u.fullName?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.mobile?.includes(q) ||
                u.requestedRole?.toLowerCase().includes(q);
            return matchesTab && matchesSearch;
        });
    }, [users, activeTab, searchQuery]);

    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, page]);

    const handleVerifyConfirm = async () => {
        if (!confirmModal.user) return;
        const res = await dispatch(verifyUserThunk(confirmModal.user.id));
        if (!res.error) {
            toast.success(`User ${confirmModal.user.fullName} verified successfully!`);
        } else {
            toast.error(res.payload || "Failed to verify user");
        }
        setConfirmModal({ isOpen: false, type: null, user: null });
    };

    const handleRejectConfirm = async (reason) => {
        if (!confirmModal.user) return;
        const res = await dispatch(rejectUserThunk({ userId: confirmModal.user.id, reason }));
        if (!res.error) {
            toast.info(`User ${confirmModal.user.fullName} has been rejected.`);
        } else {
            toast.error(res.payload || "Failed to reject user");
        }
        setConfirmModal({ isOpen: false, type: null, user: null });
    };

    const tabs = [
        { id: "all", label: "All Users", count: counts.all, icon: Users },
        { id: "pending", label: "Pending Verification", count: counts.pending, icon: Clock, badgeVariant: "warning" },
        { id: "verified", label: "Verified Users", count: counts.verified, icon: UserCheck, badgeVariant: "success" },
        { id: "rejected", label: "Rejected Users", count: counts.rejected, icon: XCircle, badgeVariant: "danger" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        Store Administrator Verification
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Review store administrator accounts created from admin invitations
                    </p>
                </div>
            </div>

            {error && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={() => dispatch(fetchUsersThunk("all"))}>
                        Retry
                    </Button>
                </div>
            )}

            {/* ── Tabs & Search Bar ── */}
            <Card padding="sm" className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => {
                                    dispatch(setActiveTab(t.id));
                                    setPage(1);
                                }}
                                className={[
                                    "flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-control)] text-xs font-semibold whitespace-nowrap transition-all duration-150",
                                    isActive
                                        ? "bg-[var(--primary)] text-white shadow-sm"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
                                ].join(" ")}
                            >
                                <Icon size={14} />
                                <span>{t.label}</span>
                                <span
                                    className={[
                                        "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                                        isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-[var(--surface-secondary)] text-[var(--text-muted)]",
                                    ].join(" ")}
                                >
                                    {t.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="w-full sm:w-72">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        onClear={() => setSearchQuery("")}
                        placeholder="Search name, email, role..."
                    />
                </div>
            </Card>

            {/* ── Table Card ── */}
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                <th className="px-4 py-3.5">User</th>
                                <th className="px-4 py-3.5">Contact Details</th>
                                <th className="px-4 py-3.5">Requested Role</th>
                                <th className="px-4 py-3.5">Registered On</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-4 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-4 py-4">
                                            <div className="h-6 bg-[var(--surface-secondary)] rounded" />
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">
                                        No users found matching current criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((u) => {
                                    const isPending = u.status === "pending";
                                    return (
                                        <tr
                                            key={u.id}
                                            className="hover:bg-[var(--surface-secondary)]/50 transition-colors duration-100"
                                        >
                                            {/* User & Avatar */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                        {u.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-[var(--text-primary)] leading-snug truncate">
                                                            {u.fullName}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-muted)] truncate">
                                                            @{u.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-4 py-3.5">
                                                <p className="text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                                                    <Mail size={12} className="text-[var(--text-muted)] shrink-0" />
                                                    {u.email}
                                                </p>
                                                <p className="text-[var(--text-secondary)] text-xs flex items-center gap-1.5 mt-0.5">
                                                    <Phone size={12} className="text-[var(--text-muted)] shrink-0" />
                                                    {u.mobile}
                                                </p>
                                            </td>

                                            {/* Role */}
                                            <td className="px-4 py-3.5">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)]">
                                                    {u.requestedRole || u.role}
                                                </span>
                                            </td>

                                            {/* Registered Date */}
                                            <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                                {new Date(u.registrationDate).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-3.5">
                                                {u.status === "verified" && <Badge variant="success" dot>Verified</Badge>}
                                                {u.status === "pending" && <Badge variant="warning" dot>Pending</Badge>}
                                                {u.status === "rejected" && <Badge variant="danger" dot>Rejected</Badge>}
                                                {u.status === "suspended" && <Badge variant="neutral" dot>Suspended</Badge>}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => dispatch(setSelectedUser(u))}
                                                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-secondary)] transition-colors"
                                                        title="View Full Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    {isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmModal({ isOpen: true, type: "verify", user: u })}
                                                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                                                                title="Verify User"
                                                            >
                                                                <Check size={16} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmModal({ isOpen: true, type: "reject", user: u })}
                                                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                                                                title="Reject User"
                                                            >
                                                                <X size={16} />
                                                            </button>

                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredUsers.length > pageSize && (
                    <div className="p-4 border-t border-[var(--border)]">
                        <Pagination
                            currentPage={page}
                            totalPages={Math.ceil(filteredUsers.length / pageSize)}
                            totalItems={filteredUsers.length}
                            itemsPerPage={pageSize}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </div>

            {/* ── View Details Modal ── */}
            {selectedUser && (
                <Modal
                    isOpen={!!selectedUser}
                    onClose={() => dispatch(clearSelectedUser())}
                    title="User Verification Profile"
                    size="lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-[var(--text-muted)]">User ID: {selectedUser.id}</span>
                            <div className="flex items-center gap-2">
                                {selectedUser.status === "pending" && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => {
                                                const u = selectedUser;
                                                dispatch(clearSelectedUser());
                                                setConfirmModal({ isOpen: true, type: "reject", user: u });
                                            }}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => {
                                                const u = selectedUser;
                                                dispatch(clearSelectedUser());
                                                setConfirmModal({ isOpen: true, type: "verify", user: u });
                                            }}
                                        >
                                            Verify User
                                        </Button>
                                    </>
                                )}
                                <Button size="sm" variant="secondary" onClick={() => dispatch(clearSelectedUser())}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-6 text-sm">
                        {/* Header Profile Box */}
                        <div className="flex items-center gap-4 p-4 rounded-[var(--radius-control)] bg-[var(--surface-secondary)] border border-[var(--border)]">
                            <div className="w-14 h-14 rounded-full bg-[var(--primary)] text-white font-bold text-xl flex items-center justify-center shrink-0">
                                {selectedUser.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedUser.fullName}</h3>
                                    {selectedUser.status === "verified" && <Badge variant="success">Verified</Badge>}
                                    {selectedUser.status === "pending" && <Badge variant="warning">Pending Review</Badge>}
                                    {selectedUser.status === "rejected" && <Badge variant="danger">Rejected</Badge>}
                                </div>
                                <p className="text-xs text-[var(--text-secondary)]">@{selectedUser.username} • Requested: <strong>{selectedUser.requestedRole}</strong></p>
                                <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                                    <Calendar size={12} /> Registered on {new Date(selectedUser.registrationDate).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Contact & Address */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)]">
                                <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-2">Contact Details</p>
                                <p className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                                    <Mail size={14} className="text-[var(--text-muted)]" /> {selectedUser.email}
                                </p>
                                <p className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2 mt-1.5">
                                    <Phone size={14} className="text-[var(--text-muted)]" /> {selectedUser.mobile}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)]">
                                <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-2">Approval Status</p>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    {selectedUser.status === "verified"
                                        ? "This store administrator has been approved."
                                        : selectedUser.status === "rejected"
                                            ? "This store administrator application was rejected."
                                            : "This store administrator account is awaiting review."}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-[var(--text-muted)]">
                            No identity documents are attached to this invitation record.
                        </p>

                        {/* If Rejected: Show Reason */}
                        {selectedUser.rejectionReason && (
                            <div className="p-3.5 rounded-[var(--radius-control)] bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                                <p className="text-xs font-bold uppercase mb-1">Rejection Reason</p>
                                <p className="text-xs leading-relaxed">{selectedUser.rejectionReason}</p>
                            </div>
                        )}

                    </div>
                </Modal>
            )}

            {/* ── Verify Confirmation Dialog ── */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === "verify"}
                onClose={() => setConfirmModal({ isOpen: false, type: null, user: null })}
                onConfirm={handleVerifyConfirm}
                title="Verify User Account?"
                message={`Are you sure you want to approve ${confirmModal.user?.fullName}? This will grant full access to their requested role (${confirmModal.user?.requestedRole}).`}
                confirmLabel="Yes, Verify User"
                variant="default"
                loading={actionLoading}
            />

            {/* ── Reject Confirmation Dialog (Requires Reason) ── */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === "reject"}
                onClose={() => setConfirmModal({ isOpen: false, type: null, user: null })}
                onConfirm={handleRejectConfirm}
                title="Reject User Registration"
                message={`Please provide a reason for declining ${confirmModal.user?.fullName}'s application. This explanation will be visible on their status portal.`}
                confirmLabel="Reject Application"
                variant="danger"
                requireReason={true}
                reasonLabel="Rejection Reason"
                reasonPlaceholder="e.g. Identity documents unreadable, business proof mismatch..."
                loading={actionLoading}
            />

        </div>
    );
}
