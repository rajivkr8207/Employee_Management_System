/**
 * Global SEO Configuration & Route Presets
 * Easily portable to any React/Vite project.
 */
export const seoConfig = {
  // Brand & Site Meta Defaults
  siteName: "EMS",
  brandFullName: "Employee Management System",
  defaultTitle: "EMS — Enterprise Workforce & Employee Management System",
  titleTemplate: "%s | EMS",
  defaultDescription:
    "Next-generation enterprise workforce platform with geofenced biometric attendance, shift scheduling, payroll calculation, department hierarchies, and real-time team notifications.",
  defaultKeywords:
    "employee management system, workforce management, biometric attendance, geofence clock-in, shift planner, payroll engine, HR portal, employee tracking, store admin",
  siteUrl: typeof window !== "undefined" ? window.location.origin : "https://ems.example.com",
  defaultOgImage: "/favicon.svg",
  defaultOgType: "website",
  defaultTwitterCard: "summary_large_image",
  defaultLocale: "en_US",
  themeColor: "#4f46e5",

  // Static/Fallback Route Presets (Route-based SEO)
  routePresets: {
    "/": {
      title: "Workforce & Operations Portal",
      description: "Manage employees, monitor attendance, process payruns, and schedule store shifts in real time.",
      noindex: false,
    },
    "/login": {
      title: "Sign In",
      description: "Secure login portal for Administrators, Store Admins, Managers, and Employees.",
      keywords: "EMS login, workforce login, employee sign in, staff portal",
      noindex: false,
    },
    "/register": {
      title: "Create an Account",
      description: "Register your organization or join your assigned store branch with verified credentials.",
      keywords: "EMS register, organization onboarding, store admin register",
      noindex: false,
    },
    "/forgot-password": {
      title: "Forgot Password",
      description: "Recover access to your workforce account with secure, single-use token verification.",
      noindex: false,
    },
    "/reset-password": {
      title: "Reset Password",
      description: "Set a new secure password for your employee management portal account.",
      noindex: true,
    },
    "/account-status": {
      title: "Account Status",
      description: "Check verification and approval status for your manager or employee account.",
      noindex: true,
    },

    // Protected Admin Routes (Set to noindex for privacy & data compliance)
    "/admin/dashboard": {
      title: "Super Admin Dashboard",
      description: "Enterprise system statistics, multi-organization metrics, and active store verifications.",
      noindex: true,
    },
    "/admin/organization-verification": {
      title: "Organization Verification",
      description: "Review and approve new organizations and commercial entity registrations.",
      noindex: true,
    },
    "/admin/user-verification": {
      title: "User Account Verifications",
      description: "Verify and activate incoming store administrator applications.",
      noindex: true,
    },
    "/admin/store-verification": {
      title: "Store Location Approvals",
      description: "Review branch geofence radii, store codes, and manager assignments.",
      noindex: true,
    },
    "/admin/manager-verification": {
      title: "Store Manager Approvals",
      description: "Verify store manager qualifications and store assignment requests.",
      noindex: true,
    },
    "/admin/all-users": {
      title: "User Directory",
      description: "Comprehensive listing of all registered users and roles.",
      noindex: true,
    },
    "/admin/all-stores": {
      title: "All Store Branches",
      description: "Enterprise directory of all approved, pending, and inactive store locations.",
      noindex: true,
    },
    "/admin/all-employees": {
      title: "All Employees",
      description: "Organization-wide workforce directory and assignment records.",
      noindex: true,
    },
    "/admin/reports-analytics": {
      title: "Reports & Analytics",
      description: "Aggregated workforce metrics, attendance distributions, and compensation trends.",
      noindex: true,
    },
    "/admin/activity-logs": {
      title: "Audit & Activity Logs",
      description: "Immutable security and audit trail for all system mutations and administrative reviews.",
      noindex: true,
    },

    // Store Admin Routes
    "/store-admin/dashboard": {
      title: "Store Admin Dashboard",
      description: "Branch performance, live employee counts, and store announcement broadcast center.",
      noindex: true,
    },
    "/store-admin/organization": {
      title: "My Organization Profile",
      description: "Manage legal entity records, contact information, and operating policies.",
      noindex: true,
    },
    "/store-admin/stores": {
      title: "Store Branches",
      description: "Configure store locations, geofence coordinates, and branch manager delegations.",
      noindex: true,
    },
    "/store-admin/employees": {
      title: "Employee Management",
      description: "Onboard, edit, and manage employee records, salaries, and assignments.",
      noindex: true,
    },
    "/store-admin/departments": {
      title: "Departments & Designations",
      description: "Organize company hierarchy, operational departments, and designation salary bands.",
      noindex: true,
    },
    "/store-admin/payroll": {
      title: "Payroll Management",
      description: "Automated monthly payruns, attendance deductions, and printable payslip records.",
      noindex: true,
    },
    "/store-admin/shifts": {
      title: "Shift Scheduling",
      description: "Build shift templates and assign schedules to store employees.",
      noindex: true,
    },
    "/store-admin/operations": {
      title: "Store Operations",
      description: "Daily branch attendance, leave approvals, and operational staff rosters.",
      noindex: true,
    },

    // Store Manager Routes
    "/manager/dashboard": {
      title: "Store Manager Dashboard",
      description: "Real-time store branch status, active shift coverage, and today's attendance roster.",
      noindex: true,
    },
    "/manager/operations": {
      title: "Branch Operations",
      description: "Attendance review, leave approvals, and shift monitoring for assigned branches.",
      noindex: true,
    },

    // Employee Self-Service Routes
    "/employee/dashboard": {
      title: "Employee Workspace",
      description: "Geofenced facial attendance clock-in, today's shift timings, and recent announcements.",
      noindex: true,
    },
    "/employee/operations": {
      title: "Employee Portal",
      description: "Submit leave requests, check attendance history, and download monthly payslips.",
      noindex: true,
    },

    // Common Profile & Settings
    "/profile": {
      title: "User Profile",
      description: "Manage personal contact details, security credentials, and biometric enrollment.",
      noindex: true,
    },
  },
};

