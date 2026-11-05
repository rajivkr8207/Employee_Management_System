import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, Clock3, Trash2 } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { fetchEmployees } from "../../employees/employeeSlice";
import { fetchMyStores } from "../../store/storeSlice";
import {
  createShiftAssignment,
  createShiftTemplate,
  deleteShiftAssignment,
  fetchShiftSchedule,
} from "../shiftSlice";

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};
const fullName = (employee) =>
  employee?.userId?.fullName || employee?.userId?.username || "Employee";

export default function ShiftSchedulePage() {
  const dispatch = useDispatch();
  const { stores, loading: storesLoading, error: storesError } = useSelector((state) => state.store);
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useSelector((state) => state.employees);
  const {
    shifts,
    assignments,
    loading,
    saving,
    error,
    notice,
  } = useSelector((state) => state.shiftSchedule);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [date, setDate] = useState(today);
  const [shiftName, setShiftName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [employeeId, setEmployeeId] = useState("");
  const [shiftId, setShiftId] = useState("");

  useEffect(() => {
    dispatch(fetchMyStores());
  }, [dispatch]);

  const store = stores.find((item) => item._id === selectedStoreId) || stores[0];
  const organizationId = store?.organizationId?._id || store?.organizationId;
  const activeEmployees = useMemo(
    () =>
      employees.filter((item) => {
        const employeeStoreId = item.storeId?._id || item.storeId;
        return employeeStoreId === store?._id && item.status === "active";
      }),
    [employees, store?._id],
  );
  const activeShifts = shifts.filter((shift) => shift.status === "active");
  const requestError = error || storesError || employeesError;
  const selectedEmployeeId = activeEmployees.some((employee) => employee._id === employeeId)
    ? employeeId
    : activeEmployees[0]?._id || "";
  const selectedShiftId = activeShifts.some((shift) => shift._id === shiftId)
    ? shiftId
    : activeShifts[0]?._id || "";

  useEffect(() => {
    if (organizationId && store?._id) {
      dispatch(fetchEmployees({ organizationId, storeId: store._id }));
    }
  }, [dispatch, organizationId, store?._id]);

  useEffect(() => {
    if (organizationId && store?._id) {
      dispatch(fetchShiftSchedule({ organizationId, storeId: store._id, date }));
    }
  }, [date, dispatch, organizationId, store?._id]);

  const createShift = (event) => {
    event.preventDefault();
    if (!store || !organizationId) return;
    dispatch(createShiftTemplate({
      organizationId,
      storeId: store._id,
      name: shiftName.trim(),
      startTime,
      endTime,
    })).then((result) => {
      if (!result.error) setShiftName("");
    });
  };

  const createAssignment = (event) => {
    event.preventDefault();
    if (!store || !organizationId || !selectedEmployeeId || !selectedShiftId) return;
    dispatch(createShiftAssignment({
      organizationId,
      storeId: store._id,
      employeeId: selectedEmployeeId,
      shiftId: selectedShiftId,
      date,
    }));
  };

  const removeAssignment = (assignmentId) => {
    dispatch(deleteShiftAssignment({ assignmentId, organizationId }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Shift schedule</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage shift templates and assign active employees to a store and date.
          </p>
        </div>
        {stores.length > 1 && (
          <select
            value={store?._id || ""}
            onChange={(event) => {
              setSelectedStoreId(event.target.value);
            }}
            className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
            aria-label="Select store"
          >
            {stores.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        )}
      </header>

      {requestError && <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{requestError}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

      {!store ? (
        <Card padding="md"><p className="text-sm text-[var(--text-secondary)]">{storesLoading ? "Loading assigned stores..." : "No assigned store is available for scheduling."}</p></Card>
      ) : (
        <>
          <Card padding="md">
            <Card.Header withBorder>
              <div>
                <Card.Title>{store.name}</Card.Title>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {store.code} · {store.address?.city || store.address?.street || "Store schedule"}
                </p>
              </div>
              <Badge variant={store.status === "active" ? "success" : "warning"} dot>{store.status}</Badge>
            </Card.Header>
            <Card.Body>
              <form onSubmit={createShift} className="grid gap-3 sm:grid-cols-4">
                <label className="text-xs text-[var(--text-secondary)] sm:col-span-2">
                  Shift name
                  <input required minLength={2} maxLength={100} value={shiftName} onChange={(event) => setShiftName(event.target.value)} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]" placeholder="Morning shift" />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Starts
                  <input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]" />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Ends
                  <input required type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]" />
                </label>
                <div className="sm:col-span-4">
                  <Button type="submit" disabled={loading || saving || store.status !== "active"}>Add shift template</Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          <Card padding="md">
            <Card.Header withBorder>
              <div>
                <Card.Title>Assign employee shift</Card.Title>
                <p className="mt-1 text-xs text-[var(--text-muted)]">An employee can have one shift per date.</p>
              </div>
            </Card.Header>
            <Card.Body>
              <form onSubmit={createAssignment} className="grid gap-3 sm:grid-cols-4">
                <label className="text-xs text-[var(--text-secondary)] sm:col-span-2">
                  Employee
                  <select required value={selectedEmployeeId} onChange={(event) => setEmployeeId(event.target.value)} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
                    <option value="">Select employee</option>
                    {activeEmployees.map((employee) => <option key={employee._id} value={employee._id}>{fullName(employee)} · {employee.employeeCode}</option>)}
                  </select>
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Shift
                  <select required value={selectedShiftId} onChange={(event) => setShiftId(event.target.value)} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
                    <option value="">Select shift</option>
                    {activeShifts.map((shift) => <option key={shift._id} value={shift._id}>{shift.name} · {shift.startTime}-{shift.endTime}</option>)}
                  </select>
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Date
                  <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]" />
                </label>
                <div className="sm:col-span-4">
                  <Button type="submit" disabled={loading || saving || employeesLoading || !activeEmployees.length || !activeShifts.length || store.status !== "active"}>Schedule employee</Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          <Card padding="md">
            <Card.Header withBorder>
              <div>
                <Card.Title className="flex items-center gap-2"><CalendarDays size={17} /> Schedule</Card.Title>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Assignments for {date}</p>
              </div>
              <Badge variant="info">{assignments.length} scheduled</Badge>
            </Card.Header>
            <Card.Body>
              {loading ? <p className="py-6 text-center text-sm text-[var(--text-secondary)]">Loading schedule...</p> : assignments.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--text-secondary)]">No employee shifts scheduled for this date.</p>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {assignments.map((assignment) => (
                    <div key={assignment._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{fullName(assignment.employeeId)}</p>
                        <p className="text-xs text-[var(--text-muted)]">{assignment.employeeId?.employeeCode} · {assignment.employeeId?.designation}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                          <Clock3 size={14} /> {assignment.shiftId?.name} ({assignment.shiftId?.startTime}–{assignment.shiftId?.endTime})
                        </span>
                        <Button variant="ghost" size="sm" disabled={saving} onClick={() => removeAssignment(assignment._id)} aria-label={`Remove ${fullName(assignment.employeeId)} shift`}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}
