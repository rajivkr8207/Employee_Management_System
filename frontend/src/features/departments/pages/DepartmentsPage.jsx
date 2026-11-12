import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Plus, Building2, Briefcase, Trash2, Edit2, Search } from "lucide-react";
import { toast } from "react-toastify";
import { departmentService } from "../services/departmentService";

const loadDepartmentData = (organizationId) =>
  Promise.all([
    departmentService.getDepartments({ organizationId }),
    departmentService.getDesignations({ organizationId }),
  ]);

export default function DepartmentsPage() {
  const { stores } = useSelector((state) => state.store || { stores: [] });
  const organizationId = stores[0]?.organizationId?._id || stores[0]?.organizationId;

  const [activeTab, setActiveTab] = useState("departments");
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedOrganizationId, setLoadedOrganizationId] = useState(null);
  const [search, setSearch] = useState("");
  const loading =
    refreshing || Boolean(organizationId && loadedOrganizationId !== organizationId);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "" });
  const [editingDept, setEditingDept] = useState(null);

  const [showDesigModal, setShowDesigModal] = useState(false);
  const [desigForm, setDesigForm] = useState({
    title: "",
    departmentId: "",
    level: "mid",
    baseSalary: 0,
  });

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    try {
      const [deptRes, desigRes] = await loadDepartmentData(organizationId);
      setDepartments(deptRes.data?.data?.departments || []);
      setDesignations(desigRes.data?.data?.designations || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load data");
    } finally {
      setLoadedOrganizationId(organizationId);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return undefined;
    let active = true;
    const loadData = async () => {
      try {
        const [deptRes, desigRes] = await loadDepartmentData(organizationId);
        if (!active) return;
        setDepartments(deptRes.data?.data?.departments || []);
        setDesignations(desigRes.data?.data?.designations || []);
      } catch (err) {
        if (active) toast.error(err?.response?.data?.message || "Failed to load data");
      } finally {
        if (active) setLoadedOrganizationId(organizationId);
      }
    };
    void loadData();
    return () => {
      active = false;
    };
  }, [organizationId]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept._id, deptForm);
        toast.success("Department updated");
      } else {
        await departmentService.createDepartment({ ...deptForm, organizationId });
        toast.success("Department created");
      }
      setShowDeptModal(false);
      setEditingDept(null);
      setDeptForm({ name: "", code: "", description: "" });
      void refreshData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save department");
    }
  };

  const handleDesigSubmit = async (e) => {
    e.preventDefault();
    if (!desigForm.title.trim() || !desigForm.departmentId) {
      toast.error("Title and Department are required");
      return;
    }
    try {
      await departmentService.createDesignation(desigForm);
      toast.success("Designation created");
      setShowDesigModal(false);
      setDesigForm({ title: "", departmentId: "", level: "mid", baseSalary: 0 });
      void refreshData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save designation");
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm("Delete this department and all attached designations?")) return;
    try {
      await departmentService.deleteDepartment(id);
      toast.success("Department deleted");
      void refreshData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete department");
    }
  };

  const handleDeleteDesig = async (id) => {
    if (!window.confirm("Delete this designation?")) return;
    try {
      await departmentService.deleteDesignation(id);
      toast.success("Designation deleted");
      void refreshData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete designation");
    }
  };

  const filteredDepts = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDesigs = designations.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.departmentId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Departments & Designations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organize organization roles, hierarchies, and departments
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "departments" ? (
            <button
              onClick={() => {
                setEditingDept(null);
                setDeptForm({ name: "", code: "", description: "" });
                setShowDeptModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm"
            >
              <Plus size={16} /> Add Department
            </button>
          ) : (
            <button
              onClick={() => {
                setDesigForm({
                  title: "",
                  departmentId: departments[0]?._id || "",
                  level: "mid",
                  baseSalary: 0,
                });
                setShowDesigModal(true);
              }}
              disabled={!departments.length}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm"
            >
              <Plus size={16} /> Add Designation
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "departments"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Building2 size={16} /> Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab("designations")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "designations"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Briefcase size={16} /> Designations ({designations.length})
          </button>
        </div>

        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading records...</div>
      ) : activeTab === "departments" ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No departments created yet.
                  </td>
                </tr>
              ) : (
                filteredDepts.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {d.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{d.name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.description || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 capitalize">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingDept(d);
                          setDeptForm({ name: d.name, code: d.code, description: d.description || "" });
                          setShowDeptModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600 mr-2"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteDept(d._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Level</th>
                <th className="text-left px-4 py-3">Base Salary</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredDesigs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No designations created yet.
                  </td>
                </tr>
              ) : (
                filteredDesigs.map((ds) => (
                  <tr key={ds._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {ds.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {ds.departmentId?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 capitalize">
                        {ds.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      ₹{Number(ds.baseSalary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteDesig(ds._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dept Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingDept ? "Edit Department" : "Add Department"}
            </h2>
            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Department Name *
                </label>
                <input
                  value={deptForm.name}
                  onChange={(e) => setDeptForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Sales, Human Resources"
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Department Code *
                </label>
                <input
                  value={deptForm.code}
                  onChange={(e) => setDeptForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SALES, HR"
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={deptForm.description}
                  onChange={(e) => setDeptForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="flex-1 py-2 text-sm border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation Modal */}
      {showDesigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Designation</h2>
            <form onSubmit={handleDesigSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Designation Title *
                </label>
                <input
                  value={desigForm.title}
                  onChange={(e) => setDesigForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Senior Sales Executive"
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Department *
                </label>
                <select
                  value={desigForm.departmentId}
                  onChange={(e) => setDesigForm((p) => ({ ...p, departmentId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Level
                </label>
                <select
                  value={desigForm.level}
                  onChange={(e) => setDesigForm((p) => ({ ...p, level: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Base Salary
                </label>
                <input
                  type="number"
                  min="0"
                  value={desigForm.baseSalary}
                  onChange={(e) => setDesigForm((p) => ({ ...p, baseSalary: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDesigModal(false)}
                  className="flex-1 py-2 text-sm border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

