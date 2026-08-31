import { useAuth } from "../context/useAuth.js";

export function Dashboard() {
  const { user } = useAuth();
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Ruta privada</p>
      <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Bienvenido, {user.name}</h1>
      <p className="mt-3 text-zinc-600">Tu sesión funciona correctamente.</p>
    </section>
  );
}
