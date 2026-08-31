import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { createUserRequest, getUsersRequest, updateUserRequest } from "../api/users.js";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { useAuth } from "../context/useAuth.js";
import { getErrorMessage } from "../utils/errors.js";
import { createUserSchema } from "../utils/validation.js";

function CreateUserForm({ currentUser, onCreated }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", lastName: "", email: "", role: "USER" },
  });

  async function onSubmit(values) {
    try {
      const { data } = await createUserRequest(values);
      toast.success(data.message);
      reset();
      await onCreated();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "No se pudo conceder el acceso") });
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6" aria-labelledby="create-user-title">
      <div className="mb-5">
        <h2 id="create-user-title" className="text-lg font-semibold text-zinc-950">Conceder acceso</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600">
          Crea la cuenta y enviaremos un enlace seguro para que la persona defina su contraseña.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        {errors.root && <Alert tone="error" className="sm:col-span-2">{errors.root.message}</Alert>}
        <Input
          id="new-user-name"
          label="Nombre"
          autoComplete="off"
          error={errors.name}
          registration={register("name")}
          disabled={isSubmitting}
        />
        <Input
          id="new-user-last-name"
          label="Apellidos"
          autoComplete="off"
          error={errors.lastName}
          registration={register("lastName")}
          disabled={isSubmitting}
        />
        <Input
          id="new-user-email"
          label="Email"
          type="email"
          autoComplete="off"
          error={errors.email}
          registration={register("email")}
          disabled={isSubmitting}
        />
        <div className="min-w-0">
          <label htmlFor="new-user-role" className="mb-1.5 block text-sm font-medium text-zinc-800">Rol</label>
          <select
            id="new-user-role"
            {...register("role")}
            disabled={isSubmitting}
            className="focus-ring min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 disabled:bg-zinc-100"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERADMIN" disabled={currentUser.role !== "SUPERADMIN"}>SUPERADMIN</option>
          </select>
        </div>
        <div className="sm:col-span-2 sm:flex sm:justify-end">
          <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
            Crear y enviar acceso
          </Button>
        </div>
      </form>
    </section>
  );
}

function UserRow({ user, currentUser, onUpdated }) {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [saving, setSaving] = useState(false);
  const isSelf = user.id === currentUser.id;
  const protectedSuperAdmin = user.role === "SUPERADMIN" && currentUser.role !== "SUPERADMIN";

  async function save() {
    setSaving(true);
    try {
      const { data } = await updateUserRequest(user.id, { role, isActive });
      onUpdated(data.user);
      toast.success("Usuario actualizado");
    } catch (error) {
      toast.error(getErrorMessage(error));
      setRole(user.role);
      setIsActive(user.isActive);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-t border-zinc-200 align-top">
      <td className="px-4 py-4">
        <span className="font-medium text-zinc-950">{user.name} {user.lastName}</span>
        {isSelf && <span className="ml-2 text-xs text-zinc-500">Tú</span>}
      </td>
      <td className="px-4 py-4 text-zinc-600">{user.email}</td>
      <td className="px-4 py-4">
        <label className="sr-only" htmlFor={`role-${user.id}`}>Rol de {user.email}</label>
        <select
          id={`role-${user.id}`}
          value={role}
          onChange={(event) => setRole(event.target.value)}
          disabled={saving || isSelf || protectedSuperAdmin}
          className="focus-ring min-h-10 rounded-lg border border-zinc-300 bg-white px-2 text-sm disabled:bg-zinc-100"
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPERADMIN" disabled={currentUser.role !== "SUPERADMIN"}>
            SUPERADMIN
          </option>
        </select>
      </td>
      <td className="px-4 py-4">
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            disabled={saving || isSelf || protectedSuperAdmin}
            className="focus-ring h-4 w-4 rounded border-zinc-300 text-indigo-700"
          />
          {isActive ? "Activo" : "Desactivado"}
        </label>
        {!user.emailVerifiedAt && (
          <span className="mt-1 block text-xs font-medium text-amber-700">Invitación pendiente</span>
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-600">
        {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(user.createdAt))}
      </td>
      <td className="px-4 py-4">
        <Button
          type="button"
          variant="secondary"
          loading={saving}
          disabled={role === user.role && isActive === user.isActive}
          onClick={save}
          className="min-h-10 py-2"
        >
          Guardar
        </Button>
      </td>
    </tr>
  );
}

export function UsersAdmin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getUsersRequest({ page, limit: 20, search });
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function replaceUser(updated) {
    setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
  }

  async function handleCreated() {
    if (page !== 1) {
      setPage(1);
      return;
    }
    await loadUsers();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Usuarios</h1>
        <p className="mt-2 text-zinc-600">Concede y gestiona el acceso privado a la aplicación.</p>
      </header>

      <CreateUserForm currentUser={currentUser} onCreated={handleCreated} />

      <form onSubmit={submitSearch} className="flex max-w-xl flex-col gap-2 sm:flex-row">
        <label htmlFor="user-search" className="sr-only">Buscar usuarios</label>
        <input
          id="user-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nombre o email"
          className="focus-ring min-h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3"
        />
        <Button type="submit" className="w-full sm:w-auto">Buscar</Button>
      </form>

      {error && <Alert tone="error">{error}</Alert>}
      {loading ? (
        <Spinner label="Cargando usuarios..." />
      ) : (
        <section className="max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card" aria-label="Listado de usuarios">
          <p id="users-scroll-hint" className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-600 md:hidden">
            Desliza horizontalmente para consultar todas las columnas.
          </p>
          <div
            className="max-w-full overflow-x-auto overscroll-x-contain"
            tabIndex="0"
            aria-label="Tabla de usuarios con desplazamiento horizontal"
            aria-describedby="users-scroll-hint"
          >
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3">Rol</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Creado</th>
                  <th scope="col" className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow key={user.id} user={user} currentUser={currentUser} onUpdated={replaceUser} />
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="p-8 text-center text-zinc-600">No hay resultados.</p>}
          </div>
        </section>
      )}

      <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <Button type="button" variant="secondary" className="min-w-0 flex-1 sm:flex-none" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>
          Anterior
        </Button>
        <span className="order-first w-full text-center text-sm text-zinc-600 sm:order-none sm:w-auto">Página {page} de {totalPages}</span>
        <Button type="button" variant="secondary" className="min-w-0 flex-1 sm:flex-none" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>
          Siguiente
        </Button>
      </nav>
    </div>
  );
}
