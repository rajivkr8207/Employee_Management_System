import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Users, Search, Trash2, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { fetchEmployees, createEmployee, deleteEmployee } from "../employees.thunk";
import { fetchMyStores } from "../../store/store.thunk";

const roleBadge = {
  manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  employ: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  employee: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusBadge = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  terminated: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function AddEmployeeModal({ open, onClose, onSubmit, loading, stores, canAddManager }) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    employeeCode: "",
    Dob: "",
    designation: "",
    salary: "0",
    role: "employ",
    storeId: stores[0]?._id || "",
  });

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const storeId = form.storeId || stores[0]?._id || "";
    if (
      !form.fullName.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.designation.trim() ||
      !storeId
    ) {
      toast.error("Name, username, email, password, designation, and store are required");
      return;
    }
    const payload = {
      storeId,
      role: form.role,
      employeeCode: form.employeeCode.trim() || undefined,
      Dob: form.Dob || undefined,
      designation: form.designation.trim(),
      salary: Number(form.salary || 0),
      user: {
        fullName: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      },
    };
    if (form.mobile) payload.user.mobile = form.mobile.trim();
    onSubmit(payload);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Onboard New Employee
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors text-xl font-bold"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username *
            </label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="alexmorgan"
              autoComplete="off"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address *
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="alex@company.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mobile Number
            </label>
            <input
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="9876543210 (optional)"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Temporary Password *
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters with a number"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employee Code
              </label>
              <input
                name="employeeCode"
                value={form.employeeCode}
                onChange={handleChange}
                placeholder="Auto-generated"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                name="Dob"
                type="date"
                value={form.Dob}
                onChange={handleChange}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Designation *
              </label>
              <input
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="Sales Associate"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monthly Salary
            </label>
            <input
              name="salary"
              type="number"
              min="0"
              value={form.salary}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assigned Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="employ">Store Employee</option>
              {canAddManager && <option value="manager">Store Manager</option>}
            </select>
          </div>
          {stores && stores.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign Store *
              </label>
              <select
                name="storeId"
                value={form.storeId || stores[0]?._id || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select store</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-red-600">
              Create an active store before adding an employee.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !stores.length}
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? "Creating..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeeListPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const canAddManager = user?.role === "storeadmin" || user?.role === "admin";
  const { employees, loading, creating, error: employeeError } = useSelector((state) => state.employees);
  const { stores, error: storeError } = useSelector((state) => state.store || { stores: [] });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const organizationId = stores[0]?.organizationId?._id || stores[0]?.organizationId;

  useEffect(() => {
    dispatch(fetchMyStores());
  }, [dispatch]);

  useEffect(() => {
    if (organizationId) {
      dispatch(fetchEmployees({ organizationId }));
    }
  }, [dispatch, organizationId]);

  const getEmployeeUser = (emp) => {
    if (emp.userId && typeof emp.userId === "object") return emp.userId;
    if (emp.user && typeof emp.user === "object") return emp.user;
    return {};
  };
  const getName = (emp) => {
    const user = getEmployeeUser(emp);
    return user.fullName || emp.fullName || user.name || emp.name || "Unnamed";
  };
  const getEmail = (emp) => {
    const user = getEmployeeUser(emp);
    return user.email || emp.email || "-";
  };
  const getMobile = (emp) => {
    const user = getEmployeeUser(emp);
    return user.mobile || user.phone || emp.mobile || emp.mobileno || "-";
  };
  const getRole = (emp) => {
    const user = getEmployeeUser(emp);
    return user.role || emp.role || emp.membershipRole || "employ";
  };
  const getStatus = (emp) => {
    const user = getEmployeeUser(emp);
    if (user.isActive === false) return "inactive";
    return ["active", "inactive", "terminated"].includes(emp.status) ? emp.status : "active";
  };

  const filtered = employees.filter((e) => {
    const name = getName(e);
    const email = getEmail(e);
    const role = getRole(e);
    const matchSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      String(e.employeeCode || e.code || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleAdd = async (data) => {
    const res = await dispatch(createEmployee(data));
    if (!res.error) {
      toast.success("Employee added successfully!");
      setShowAdd(false);
      if (organizationId) {
        dispatch(fetchEmployees({ organizationId, force: true }));
      }
    } else {
      toast.error(res.payload || "Failed to add employee");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await dispatch(deleteEmployee(deleteTarget._id));
    if (!res.error) {
      toast.success("Employee removed successfully");
    } else {
      toast.error(res.payload || "Failed to remove employee");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {(employeeError || storeError) && (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {employeeError || storeError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {employees.length} team member{employees.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or code..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="employ">Employee</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employee
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
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
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">No employees found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {search || roleFilter
                        ? "Try clearing your filters"
                        : "Onboard your first store staff member"}
                    </p>
                    {!search && !roleFilter && (
                      <button
                        type="button"
                        onClick={() => setShowAdd(true)}
                        className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Add Employee
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr
                    key={emp._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                          {getName(emp)[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {getName(emp)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {emp.employeeCode || emp.code || "EMP-NEW"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-white">{getEmail(emp)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getMobile(emp)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {emp.Dob || emp.dob
                        ? new Date(emp.Dob || emp.dob).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                          roleBadge[getRole(emp)] || roleBadge.employ
                        }`}
                      >
                        {getRole(emp) === "employ" ? "Employee" : getRole(emp)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                          statusBadge[getStatus(emp)] || statusBadge.inactive
                        }`}
                      >
                        {getStatus(emp)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewTarget(emp)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                          aria-label={`View details for ${getName(emp)}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(emp)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEmployeeModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAdd}
        loading={creating}
        stores={stores}
        canAddManager={canAddManager}
      />

      {viewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setViewTarget(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-details-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="employee-details-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getName(viewTarget)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {viewTarget.designation || "Employee"} · {viewTarget.employeeCode || "No employee code"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                aria-label="Close employee details"
              >
                &times;
              </button>
            </div>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                ["Email", getEmail(viewTarget)],
                ["Mobile", getMobile(viewTarget)],
                ["Role", getRole(viewTarget) === "employ" ? "Employee" : getRole(viewTarget)],
                ["Status", getStatus(viewTarget)],
                ["Date of birth", viewTarget.Dob || viewTarget.dob ? new Date(viewTarget.Dob || viewTarget.dob).toLocaleDateString() : "Not provided"],
                ["Joining date", viewTarget.joiningDate ? new Date(viewTarget.joiningDate).toLocaleDateString() : "Not provided"],
                ["Store", viewTarget.storeId?.name || "Not assigned"],
                ["Salary", viewTarget.salary == null ? "Not provided" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(viewTarget.salary)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className="mt-1 break-words text-sm text-gray-900 dark:text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Remove Employee?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Are you sure you want to remove <strong>{getName(deleteTarget)}</strong>? This will revoke their account access.
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
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
