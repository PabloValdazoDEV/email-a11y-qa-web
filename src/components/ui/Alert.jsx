export function Alert({ children, tone = "info", className = "" }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-indigo-200 bg-indigo-50 text-indigo-900";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border p-3 text-sm ${styles} ${className}`}>
      {children}
    </div>
  );
}
