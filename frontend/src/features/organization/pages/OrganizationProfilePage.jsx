import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Edit,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Store,
  Users,
  Briefcase,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  fetchMyOrganization,
  createOrganization,
  updateMyOrganization,
} from "../organization.thunk";
import { fetchMyStores } from "../../store/store.thunk";
import { fetchEmployees } from "../../employees/employees.thunk";

const verificationStatusBadges = {
  approved: {
    bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
    icon: CheckCircle2,
    label: "Approved & Active",
  },
  pending: {
    bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    icon: Clock,
    label: "Pending Admin Approval",
  },
  rejected: {
    bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
    icon: XCircle,
    label: "Verification Rejected",
  },
};

const businessTypes = [
  "Retail Store & Chain",
  "Supermarket & Hypermarket",
  "Restaurant & Food Service",
  "Pharmacy & Healthcare",
  "Fashion & Apparel",
  "Electronics & Appliances",
  "Wholesale & Distribution",
  "Services & Agency",
  "Other",
];

function OrganizationFormModal({ open, onClose, onSubmit, loading, initialData = null, defaultEmail = "" }) {
  const [form, setForm] = useState(() => ({
    name: initialData?.name || "",
    email: initialData?.email || defaultEmail || "",
    phone: initialData?.phone || "",
    businessType: initialData?.businessType || "Retail Store & Chain",
    street: initialData?.address?.street || "",
    city: initialData?.address?.city || "",
    state: initialData?.address?.state || "",
    pincode: initialData?.address?.pincode || "",
    country: initialData?.address?.country || "India",
  }));

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    if (!initialData && !form.email.trim()) {
      toast.error("Official organization email is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      businessType: form.businessType,
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: form.country.trim() || "India",
      },
    };

    if (!initialData) {
      payload.email = form.email.trim().toLowerCase();
    }

    onSubmit(payload);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {initialData ? "Edit Organization Profile" : "Register New Organization"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enter official legal entity details and business classification
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Organization Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Apex Retail Enterprises Pvt Ltd"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Official Email {!initialData ? "*" : "(Fixed)"}
              </label>
              <input
                name="email"
                type="email"
                disabled={Boolean(initialData)}
                value={form.email}
                onChange={handleChange}
                placeholder="contact@company.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Business Type
            </label>
            <select
              name="businessType"
              value={form.businessType}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {businessTypes.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Headquarters / Legal Address
            </span>
            <div className="space-y-2.5">
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                placeholder="Street address, building, suite"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="grid grid-cols-3 gap-2">
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              {loading ? "Saving..." : initialData ? "Update Organization" : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrganizationProfilePage() {
  const dispatch = useDispatch();
  const { organization, loading, creating } = useSelector((state) => state.organization);
  const { user } = useSelector((state) => state.auth);
  const { stores } = useSelector((state) => state.store || { stores: [] });
  const { employees } = useSelector((state) => state.employees || { employees: [] });
  const storeOrganizationId = stores[0]?.organizationId?._id || stores[0]?.organizationId;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    dispatch(fetchMyOrganization());
    dispatch(fetchMyStores());
  }, [dispatch]);

  useEffect(() => {
    if (storeOrganizationId) {
      dispatch(fetchEmployees({ organizationId: storeOrganizationId }));
    }
  }, [dispatch, storeOrganizationId]);

  const handleSave = async (data) => {
    if (isEditing) {
      const res = await dispatch(updateMyOrganization(data));
      if (!res.error) {
        toast.success("Organization details updated successfully!");
        setShowModal(false);
        setIsEditing(false);
      } else {
        toast.error(res.payload || "Failed to update organization");
      }
    } else {
      const res = await dispatch(createOrganization(data));
      if (!res.error) {
        toast.success("Organization created successfully!");
        setShowModal(false);
      } else {
        toast.error(res.payload || "Failed to create organization");
      }
    }
  };

  const statusInfo =
    verificationStatusBadges[organization?.verificationStatus] ||
    verificationStatusBadges.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organization Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your parent business entity, compliance status, and store network
          </p>
        </div>

        {organization && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4" /> Edit Organization
          </button>
        )}
      </div>

      {loading && !organization ? (
        <div className="space-y-4">
          <div className="h-44 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : !organization ? (
        /* ── Empty State: Setup Organization ── */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No Organization Configured Yet
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            To start adding physical stores, onboarding store managers, and managing employee
            attendance, set up your official organization entity.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Set Up Organization Now
          </button>
        </div>
      ) : (
        /* ── Organization Main View ── */
        <>
          {/* Main Organization Hero Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md font-bold text-xl">
                  {organization.name?.[0]?.toUpperCase() || "O"}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {organization.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.bg}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{organization.businessType || "Retail Business"}</span>
                    <span>•</span>
                    <span>Registered on {new Date(organization.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span className="capitalize">{organization.subscriptionPlan || "Free"} Tier</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Store className="w-4 h-4 text-indigo-500" /> Stores
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stores.length}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Users className="w-4 h-4 text-emerald-500" /> Employees
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {employees.length}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-500" /> Status
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                  {organization.status || "Active"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Briefcase className="w-4 h-4 text-purple-500" /> Business Type
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {organization.businessType || "Retail"}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact & Registration Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" /> Official Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Official Email</span>
                  <span className="font-medium text-gray-900 dark:text-white">{organization.email}</span>
                </div>
                <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Number
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {organization.phone || "Not specified"}
                  </span>
                </div>
                <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Primary Administrator</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {user?.fullName || "Account Owner"}
                  </span>
                </div>
              </div>
            </div>

            {/* Address & Location */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" /> Registered Business Address
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Street</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {organization.address?.street || "Not specified"}
                  </span>
                </div>
                <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">City & State</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {[organization.address?.city, organization.address?.state].filter(Boolean).join(", ") || "Not specified"}
                  </span>
                </div>
                <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pincode & Country</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {[organization.address?.pincode, organization.address?.country || "India"].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal for Creation or Edit */}
      <OrganizationFormModal
        key={organization ? "edit" : "create"}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSave}
        loading={creating || loading}
        initialData={isEditing ? organization : null}
        defaultEmail={user?.email || ""}
      />
    </div>
  );
}
