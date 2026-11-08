# Frontend Development Rules

These conventions apply to the React application in `frontend/`.

## Feature-based structure

- Keep feature-specific pages, components, services, Redux state, and async actions together under `src/features/<feature>/`.
- Use feature-named Redux files: `<feature>.slice.js` for `createSlice` and `<feature>.thunk.js` for `createAsyncThunk`. Keep async API work out of slice files.
- The feature name should match its folder (for example, `employees/employees.slice.js` and `employees/employees.thunk.js`).
- Put reusable API calls in the feature's `services/` folder. Use the shared Axios client from `src/lib/api.js`.
- Put genuinely shared UI in `src/components/`, and shared role constants or app-wide configuration in their existing `src/` folders.

## State and data

- Use Redux Toolkit and React Redux for shared application state. Register feature reducers in `src/app/store.js`.
- Load and mutate server data through feature thunks and real backend APIs; do not add hard-coded sample records or local-storage mock fallbacks.
- Model pending, success, and error states explicitly. Surface API errors instead of silently substituting fabricated data.
- Keep component-local state for transient UI concerns such as open dialogs, field values, or selected filters.

## Routing and access

- Use React Router for navigation and declare application routes in `src/routes/AppRoutes.jsx`.
- Protect authenticated routes with the existing route guards and restrict role-specific pages with `RoleProtectedRoute`.
- Preserve a distinct dashboard and route namespace for each role: system admin (`/admin`), store admin (`/store-admin`), manager (`/store-manager`), and employee (`/employee`).
- Use shared role constants and role-path helpers from `src/constants/roles.js`; do not duplicate role strings or bypass route authorization in the UI.

## Styling

- Use Tailwind CSS utility classes for component layout and styling.
- Use the CSS custom properties defined in `src/app/index.css` for brand, semantic, surface, text, border, sidebar, and shadow colors.
- Keep interactive states, responsive behavior, keyboard focus, and light/dark theme behavior consistent with shared components.
- Prefer shared UI components in `src/components/ui/` over reimplementing common controls.

## Quality checks

- Run `npm run lint` and `npm run build` from `frontend/` before considering frontend changes complete.
- Keep changes focused, preserve existing role workflows, and update directly related documentation when conventions or behavior change.
