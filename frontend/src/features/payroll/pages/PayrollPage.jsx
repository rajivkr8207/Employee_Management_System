import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { DollarSign, Play, CheckCircle2, Clock, FileText, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { payrollService } from "../services/payrollService";

export default function PayrollPage() {
  const { stores } = useSelector((state) => state.store || { stores: [] });
  const organizationId = stores[0]?.organizationId?._id || stores[0]?.organizationId;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?._id || "");
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewingSlip, setViewingSlip] = useState(null);

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0]._id);
    }
  }, [stores, selectedStoreId]);

  const fetchPayrolls = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await payrollService.getPayrolls({
        organizationId,
        storeId: selectedStoreId || undefined,
        month: selectedMonth,
        year: selectedYear,
      });
      setPayrolls(res.data?.data?.payrolls || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load payroll records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [organizationId, selectedStoreId, selectedMonth, selectedYear]);

  const handleGeneratePayrun = async () => {
    setGenerating(true);
    try {
      await payrollService.generatePayrun({
        organizationId,
        storeId: selectedStoreId || undefined,
        month: selectedMonth,
        year: selectedYear,
      });
      toast.success("Payrun generated successfully!");
      fetchPayrolls();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to generate payrun");
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await payrollService.updatePayrollStatus(id, { status });
      toast.success(`Payroll marked as ${status}`);
      fetchPayrolls();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const totalPayout = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Calculate salaries, track attendance deductions, and process monthly payruns
          </p>
        </div>
        <button
          onClick={handleGeneratePayrun}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm"
        >
          <Play size={16} /> {generating ? "Calculating..." : "Run Monthly Payroll"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Store
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Stores</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {[
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December",
            ].map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Total Net Payout
          </label>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{totalPayout.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="text-left px-4 py-3">Employee</th>
              <th className="text-left px-4 py-3">Designation</th>
              <th className="text-left px-4 py-3">Attendance</th>
              <th className="text-left px-4 py-3">Base Salary</th>
              <th className="text-left px-4 py-3">Deductions</th>
              <th className="text-left px-4 py-3">Net Pay</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  Loading payroll records...
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  No payroll generated for this period. Click "Run Monthly Payroll" above.
                </td>
              </tr>
            ) : (
              payrolls.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {p.employeeId?.userId?.fullName || "Employee"}
                    </p>
                    <p className="text-xs text-gray-500">{p.employeeId?.employeeCode || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {p.employeeId?.designation || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {p.presentDays} / {p.totalDays} days
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                    ₹{Number(p.baseSalary || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-red-600">
                    -₹{Number(p.deductions || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">
                    ₹{Number(p.netSalary || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                        p.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : p.status === "approved"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingSlip(p)}
                        className="px-2.5 py-1 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1"
                      >
                        <FileText size={13} /> Slip
                      </button>
                      {p.status === "draft" && (
                        <button
                          onClick={() => handleStatusChange(p._id, "approved")}
                          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Approve
                        </button>
                      )}
                      {p.status === "approved" && (
                        <button
                          onClick={() => handleStatusChange(p._id, "paid")}
                          className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payslip Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payslip Breakdown</h2>
                <p className="text-xs text-gray-500">
                  Pay Period: {viewingSlip.payPeriodMonth}/{viewingSlip.payPeriodYear}
                </p>
              </div>
              <button
                onClick={() => setViewingSlip(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Employee</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {viewingSlip.employeeId?.userId?.fullName} ({viewingSlip.employeeId?.employeeCode})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Designation</span>
                <span className="text-gray-900 dark:text-white">
                  {viewingSlip.employeeId?.designation}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Attendance Days</span>
                <span className="text-gray-900 dark:text-white">
                  {viewingSlip.presentDays} of {viewingSlip.totalDays} days worked
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Base Salary</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  ₹{Number(viewingSlip.baseSalary || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Absent Deductions</span>
                <span className="text-red-600 font-medium">
                  -₹{Number(viewingSlip.deductions || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-200 dark:border-gray-700 text-base font-bold">
                <span className="text-gray-900 dark:text-white">Net Payout</span>
                <span className="text-emerald-600">
                  ₹{Number(viewingSlip.netSalary || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="mt-5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

