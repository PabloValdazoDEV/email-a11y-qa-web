import { useEffect, useState } from "react";
import { createSafeEmailPreview } from "../../utils/emailPreview.js";
import { Button } from "../ui/Button.jsx";

const PREVIEW_DEBOUNCE_MS = 400;

export function EmailPreview({ html }) {
  const [viewport, setViewport] = useState("desktop");
  const [previewDocument, setPreviewDocument] = useState(() => createSafeEmailPreview(html));
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setUpdating(true);
    const timeoutId = window.setTimeout(() => {
      setPreviewDocument(createSafeEmailPreview(html));
      setUpdating(false);
    }, PREVIEW_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [html]);

  const viewportClass = viewport === "mobile" ? "w-[375px]" : "w-[680px]";

  return (
    <section className="min-w-0" aria-labelledby="email-preview-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="email-preview-title" className="text-sm font-semibold text-zinc-800">
            Preview de edición
          </h3>
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            Previsualización aproximada; no representa un cliente de correo concreto.
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-800">Imágenes desactivadas</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Tamaño de la preview">
          <Button
            type="button"
            variant={viewport === "desktop" ? "primary" : "secondary"}
            aria-pressed={viewport === "desktop"}
            onClick={() => setViewport("desktop")}
          >
            Desktop
          </Button>
          <Button
            type="button"
            variant={viewport === "mobile" ? "primary" : "secondary"}
            aria-pressed={viewport === "mobile"}
            onClick={() => setViewport("mobile")}
          >
            Móvil
          </Button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-300 bg-zinc-200 p-3">
        <div className={`${viewportClass} relative mx-auto max-w-full transition-[width]`}>
          <iframe
            title={`Preview de edición en tamaño ${viewport === "mobile" ? "móvil" : "desktop"}`}
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={previewDocument}
            className="h-[640px] w-full rounded-lg border-0 bg-white shadow-sm"
          />
          <p
            className={`pointer-events-none absolute right-2 top-2 rounded bg-zinc-950 px-2 py-1 text-xs font-semibold text-white transition-opacity ${
              updating ? "opacity-80" : "opacity-0"
            }`}
            aria-live="polite"
          >
            {updating ? "Actualizando preview…" : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
