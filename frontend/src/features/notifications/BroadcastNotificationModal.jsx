import { useState, useEffect } from "react";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { notificationService } from "./notificationService";
import { organizationService } from "../organization/services/organizationService";
import { storeService } from "../store/services/storeService";

export default function BroadcastNotificationModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement",
    storeId: "",
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    const loadData = async () => {
      const [orgRes, storeRes] = await Promise.allSettled([
        organizationService.getMyOrganization(),
        storeService.getMyStores(),
      ]);
      if (!active) return;

      if (orgRes.status === "fulfilled" && orgRes.value.data?.data?.organization) {
        setOrganization(orgRes.value.data.data.organization);
      }
      if (storeRes.status === "fulfilled" && storeRes.value.data?.data?.stores) {
        setStores(storeRes.value.data.data.stores);
      }

      if (orgRes.status === "rejected" || storeRes.status === "rejected") {
        const failure = orgRes.status === "rejected" ? orgRes.reason : storeRes.reason;
        setError(
          failure?.response?.data?.message ||
            failure?.message ||
            "Unable to load organization and store details.",
        );
      }
      setInitLoading(false);
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    setError("");
    setSuccess(false);
    setFormData({
      title: "",
      message: "",
      type: "announcement",
      storeId: "",
    });
    setInitLoading(true);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setError("Please fill in both title and announcement message");
      return;
    }

    if (!organization?._id) {
      setError("Active organization not detected. Please make sure your organization is set up.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await notificationService.broadcastNotification({
        organizationId: organization._id,
        storeId: formData.storeId || undefined,
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to broadcast notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Broadcast Announcement"
      size="md"
    >
      {initLoading ? (
        <div className="py-8 text-center text-sm text-[var(--text-muted)]">
          Loading organization details...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-[var(--danger-soft)] text-[var(--danger)]">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>Announcement broadcast successfully to all staff!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Target Audience
            </label>
            <select
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="">
                Entire Organization ({organization?.name || "All Stores & Staff"})
              </option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  Store: {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Notification Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="announcement">Announcement</option>
                <option value="info">General Info</option>
                <option value="alert">Alert / Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Organization
              </label>
              <div className="text-xs px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-secondary)] text-[var(--text-secondary)] truncate">
                {organization?.name || "My Organization"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mandatory Team Meeting Today"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={150}
              className="w-full text-xs px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Write the message to be sent to staff..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || success}
              className="flex items-center gap-1.5"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send size={13} /> Send Broadcast
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

