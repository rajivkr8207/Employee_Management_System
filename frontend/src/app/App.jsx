import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppRoutes from "../routes/AppRoutes";
import { fetchProfileThunk } from "../features/auth/auth.thunk";

function App() {
  const dispatch = useDispatch();
  const isInitializing = useSelector((state) => state.auth.isInitializing);

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--text-secondary)]">
        Loading your profile...
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
    </>
  );
}

export default App;
