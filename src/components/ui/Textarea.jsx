export function Textarea({ id, label, error, registration, hint, className = "", ...props }) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="focus-ring min-h-80 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm leading-6 text-zinc-950 placeholder:text-zinc-400 disabled:bg-zinc-100"
        {...registration}
        {...props}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs leading-5 text-zinc-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-700">
          {error.message}
        </p>
      )}
    </div>
  );
}
