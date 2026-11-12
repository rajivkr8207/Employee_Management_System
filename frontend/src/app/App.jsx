import { useEffect } from "react";
import { useDispatch } from "react-redux";
import AppRoutes from "../routes/AppRoutes";
import { fetchProfileThunk } from "../features/auth/auth.thunk";
import { RouteSEOTracker } from "../seo";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  return (
    <>
      <RouteSEOTracker />
      <AppRoutes />
    </>
  );
}

export default App;
