import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Store,
    CheckCircle2,
    Clock,
    XCircle,
    Eye,
    Check,
    X,
    Mail,
    Phone,
    MapPin,
    User,
} from "lucide-react";
import { toast } from "react-toastify";
import {
    fetchStoresThunk,
    approveStoreThunk,
    rejectStoreThunk,
} from "../storeVerification.thunk";
import {
    setActiveTab,
    setSelectedStore,
    clearSelectedStore,
} from "../storeVerification.slice";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import SearchInput from "../../../components/Common/SearchInput";
import Pagination from "../../../components/Common/Pagination";
import ConfirmDialog from "../../../components/Common/ConfirmDialog";

export default function StoreVerificationPage() {
    const dispatch = useDispatch();
    const { stores, activeTab, loading, actionLoading, selectedStore, error } = useSelector(
        (state) => state.storeVerification
    );

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        store: null,
    });

    useEffect(() => {
        dispatch(fetchStoresThunk("all"));
    }, [dispatch]);

    const counts = useMemo(() => {
        return {
            all: stores.length,
            pending: stores.filter((s) => s.status === "pending").length,
            approved: stores.filter((s) => s.status === "approved").length,
            rejected: stores.filter((s) => s.status === "rejected").length,
        };
    }, [stores]);

    const filteredStores = useMemo(() => {
        return stores.filter((s) => {
            const matchesTab = activeTab === "all" || s.status === activeTab;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                s.name?.toLowerCase().includes(q) ||
                s.code?.toLowerCase().includes(q) ||
                s.address?.city?.toLowerCase().includes(q) ||
                s.owner?.name?.toLowerCase().includes(q);
            return matchesTab && matchesSearch;
        });
    }, [stores, activeTab, searchQuery]);

    const paginatedStores = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredStores.slice(start, start + pageSize);
    }, [filteredStores, page]);

    const handleApproveConfirm = async () => {
        if (!confirmModal.store) return;
        const res = await dispatch(approveStoreThunk(confirmModal.store.id));
        if (!res.error) {
            toast.success(`Store "${confirmModal.store.name}" approved and activated!`);
        } else {
            toast.error(res.payload || "Failed to approve store");
        }
        setConfirmModal({ isOpen: false, type: null, store: null });
    };

    const handleRejectConfirm = async (reason) => {
        if (!confirmModal.store) return;
        const res = await dispatch(rejectStoreThunk({ storeId: confirmModal.store.id, reason }));
        if (!res.error) {
            toast.info(`Store "${confirmModal.store.name}" has been rejected.`);
        } else {
            toast.error(res.payload || "Failed to reject store");
        }
        setConfirmModal({ isOpen: false, type: null, store: null });
    };

    const tabs = [
        { id: "all", label: "All Stores", count: counts.all, icon: Store },
        { id: "pending", label: "Pending Approval", count: counts.pending, icon: Clock },
        { id: "approved", label: "Approved Stores", count: counts.approved, icon: CheckCircle2 },
        { id: "rejected", label: "Rejected Stores", count: counts.rejected, icon: XCircle },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                        Store Registration & Verification
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Review store details submitted by store administrators and approve or reject registrations
                    </p>
                </div>
            </div>

            {error && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={() => dispatch(fetchStoresThunk("all"))}>
                        Retry
                    </Button>
                </div>
            )}

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
                        placeholder="Search store, code, city, or owner..."
                    />
                </div>
            </Card>

            {/* ── Table Card ── */}
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                <th className="px-4 py-3.5">Store Details</th>
                                <th className="px-4 py-3.5">Organization</th>
                                <th className="px-4 py-3.5">Location</th>
                                <th className="px-4 py-3.5">Store Owner</th>
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
                            ) : paginatedStores.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">
                                        No stores found in this category.
                                    </td>
                                </tr>
                            ) : (
                                paginatedStores.map((s) => {
                                    const isPending = s.status === "pending";
                                    return (
                                        <tr
                                            key={s.id}
                                            className="hover:bg-[var(--surface-secondary)]/50 transition-colors duration-100"
                                        >
                                            {/* Store name & code */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold text-xs shrink-0">
                                                        <Store size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-[var(--text-primary)] leading-snug truncate">
                                                            {s.name}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-muted)] font-mono">
                                                            {s.code}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Organization */}
                                            <td className="px-4 py-3.5">
                                                <p className="text-xs font-medium text-[var(--text-primary)]">
                                                    {s.organizationId?.name || "—"}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                                    Submitted {new Date(s.registrationDate).toLocaleDateString()}
                                                </p>
                                            </td>

                                            {/* Location */}
                                            <td className="px-4 py-3.5">
                                                <p className="text-xs text-[var(--text-primary)] flex items-center gap-1">
                                                    <MapPin size={12} className="text-[var(--text-muted)] shrink-0" />
                                                    {s.address?.city}, {s.address?.state}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)] truncate max-w-xs mt-0.5">
                                                    {s.address?.street}
                                                </p>
                                            </td>

                                            {/* Store Owner */}
                                            <td className="px-4 py-3.5">
                                                <p className="text-xs font-semibold text-[var(--text-primary)]">
                                                    {s.owner?.name}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {s.owner?.email}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3.5">
                                                {s.status === "approved" && <Badge variant="success" dot>Approved</Badge>}
                                                {s.status === "pending" && <Badge variant="warning" dot>Pending Review</Badge>}
                                                {s.status === "rejected" && <Badge variant="danger" dot>Rejected</Badge>}
                                                {s.status === "suspended" && <Badge variant="neutral" dot>Suspended</Badge>}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => dispatch(setSelectedStore(s))}
                                                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-secondary)] transition-colors"
                                                        title="View Store Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    {isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmModal({ isOpen: true, type: "approve", store: s })}
                                                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                                                                title="Approve Store"
                                                            >
                                                                <Check size={16} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmModal({ isOpen: true, type: "reject", store: s })}
                                                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                                                                title="Reject Store"
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

                {filteredStores.length > pageSize && (
                    <div className="p-4 border-t border-[var(--border)]">
                        <Pagination
                            currentPage={page}
                            totalPages={Math.ceil(filteredStores.length / pageSize)}
                            totalItems={filteredStores.length}
                            itemsPerPage={pageSize}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </div>

            {/* ── View Store Details Modal ── */}
            {selectedStore && (
                <Modal
                    isOpen={!!selectedStore}
                    onClose={() => dispatch(clearSelectedStore())}
                    title="Store Registration Review"
                    size="lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-[var(--text-muted)] font-mono">{selectedStore.code}</span>
                            <div className="flex items-center gap-2">
                                {selectedStore.status === "pending" && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => {
                                                const s = selectedStore;
                                                dispatch(clearSelectedStore());
                                                setConfirmModal({ isOpen: true, type: "reject", store: s });
                                            }}
                                        >
                                            Reject Store
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => {
                                                const s = selectedStore;
                                                dispatch(clearSelectedStore());
                                                setConfirmModal({ isOpen: true, type: "approve", store: s });
                                            }}
                                        >
                                            Approve Store
                                        </Button>
                                    </>
                                )}
                                <Button size="sm" variant="secondary" onClick={() => dispatch(clearSelectedStore())}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-6 text-sm">
                        {/* Header Box */}
                        <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-secondary)] border border-[var(--border)]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedStore.name}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
                                        Code: {selectedStore.code}
                                    </p>
                                </div>
                                <Badge variant={selectedStore.status === "approved" ? "success" : selectedStore.status === "rejected" ? "danger" : "warning"}>
                                    {selectedStore.status}
                                </Badge>
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                                <span className="flex items-center gap-1">
                                    <Mail size={12} /> {selectedStore.email}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Phone size={12} /> {selectedStore.contactNumber}
                                </span>
                            </div>
                        </div>

                        {/* Store Address & Owner */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)]">
                                <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                                    <MapPin size={13} /> Full Facility Address
                                </p>
                                <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                                    {selectedStore.address?.street},<br />
                                    {selectedStore.address?.city}, {selectedStore.address?.state} - {selectedStore.address?.pincode}, {selectedStore.address?.country}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)]">
                                <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                                    <User size={13} /> Store Administrator / Owner
                                </p>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedStore.owner?.name}</p>
                                <p className="text-xs text-[var(--text-muted)]">{selectedStore.owner?.email}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Phone: {selectedStore.owner?.mobile}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-[var(--text-muted)]">
                                No verification documents were submitted with this store registration.
                            </p>
                        </div>

                        {selectedStore.rejectionReason && (
                            <div className="p-3.5 rounded-[var(--radius-control)] bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                                <p className="text-xs font-bold uppercase mb-1">Rejection Reason</p>
                                <p className="text-xs leading-relaxed">{selectedStore.rejectionReason}</p>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* ── Approve Dialog ── */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === "approve"}
                onClose={() => setConfirmModal({ isOpen: false, type: null, store: null })}
                onConfirm={handleApproveConfirm}
                title="Approve Retail Store Location?"
                message={`Are you sure you want to approve "${confirmModal.store?.name}" (${confirmModal.store?.code})? This store will become active and available for manager assignment.`}
                confirmLabel="Yes, Approve Store"
                variant="default"
                loading={actionLoading}
            />

            {/* ── Reject Dialog ── */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === "reject"}
                onClose={() => setConfirmModal({ isOpen: false, type: null, store: null })}
                onConfirm={handleRejectConfirm}
                title="Reject Store Application"
                message={`Provide a clear reason for declining the registration of "${confirmModal.store?.name}".`}
                confirmLabel="Reject Store"
                variant="danger"
                requireReason={true}
                reasonLabel="Rejection Reason"
                reasonPlaceholder="e.g. Incomplete fire safety documents, invalid trade license address..."
                loading={actionLoading}
            />

        </div>
    );
}
