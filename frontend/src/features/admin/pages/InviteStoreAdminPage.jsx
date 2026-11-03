import { useState } from "react";
import { Mail, UserCheck, Copy, CheckCircle, Clock, Send, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "../../../lib/api";

export default function InviteStoreAdminPage() {
  const [tab, setTab] = useState("invite");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchPending = async () => {
    setLoadingPending(true);
    try {
      const res = await api.get("/auth/store-admin/pending");
      setPendingUsers(res.data?.data?.users || res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch pending store administrators");
    } finally {
      setLoadingPending(false);
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === "pending") {
      fetchPending();
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSending(true);
    setInviteResult(null);
    try {
      const res = await api.post("/auth/store-admin/invitations", { email: email.trim() });
      const data = res.data?.data || res.data;
      setInviteResult(data);
      toast.success("Invitation link generated and email sent!");
      setEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async (userId) => {
    setApprovingId(userId);
    try {
      await api.patch(`/auth/store-admin/${userId}/approve`);
      toast.success("Store administrator approved! They can now log in.");
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve store administrator");
    } finally {
      setApprovingId(null);
    }
  };

  const copyLink = () => {
    if (inviteResult?.invitationLink) {
      navigator.clipboard.writeText(inviteResult.invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Store Administrator Onboarding
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Issue official email invitations and approve completed registrations
        </p>
      </div>

      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit">
        {[
          { id: "invite", label: "Send Email Invite", icon: Mail },
          { id: "pending", label: "Pending Approvals", icon: Clock },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabChange(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.id
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "invite" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Invite Store Administrator
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Send an onboarding invitation link. Store details and organization will be set up by the Store Admin after onboarding.
            </p>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generating Link...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Invitation
                  </>
                )}
              </button>
            </form>
          </div>

          {inviteResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Invitation Created!
                </h3>
              </div>
              <p className="text-sm text-green-800 dark:text-green-400 mb-1">
                <strong>Recipient:</strong> {inviteResult.email}
              </p>
              <p className="text-sm text-green-800 dark:text-green-400 mb-4">
                <strong>Valid Until:</strong> {new Date(inviteResult.expiresAt).toLocaleString()}
              </p>
              {inviteResult.invitationLink && (
                <div>
                  <label className="block text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                    Registration URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={inviteResult.invitationLink}
                      className="flex-1 text-xs bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded px-2.5 py-1.5 text-green-900 dark:text-green-300"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded text-green-700 dark:text-green-400 hover:bg-green-50 transition-colors shrink-0 flex items-center gap-1 text-xs font-medium"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  {!inviteResult.mailSent && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      Notice: SMTP simulated or offline. You can copy and share the link manually.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "pending" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              Pending Store Administrator Accounts
            </h2>
            <button
              type="button"
              onClick={fetchPending}
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          {loadingPending ? (
            <div className="p-10 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading pending accounts...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">No pending accounts</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                All registered store administrators have been reviewed and approved
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {pendingUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                      {user.fullName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email} {user.mobile && `• ${user.mobile}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApprove(user._id)}
                      disabled={approvingId === user._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                    >
                      {approvingId === user._id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      {approvingId === user._id ? "Approving..." : "Approve Account"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
