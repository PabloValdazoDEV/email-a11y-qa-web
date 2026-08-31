export function Button({ children, loading = false, variant = "primary", className = "", ...props }) {
  const styles =
    variant === "secondary"
      ? "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
      : variant === "danger"
        ? "bg-red-700 text-white hover:bg-red-800"
        : "bg-indigo-700 text-white hover:bg-indigo-800";

  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...props}
      disabled={loading || props.disabled}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  );
}
