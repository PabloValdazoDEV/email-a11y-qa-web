import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { Spinner } from "../components/ui/Spinner.jsx";

export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Comprobando permisos..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return ["ADMIN", "SUPERADMIN"].includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}
