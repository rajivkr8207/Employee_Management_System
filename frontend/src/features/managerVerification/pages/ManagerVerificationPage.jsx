import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, Clock, Eye, ShieldCheck, Store, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Modal from "../../../components/ui/Modal";
import SearchInput from "../../../components/Common/SearchInput";
import ConfirmDialog from "../../../components/Common/ConfirmDialog";
import {
    approveManagerThunk,
    fetchManagersThunk,
    rejectManagerThunk,
} from "../managerVerification.thunk";
import { setActiveTab } from "../managerVerification.slice";

export default function ManagerVerificationPage() {
    const dispatch = useDispatch();
    const { managers, activeTab, loading, actionLoading, error } = useSelector(
        (state) => state.managerVerification,
    );
    const [search, setSearch] = useState("");
    const [selectedManager, setSelectedManager] = useState(null);
    const [confirm, setConfirm] = useState({ type: null, manager: null });

    useEffect(() => {
        dispatch(fetchManagersThunk("all"));
    }, [dispatch]);

    const counts = useMemo(
        () => ({
            all: managers.length,
            pending: managers.filter((manager) => manager.status === "pending").length,
            approved: managers.filter((manager) => manager.status === "approved").length,
            rejected: managers.filter((manager) => manager.status === "rejected").length,
        }),
        [managers],
    );
    const filteredManagers = useMemo(() => {
        const query = search.trim().toLowerCase();
        return managers.filter((manager) => {
            const matchesTab = activeTab === "all" || manager.status === activeTab;
            const text = [
                manager.fullName,
                manager.email,
                manager.phone,
                manager.assignedStore?.name,
                manager.assignedStore?.code,
            ].filter(Boolean).join(" ").toLowerCase();
            return matchesTab && (!query || text.includes(query));
        });
    }, [managers, activeTab, search]);

    const confirmAction = async (reason) => {
        const manager = confirm.manager;
        if (!manager) return;
        const result = confirm.type === "approve"
            ? await dispatch(approveManagerThunk(manager.id))
            : await dispatch(rejectManagerThunk({ managerId: manager.id, reason }));
        if (result.error) {
            toast.error(result.payload || "Unable to update manager verification.");
        } else {
            toast.success(confirm.type === "approve" ? "Manager approved." : "Manager rejected.");
            setSelectedManager(null);
        }
        setConfirm({ type: null, manager: null });
    };

    const tabs = [
        { id: "all", label: "All managers", icon: ShieldCheck },
        { id: "pending", label: "Pending", icon: Clock },
        { id: "approved", label: "Approved", icon: CheckCircle2 },
        { id: "rejected", label: "Rejected", icon: XCircle },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Store Manager Verification</h1>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Manager account and assigned store details loaded from the backend
                </p>
            </div>

            <Card padding="sm" className="space-y-3">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => dispatch(setActiveTab(id))}
                            className={[
                                "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold",
                                activeTab === id ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]",
                            ].join(" ")}
                        >
                            <Icon size={14} /> {label} ({counts[id]})
                        </button>
                    ))}
                </div>
                <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search manager or store..." />
            </Card>

            {error && (
                <div role="alert" className="flex flex-col justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-700 sm:flex-row sm:items-center">
                    <p className="text-sm">{error}</p>
                    <Button size="sm" variant="outline" onClick={() => dispatch(fetchManagersThunk("all"))}>Retry</Button>
                </div>
            )}

            <Card padding="sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                <th className="px-4 py-3">Manager</th>
                                <th className="px-4 py-3">Assigned store</th>
                                <th className="px-4 py-3">Designation</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">Loading manager records...</td></tr>
                            ) : filteredManagers.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">No manager records found.</td></tr>
                            ) : filteredManagers.map((manager) => (
                                <tr key={manager.id}>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-[var(--text-primary)]">{manager.fullName}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{manager.email} · {manager.phone || "No phone"}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]"><Store size={13} />{manager.assignedStore?.name || "Not assigned"}</p>
                                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{manager.assignedStore?.code || "—"} · {manager.assignedStore?.city || "—"}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{manager.experience || "Not provided"}</td>
                                    <td className="px-4 py-3"><Badge variant={manager.status === "approved" ? "success" : manager.status === "rejected" ? "danger" : "warning"} dot>{manager.status}</Badge></td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <Button size="xs" variant="ghost" icon={Eye} onClick={() => setSelectedManager(manager)}>Details</Button>
                                            {manager.status === "pending" && (
                                                <>
                                                    <Button size="xs" onClick={() => {
                                                        if (manager.assignedStore?.approvalStatus !== "approved") {
                                                            toast.error("Approve the assigned store before approving its manager.");
                                                            return;
                                                        }
                                                        setConfirm({ type: "approve", manager });
                                                    }}>Approve</Button>
                                                    <Button size="xs" variant="danger-outline" onClick={() => setConfirm({ type: "reject", manager })}>Reject</Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {selectedManager && (
                <Modal isOpen onClose={() => setSelectedManager(null)} title="Manager account details" size="md">
                    <div className="space-y-3 text-sm">
                        <p><strong>Name:</strong> {selectedManager.fullName}</p>
                        <p><strong>Email:</strong> {selectedManager.email}</p>
                        <p><strong>Phone:</strong> {selectedManager.phone || "Not provided"}</p>
                        <p><strong>Account created:</strong> {selectedManager.registrationDate ? new Date(selectedManager.registrationDate).toLocaleString() : "—"}</p>
                        <p><strong>Assigned store:</strong> {selectedManager.assignedStore?.name || "Not assigned"}</p>
                        <p><strong>Store approval:</strong> {selectedManager.assignedStore?.approvalStatus || "Unknown"}</p>
                        <p><strong>Designation:</strong> {selectedManager.experience || "Not provided"}</p>
                        {selectedManager.rejectionReason && <p className="text-rose-600"><strong>Rejection reason:</strong> {selectedManager.rejectionReason}</p>}
                    </div>
                </Modal>
            )}
            <ConfirmDialog
                isOpen={confirm.type === "approve"}
                onClose={() => setConfirm({ type: null, manager: null })}
                onConfirm={() => confirmAction()}
                title="Approve manager?"
                message={`Approve ${confirm.manager?.fullName} for ${confirm.manager?.assignedStore?.name}?`}
                confirmLabel="Approve"
                loading={actionLoading}
            />
            <ConfirmDialog
                isOpen={confirm.type === "reject"}
                onClose={() => setConfirm({ type: null, manager: null })}
                onConfirm={confirmAction}
                title="Reject manager?"
                message={`Enter a reason for rejecting ${confirm.manager?.fullName}.`}
                confirmLabel="Reject"
                variant="danger"
                requireReason
                reasonLabel="Rejection reason"
                reasonPlaceholder="Add the reason for this decision"
                loading={actionLoading}
            />
        </div>
    );
}
