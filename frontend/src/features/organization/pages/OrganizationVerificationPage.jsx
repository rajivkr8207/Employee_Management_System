import { useEffect, useState, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Check,
  X,
  Mail,
  User,
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { organizationService } from "../services/organizationService";

const statusBadges = {
  approved: {
    bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
    label: "Approved & Active",
    icon: CheckCircle2,
  },
  pending: {
    bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    label: "Pending Verification",
    icon: Clock,
  },
  rejected: {
    bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
    label: "Rejected",
    icon: XCircle,
  },
};

export default function OrganizationVerificationPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // "approve" | "reject"
    org: null,
  });

  const fetchPendingOrgs = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await organizationService.getPendingOrganizations();
      const orgs = res.data?.data?.organizations || res.data?.data || [];
      setOrganizations(orgs);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch pending organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    organizationService
      .getPendingOrganizations()
      .then((res) => {
        if (!ignore) {
          const orgs = res.data?.data?.organizations || res.data?.data || [];
          setOrganizations(orgs);
        }
      })
      .catch((err) => {
        if (!ignore) {
          toast.error(err.response?.data?.message || "Failed to fetch pending organizations");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const counts = useMemo(() => {
    return {
      all: organizations.length,
      pending: organizations.filter((o) => o.verificationStatus === "pending").length,
      approved: organizations.filter((o) => o.verificationStatus === "approved").length,
      rejected: organizations.filter((o) => o.verificationStatus === "rejected").length,
    };
  }, [organizations]);

  const filtered = useMemo(() => {
    return organizations.filter((o) => {
      const matchesTab =
        activeTab === "all" || o.verificationStatus === activeTab;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.phone?.includes(q) ||
        o.ownerId?.fullName?.toLowerCase().includes(q) ||
        o.address?.city?.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [organizations, activeTab, search]);

  const handleApprove = async () => {
    if (!confirmDialog.org) return;
    setActionLoading(true);
    try {
      await organizationService.reviewOrganization(confirmDialog.org._id, "approved");
      toast.success(`Organization "${confirmDialog.org.name}" approved successfully!`);
      setConfirmDialog({ isOpen: false, type: null, org: null });
      fetchPendingOrgs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve organization");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirmDialog.org) return;
    setActionLoading(true);
    try {
      await organizationService.reviewOrganization(confirmDialog.org._id, "rejected");
      toast.success(`Organization "${confirmDialog.org.name}" has been rejected.`);
      setConfirmDialog({ isOpen: false, type: null, org: null });
      fetchPendingOrgs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject organization");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organization Verification
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and approve submitted business organizations and legal entities
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchPendingOrgs(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh List
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        {[
          { id: "pending", label: "Pending Approval", count: counts.pending, icon: Clock },
          { id: "all", label: "All Organizations", count: counts.all, icon: Building2 },
          { id: "approved", label: "Approved", count: counts.approved, icon: CheckCircle2 },
          { id: "rejected", label: "Rejected", count: counts.rejected, icon: XCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search Input ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organizations by name, email, owner, or city..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* ── Organization Table ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Organization
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Owner / Administrator
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      No organizations found
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {activeTab === "pending"
                        ? "There are no pending organization approvals at this time"
                        : "No organizations match your selected filter"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((org) => {
                  const status =
                    statusBadges[org.verificationStatus] || statusBadges.pending;
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={org._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                            {org.name?.[0]?.toUpperCase() || "O"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {org.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {org.businessType || "Retail Chain"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {org.ownerId?.fullName || "Store Admin"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {org.ownerId?.email || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-gray-900 dark:text-white">{org.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {org.phone || "No phone"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-gray-900 dark:text-white">
                          {org.address?.city || "-"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {org.address?.state || "India"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bg}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrg(org)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {org.verificationStatus === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDialog({
                                    isOpen: true,
                                    type: "approve",
                                    org,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDialog({
                                    isOpen: true,
                                    type: "reject",
                                    org,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
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
      </div>

      {/* ── View Details Modal ── */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Organization Details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedOrg(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {selectedOrg.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      statusBadges[selectedOrg.verificationStatus]?.bg ||
                      statusBadges.pending.bg
                    }`}
                  >
                    {selectedOrg.verificationStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Business Type: <strong>{selectedOrg.businessType || "Retail"}</strong>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Submitted On: {new Date(selectedOrg.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Owner / Administrator
                </h4>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {selectedOrg.ownerId?.fullName || "Store Administrator"}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {selectedOrg.ownerId?.email || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Contact Information
                </h4>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs space-y-1">
                  <p className="text-gray-700 dark:text-gray-300">
                    Email: <strong>{selectedOrg.email}</strong>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Phone: <strong>{selectedOrg.phone || "Not provided"}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Registered Address
                </h4>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs space-y-1 text-gray-700 dark:text-gray-300">
                  <p>{selectedOrg.address?.street || "No street provided"}</p>
                  <p>
                    {[selectedOrg.address?.city, selectedOrg.address?.state].filter(Boolean).join(", ")}
                  </p>
                  <p>
                    {[selectedOrg.address?.pincode, selectedOrg.address?.country || "India"].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

              {selectedOrg.verificationStatus === "pending" && (
                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        type: "reject",
                        org: selectedOrg,
                      });
                      setSelectedOrg(null);
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Reject Organization
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        type: "approve",
                        org: selectedOrg,
                      });
                      setSelectedOrg(null);
                    }}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    Approve Organization
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            {confirmDialog.type === "approve" ? (
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            )}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {confirmDialog.type === "approve"
                ? "Approve Organization?"
                : "Reject Organization?"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              {confirmDialog.type === "approve"
                ? `Are you sure you want to approve "${confirmDialog.org?.name}"? The owner will receive access to create active stores.`
                : `Are you sure you want to reject "${confirmDialog.org?.name}"?`}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  setConfirmDialog({ isOpen: false, type: null, org: null })
                }
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={
                  confirmDialog.type === "approve" ? handleApprove : handleReject
                }
                className={`flex-1 px-4 py-2 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm ${
                  confirmDialog.type === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading
                  ? "Processing..."
                  : confirmDialog.type === "approve"
                  ? "Confirm Approval"
                  : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
