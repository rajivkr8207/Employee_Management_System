import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Store,
  Edit,
  Trash2,
  Users,
  MapPin,
  Search,
  X,
  Building2,
  Crosshair,
  Navigation,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchMyStores, createStore, deleteStore, updateStore } from "../storeSlice";

const statusColors = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function StoreCard({ store, onEdit, onDelete, onViewManagers }) {
  const hasCoordinates =
    typeof store.location?.lat === "number" && typeof store.location?.lng === "number";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{store.name}</h3>
            {store.code && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{store.code}</p>
            )}
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
            statusColors[store.status] || statusColors.inactive
          }`}
        >
          {store.status || "inactive"}
        </span>
      </div>

      {store.address && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {[store.address.street, store.address.city, store.address.state]
              .filter(Boolean)
              .join(", ") || "No address specified"}
          </span>
        </div>
      )}

      {hasCoordinates && (
        <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-2.5 py-1.5 rounded-lg mb-4">
          <div className="flex items-center gap-1.5 font-mono">
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span>
              {store.location.lat.toFixed(4)}, {store.location.lng.toFixed(4)}
            </span>
            {store.location.radius && (
              <span className="text-gray-500 dark:text-gray-400 font-sans">
                ({store.location.radius}m)
              </span>
            )}
          </div>
          <a
            href={`https://www.google.com/maps?q=${store.location.lat},${store.location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            Map <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onViewManagers(store)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium transition-colors"
        >
          <Users className="w-3.5 h-3.5" /> Managers
        </button>
        <button
          type="button"
          onClick={() => onEdit(store)}
          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ml-auto"
        >
          <Edit className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(store)}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

function CreateStoreModal({ open, onClose, onSubmit, loading, initialData = null }) {
  const [form, setForm] = useState(() => ({
    name: initialData?.name || "",
    code: initialData?.code || "",
    street: initialData?.address?.street || "",
    city: initialData?.address?.city || "",
    state: initialData?.address?.state || "",
    pincode: initialData?.address?.pincode || "",
    lat: initialData?.location?.lat !== undefined ? String(initialData.location.lat) : "",
    lng: initialData?.location?.lng !== undefined ? String(initialData.location.lng) : "",
    radius: initialData?.location?.radius !== undefined ? String(initialData.location.radius) : "100",
  }));

  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setFetchingLocation(true);
    setLocationAccuracy(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);

        setForm((prev) => ({
          ...prev,
          lat: String(lat),
          lng: String(lng),
          radius: prev.radius || "100",
        }));
        setLocationAccuracy(accuracy);
        setFetchingLocation(false);
        toast.success(`Location captured: ${lat}, ${lng} (±${accuracy}m accuracy)`);

        // Reverse geocode to auto-fill address if not already filled
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            setForm((prev) => ({
              ...prev,
              street: prev.street || addr.road || addr.suburb || addr.neighbourhood || "",
              city: prev.city || addr.city || addr.town || addr.village || addr.county || "",
              state: prev.state || addr.state || "",
              pincode: prev.pincode || addr.postcode || "",
            }));
          }
        } catch {
          // non-critical address auto-fill fallback
        }
      },
      (error) => {
        setFetchingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied. Please allow GPS access in your browser or enter coordinates manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("GPS position unavailable. Please enter coordinates manually.");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out. Please try again or type coordinates manually.");
            break;
          default:
            toast.error("Unable to retrieve location. Please enter coordinates manually.");
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Store name is required");
      return;
    }

    const latNum = parseFloat(form.lat);
    const lngNum = parseFloat(form.lng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast.error("Please fetch or enter a valid Latitude between -90 and 90");
      return;
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      toast.error("Please fetch or enter a valid Longitude between -180 and 180");
      return;
    }

    const generatedCode =
      form.code.trim() ||
      `STR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    onSubmit({
      name: form.name.trim(),
      code: generatedCode,
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: "India",
      },
      location: {
        lat: latNum,
        lng: lngNum,
        radius: form.radius ? parseFloat(form.radius) : 100,
      },
    });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {initialData ? "Edit Store" : "Create New Store"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Configure store identity, geofence, and address
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
          {/* Store Name & Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Store Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Nexus Superstore - Bandra"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Store Code
            </label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g. STR-MUM-01 (Auto-generated if blank)"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
          </div>

          {/* ── Geolocation & Fetch My Location Section ── */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Store Geolocation & Attendance Geofence *
                </span>
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400 mt-0.5">
                  Used by employees to verify check-in proximity via mobile GPS
                </p>
              </div>

              {/* FETCH MY LOCATION BUTTON */}
              <button
                type="button"
                onClick={handleFetchLocation}
                disabled={fetchingLocation}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                {fetchingLocation ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching GPS...
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3.5 h-3.5" /> Fetch My Location
                  </>
                )}
              </button>
            </div>

            {/* Coordinates Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Latitude *
                </label>
                <input
                  name="lat"
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={handleChange}
                  placeholder="e.g. 19.076090"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Longitude *
                </label>
                <input
                  name="lng"
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={handleChange}
                  placeholder="e.g. 72.877426"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Radius (metres)
                </label>
                <input
                  name="radius"
                  type="number"
                  min="10"
                  max="10000"
                  value={form.radius}
                  onChange={handleChange}
                  placeholder="100"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* GPS feedback display */}
            {form.lat && form.lng && (
              <div className="flex items-center justify-between text-[11px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 px-2.5 py-1 rounded-md">
                <span>
                  ✓ Coordinates locked: <strong>{parseFloat(form.lat).toFixed(6)}, {parseFloat(form.lng).toFixed(6)}</strong>
                  {locationAccuracy ? ` (±${locationAccuracy}m)` : ""}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${form.lat},${form.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-medium hover:underline text-indigo-600 dark:text-indigo-400"
                >
                  View on map <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Address Fields */}
          <div>
            <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Store Address
            </span>
            <div className="space-y-2.5">
              <div>
                <input
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="Street / Building / Area"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
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
          </div>

          {/* Action Buttons */}
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
              disabled={loading || fetchingLocation}
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              {loading ? "Saving..." : initialData ? "Save Changes" : "Create Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StoreListPage() {
  const dispatch = useDispatch();
  const { stores, loading, creating } = useSelector((state) => state.store);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchMyStores());
  }, [dispatch]);

  const filtered = stores.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.code?.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.city?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    if (editTarget) {
      const res = await dispatch(updateStore({ storeId: editTarget._id, data }));
      if (!res.error) {
        toast.success("Store updated successfully!");
        setShowModal(false);
        setEditTarget(null);
      } else {
        toast.error(res.payload || "Failed to update store");
      }
    } else {
      const res = await dispatch(createStore(data));
      if (!res.error) {
        toast.success("Store created successfully!");
        setShowModal(false);
      } else {
        toast.error(res.payload || "Failed to create store");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await dispatch(deleteStore(deleteTarget._id));
    if (!res.error) {
      toast.success("Store deleted successfully");
    } else {
      toast.error(res.payload || "Failed to delete store");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stores.length} registered store{stores.length !== 1 ? "s" : ""} with GPS geofencing
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditTarget(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Store
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stores by name, code, or city..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/60 p-8">
          <Store className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">No stores found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {search
              ? "No stores match your search query"
              : "Create your first store using 'Fetch My Location' to configure GPS coordinates"}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => {
                setEditTarget(null);
                setShowModal(true);
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Create Store
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((store) => (
            <StoreCard
              key={store._id}
              store={store}
              onEdit={(s) => {
                setEditTarget(s);
                setShowModal(true);
              }}
              onDelete={setDeleteTarget}
              onViewManagers={(s) => toast.info(`Managing team for ${s.name}`)}
            />
          ))}
        </div>
      )}

      <CreateStoreModal
        key={editTarget ? editTarget._id : "create"}
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditTarget(null);
        }}
        onSubmit={handleSave}
        loading={creating}
        initialData={editTarget}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Store?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
