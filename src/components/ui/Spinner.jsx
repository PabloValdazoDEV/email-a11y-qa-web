export function Spinner({ label = "Cargando..." }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-700 border-r-transparent" />
      <span className="text-sm text-zinc-600">{label}</span>
    </div>
  );
}
