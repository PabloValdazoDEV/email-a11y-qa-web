import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { Spinner } from "../components/ui/Spinner.jsx";

export function PrivateRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Comprobando sesión..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.passwordChangeRequired && location.pathname !== "/password-change-required") {
    return <Navigate to="/password-change-required" replace />;
  }
  return <Outlet />;
}
