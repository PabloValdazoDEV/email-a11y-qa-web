import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/useAuth.js";
import { Button } from "./ui/Button.jsx";

function navClass({ isActive }) {
  return `focus-ring rounded-md px-3 py-2 text-center text-sm font-medium ${
    isActive ? "bg-indigo-50 text-indigo-800" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
  }`;
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const appName = import.meta.env.VITE_APP_NAME || "Auth Template";

  async function handleLogout() {
    try {
      await logout();
      toast.success("Sesión cerrada");
    } catch {
      toast.error("La sesión local se ha cerrado, pero el servidor no respondió");
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <NavLink to="/dashboard" className="focus-ring max-w-full truncate rounded text-center font-bold text-zinc-950 sm:text-left">
            {appName}
          </NavLink>
          <nav aria-label="Navegación principal" className="grid w-full grid-cols-2 gap-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
            <NavLink to="/dashboard" className={navClass}>
              Inicio
            </NavLink>
            <NavLink to="/organization/members" className={navClass}>
              Miembros
            </NavLink>
            <NavLink to="/profile" className={navClass}>
              Perfil
            </NavLink>
            {["ADMIN", "SUPERADMIN"].includes(user?.role) && (
              <NavLink to="/admin/users" className={navClass}>
                Usuarios
              </NavLink>
            )}
            <Button type="button" variant="secondary" className="min-h-9 w-full px-3 py-1.5 sm:ml-1 sm:w-auto" onClick={handleLogout}>
              Salir
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
