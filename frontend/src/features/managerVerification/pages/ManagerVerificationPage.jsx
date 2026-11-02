import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    ShieldCheck,
    CheckCircle2,
    Clock,
    XCircle,
    Store,
    Eye,
    Check,
    X,
    FileText,
    Briefcase,
    Calendar,
    AlertTriangle,
    ExternalLink,
    MessageSquare,
} from "lucide-react";
import { toast } from "react-toastify";
import {
    fetchManagersThunk,
    approveManagerThunk,
    rejectManagerThunk,
    requestManagerInfoThunk,
    setActiveTab,
    setSelectedManager,
    clearSelectedManager,
} from "../managerVerificationSlice";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import SearchInput from "../../../components/Common/SearchInput";
import Pagination from "../../../components/Common/Pagination";
import ConfirmDialog from "../../../components/Common/ConfirmDialog";

export default function ManagerVerificationPage() {
    const dispatch = useDispatch();
    const { managers, activeTab, loading, actionLoading, selectedManager } = useSelector(
        (state) => state.managerVerification
    );

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // "approve" | "reject" | "info"
        manager: null,
    });

    useEffect(() => {
        dispatch(fetchManagersThunk("all"));
    }, [dispatch]);

    const counts = useMemo(() => {
        return {
            all: managers.length,
            pending: managers.filter((m) => m.status === "pending").length,
            approved: managers.filter((m) => m.status === "approved").length,
            rejected: managers.filter((m) => m.status === "rejected").length,
        };
    }, [managers]);

    const filteredManagers = useMemo(() => {
        return managers.filter((m) => {
            const matchesTab = activeTab === "all" || m.status === activeTab;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                m.fullName?.toLowerCase().includes(q) ||
                m.email?.toLowerCase().includes(q) ||
                m.phone?.includes(q) ||
                m.assignedStore?.name?.toLowerCase().includes(q) ||
                m.assignedStore?.code?.toLowerCase().includes(q);
            return matchesTab && matchesSearch;
        });
    }, [managers, activeTab, searchQuery]);

    const paginatedManagers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredManagers.slice(start, start + pageSize);
    }, [filteredManagers, page]);

    const handleApproveAttempt = (mgr) => {
        // Enforce governance requirement: Store must be approved first!
        if (mgr.assignedStore?.approvalStatus !== "approved") {
            toast.error(
                `Cannot approve manager! Assigned store "${mgr.assignedStore?.name}" is currently ${mgr.assignedStore?.approvalStatus || "unapproved"}. Please approve the store in Store Verification first.`,
                { autoClose: 6000 }
            );
            return;
        }
        setConfirmModal({ isOpen: true, type: "approve", manager: mgr });
    };

    const handleApproveConfirm = async () => {
        if (!confirmModal.manager) return;
        const res = await dispatch(approveManagerThunk(confirmModal.manager.id));
        if (!res.error) {
            toast.success(`Manager ${confirmModal.manager.fullName} approved for ${confirmModal.manager.assignedStore?.name}!`);
        } else {
            toast.error(res.payload || "Failed to approve manager");
        }
        setConfirmModal({ isOpen: false, type: null, manager: null });
    };

    const handleRejectConfirm = async (reason) => {
        if (!confirmModal.manager) return;
        const res = await dispatch(rejectManagerThunk({ managerId: confirmModal.manager.id, reason }));
        if (!res.error) {
            toast.info(`Manager registration for ${confirmModal.manager.fullName} declined.`);
        } else {
            toast.error(res.payload || "Failed to reject manager");
        }
        setConfirmModal({ isOpen: false, type: null, manager: null });
    };

    const handleRequestInfoConfirm = async (notes) => {
        if (!confirmModal.manager) return;
        const res = await dispatch(requestManagerInfoThunk({ managerId: confirmModal.manager.id, notes }));
        if (!res.error) {
            toast.success(`Information request sent to ${confirmModal.manager.fullName}.`);
        } else {
            toast.error(res.payload || "Failed to send request");
        }
        setConfirmModal({ isOpen: false, type: null, manager: null });
    };

    const tabs = [
        { id: "all", label: "All Managers", count: counts.all, icon: ShieldCheck },
        { id: "pending", label: "Pending Approval", count: counts.pending, icon: Clock },
        { id: "approved", label: "Approved Managers", count: counts.approved, icon: CheckCircle2 },
        { id: "rejected", label: "Rejected Managers", count: counts.rejected, icon: XCircle },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        Store Manager Verification & Approval
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Verify qualifications, validate store assignment, and grant branch leadership access
                    </p>
                </div>
            </div>

            {/* ── Governance Alert Note ── */}
            <div className="p-3.5 rounded-[var(--radius-control)] bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-xs text-[var(--text-primary)] flex items-start gap-3">
                <ShieldCheck size={18} className="text-[var(--primary)] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                    <strong className="font-semibold text-[var(--primary)]">Regulatory Authorization Rule:</strong>{" "}
                    A Store Manager can only be granted management permissions if their designated store is verified and in <strong>Approved</strong> status.
                </div>
            </div>

            {/* ── Tabs & Search Bar ── */}
            <Card padding="sm" className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
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

                <div className="w-full sm:w-72">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        onClear={() => setSearchQuery("")}
                        placeholder="Search manager name, store..."
                    />
                </div>
            </Card>

            {/* ── Table Card ── */}
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                <th className="px-4 py-3.5">Manager</th>
                                <th className="px-4 py-3.5">Assigned Store</th>
                                <th className="px-4 py-3.5">Store Approval Status</th>
                                <th className="px-4 py-3.5">Experience</th>
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
                            ) : paginatedManagers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">
                                        No manager registration records found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedManagers.map((m) => {
                                    const isPending = m.status === "pending";
                                    const isStoreApproved = m.assignedStore?.approvalStatus === "approved";

                                    return (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-[var(--surface-secondary)]/50 transition-colors duration-100"
                                        >
                                            {/* Manager name & phone */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                        {m.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-[var(--text-primary)] leading-snug truncate">
                                                            {m.fullName}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-muted)] truncate">
                                                            {m.email} • {m.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assigned Store */}
                                            <td className="px-4 py-3.5">
                                                <p className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                                                    <Store size={13} className="text-[var(--primary)]" />
                                                    {m.assignedStore?.name}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                                                    {m.assignedStore?.code} ({m.assignedStore?.city})
                                                </p>
                                            </td>

                                            {/* Store Approval Status */}
                                            <td className="px-4 py-3.5">
                                                {isStoreApproved ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                        <CheckCircle2 size={12} /> Store Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20" title="Store must be approved first before approving manager!">
                                                        <AlertTriangle size={12} /> Store {m.assignedStore?.approvalStatus || "Pending"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Experience */}
                                            <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)] max-w-xs truncate">
                                                {m.experience || "Not specified"}
                                            </td>

                                            {/* Manager Status */}
                                            <td className="px-4 py-3.5">
                                                {m.status === "approved" && <Badge variant="success" dot>Approved</Badge>}
                                                {m.status === "pending" && <Badge variant="warning" dot>Pending</Badge>}
                                                {m.status === "rejected" && <Badge variant="danger" dot>Rejected</Badge>}
                                                {m.status === "suspended" && <Badge variant="neutral" dot>Suspended</Badge>}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => dispatch(setSelectedManager(m))}
                                                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-secondary)] transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    {isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApproveAttempt(m)}
                                                                className={[
                                                                    "p-1.5 rounded-lg transition-colors",
                                                                    isStoreApproved
                                                                        ? "text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                                                                        : "text-gray-400 hover:text-amber-600 hover:bg-amber-500/10",
                                                                ].join(" ")}
                                                                title={isStoreApproved ? "Approve Manager" : "Assigned store must be approved first!"}
                                                            >
                                                                <Check size={16} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmModal({ isOpen: true, type: "reject", manager: m })}
                                                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                                                                title="Reject Manager"
                                                            >
                                                                <X size={16} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmModal({ isOpen: true, type: "info", manager: m })}
                                                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors"
                                                                title="Request Additional Information"
                                                            >
                                                                <MessageSquare size={16} />
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

                {filteredManagers.length > pageSize && (
                    <div className="p-4 border-t border-[var(--border)]">
                        <Pagination
                            currentPage={page}
                            totalPages={Math.ceil(filteredManagers.length / pageSize)}
                            totalItems={filteredManagers.length}
                            itemsPerPage={pageSize}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </div>

            {/* ── View Manager Details Modal ── */}
            {selectedManager && (
                <Modal
                    isOpen={!!selectedManager}
                    onClose={() => dispatch(clearSelectedManager())}
                    title="Store Manager Verification Review"
                    size="lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-[var(--text-muted)]">Manager ID: {selectedManager.id}</span>
                            <div className="flex items-center gap-2">
                                {selectedManager.status === "pending" && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => {
                                                const m = selectedManager;
                                                dispatch(clearSelectedManager());
                                                setConfirmModal({ isOpen: true, type: "reject", manager: m });
                                            }}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => {
                                                const m = selectedManager;
                                                dispatch(clearSelectedManager());
                                                handleApproveAttempt(m);
                                            }}
                                        >
                                            Approve Manager
                                        </Button>
                                    </>
                                )}
                                <Button size="sm" variant="secondary" onClick={() => dispatch(clearSelectedManager())}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-6 text-sm">
                        {/* Header Box */}
                        <div className="flex items-center gap-4 p-4 rounded-[var(--radius-control)] bg-[var(--surface-secondary)] border border-[var(--border)]">
                            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white font-bold text-xl flex items-center justify-center shrink-0">
                                {selectedManager.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedManager.fullName}</h3>
                                    <Badge variant={selectedManager.status === "approved" ? "success" : selectedManager.status === "rejected" ? "danger" : "warning"}>
                                        {selectedManager.status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{selectedManager.email} • {selectedManager.phone}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                                    <Calendar size={12} /> Registered on {new Date(selectedManager.registrationDate).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Assigned Store Check Box */}
                        <div className="p-4 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
                                    <Store size={14} /> Assigned Retail Facility
                                </p>
                                {selectedManager.assignedStore?.approvalStatus === "approved" ? (
                                    <Badge variant="success">Store Approved & Operational</Badge>
                                ) : (
                                    <Badge variant="warning">Store Approval Status: {selectedManager.assignedStore?.approvalStatus}</Badge>
                                )}
                            </div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                                {selectedManager.assignedStore?.name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] font-mono">
                                Code: {selectedManager.assignedStore?.code} • Location: {selectedManager.assignedStore?.city}
                            </p>

                            {selectedManager.assignedStore?.approvalStatus !== "approved" && (
                                <div className="mt-2 p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                                    <span>
                                        Warning: This manager cannot receive authorization permissions until their designated store has completed Admin verification.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Experience */}
                        <div className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)]">
                            <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                                <Briefcase size={13} /> Professional Experience & Background
                            </p>
                            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                                {selectedManager.experience || "No prior experience submitted."}
                            </p>
                        </div>

                        {/* Documents */}
                        <div>
                            <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-3">
                                Identity & Relieving Credentials
                            </p>
                            <div className="space-y-2">
                                {selectedManager.documents?.map((doc, dIdx) => (
                                    <div
                                        key={dIdx}
                                        className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] text-emerald-600 flex items-center justify-center">
                                                <FileText size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">{doc.type}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{doc.name}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toast.info(`Viewing ${doc.name}`)}
                                            className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
                                        >
                                            Inspect <ExternalLink size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedManager.rejectionReason && (
                            <div className="p-3.5 rounded-[var(--radius-control)] bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                                <p className="text-xs font-bold uppercase mb-1">Rejection Reason</p>
                                <p className="text-xs leading-relaxed">{selectedManager.rejectionReason}</p>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* ── Approve Dialog ── */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === "approve"}
                onClose={() => setConfirmModal({ isOpen: false, type: null, manager: null })}
                onConfirm={handleApproveConfirm}
                title="Approve Store Manager?"
                message={`Authorize ${confirmModal.manager?.fullName} as the active manager for "${confirmModal.manager?.assignedStore?.name}". They will gain access to store roster and leave approvals.`}
                confirmLabel="Yes, Authorize Manager"
                variant="default"
                loading={actionLoading}
            />

            {/* ── Reject Dialog ── */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === "reject"}
                onClose={() => setConfirmModal({ isOpen: false, type: null, manager: null })}
                onConfirm={handleRejectConfirm}
                title="Reject Manager Application"
                message={`Please specify a reason for declining ${confirmModal.manager?.fullName}'s manager application.`}
                confirmLabel="Reject Application"
                variant="danger"
                requireReason={true}
                reasonLabel="Rejection Reason"
                reasonPlaceholder="e.g. Unverified past experience certificates, unapproved store..."
                loading={actionLoading}
            />

            {/* ── Request Info Dialog ── */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === "info"}
                onClose={() => setConfirmModal({ isOpen: false, type: null, manager: null })}
                onConfirm={handleRequestInfoConfirm}
                title="Request Additional Information"
                message={`Send notes to ${confirmModal.manager?.fullName} regarding missing background verification documents.`}
                confirmLabel="Send Request"
                variant="info"
                requireReason={true}
                reasonLabel="Requested Information"
                reasonPlaceholder="e.g. Please upload prior retail management experience letter..."
                loading={actionLoading}
            />
        </div>
    );
}
