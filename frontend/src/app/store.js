import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/auth.slice";
import dashboardReducer from "../features/dashboard/dashboard.slice";
import userVerificationReducer from "../features/userVerification/userVerificationSlice";
import storeVerificationReducer from "../features/storeVerification/storeVerificationSlice";
import managerVerificationReducer from "../features/managerVerification/managerVerificationSlice";
import adminReducer from "../features/admin/adminSlice";
import storeReducer from "../features/store/storeSlice";
import employeeReducer from "../features/employees/employeeSlice";
import organizationReducer from "../features/organization/organizationSlice";
import shiftScheduleReducer from "../features/shift/shiftSlice";
import attendanceReducer from "../features/attendance/attendanceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    userVerification: userVerificationReducer,
    storeVerification: storeVerificationReducer,
    managerVerification: managerVerificationReducer,
    admin: adminReducer,
    store: storeReducer,
    employees: employeeReducer,
    organization: organizationReducer,
    shiftSchedule: shiftScheduleReducer,
    attendance: attendanceReducer,
  },
});
