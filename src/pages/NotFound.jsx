import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-700">404</p>
        <h1 className="mt-2 text-3xl font-bold">Página no encontrada</h1>
        <p className="mt-3 text-zinc-600">La dirección solicitada no existe.</p>
        <Link
          to="/"
          className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-lg bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
