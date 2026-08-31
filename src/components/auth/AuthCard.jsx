import { Link } from "react-router-dom";

export function AuthCard({ title, subtitle, children }) {
  const appName = import.meta.env.VITE_APP_NAME || "Auth Template";
  return (
    <main className="flex min-h-screen items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="focus-ring mx-auto mb-6 block w-fit rounded text-sm font-bold tracking-wide text-indigo-800"
        >
          {appName}
        </Link>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card sm:p-8">
          <h1 className="break-words text-2xl font-bold tracking-tight text-zinc-950">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-zinc-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
