import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/auth.slice";
import userVerificationReducer from "../features/userVerification/userVerification.slice";
import storeVerificationReducer from "../features/storeVerification/storeVerification.slice";
import managerVerificationReducer from "../features/managerVerification/managerVerification.slice";
import adminReducer from "../features/admin/admin.slice";
import storeReducer from "../features/store/store.slice";
import employeeReducer from "../features/employees/employees.slice";
import organizationReducer from "../features/organization/organization.slice";
import shiftScheduleReducer from "../features/shift/shift.slice";
import attendanceReducer from "../features/attendance/attendance.slice";
import leaveReducer from "../features/leave/leave.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    userVerification: userVerificationReducer,
    storeVerification: storeVerificationReducer,
    managerVerification: managerVerificationReducer,
    admin: adminReducer,
    store: storeReducer,
    employees: employeeReducer,
    organization: organizationReducer,
    shiftSchedule: shiftScheduleReducer,
    attendance: attendanceReducer,
    leave: leaveReducer,
  },
});
