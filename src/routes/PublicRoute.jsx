import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { Spinner } from "../components/ui/Spinner.jsx";

export function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Comprobando sesión..." />;
  return user
    ? <Navigate to={user.passwordChangeRequired ? "/password-change-required" : "/dashboard"} replace />
    : <Outlet />;
}
