import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createRevisionRequest,
  getRevisionRequest,
  getRevisionsRequest,
} from "../../api/revisions.js";
import { getErrorMessage } from "../../utils/errors.js";
import { Alert } from "../ui/Alert.jsx";
import { Button } from "../ui/Button.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { Textarea } from "../ui/Textarea.jsx";
import { EmailPreview } from "./EmailPreview.jsx";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : dateFormatter.format(date);
}

function authorName(createdBy) {
  return [createdBy?.name, createdBy?.lastName].filter(Boolean).join(" ") || "Usuario desconocido";
}

function revisionSummary(revision) {
  return {
    id: revision.id,
    version: revision.version,
    createdAt: revision.createdAt,
    createdBy: revision.createdBy,
  };
}

export function CampaignRevisions({ campaignId, canCreate }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [selectedRevisionId, setSelectedRevisionId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadRevisions = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await getRevisionsRequest(campaignId);
      setRevisions(data.revisions);
    } catch (requestError) {
      setLoadError(getErrorMessage(requestError, "No se pudieron cargar las revisiones"));
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  async function createRevision() {
    if (!window.confirm(
      "¿Quieres guardar una revisión inmutable del último estado guardado del borrador?",
    )) return;

    setCreating(true);
    try {
      const { data } = await createRevisionRequest(campaignId);
      setRevisions((current) => [
        revisionSummary(data.revision),
        ...current.filter((revision) => revision.id !== data.revision.id),
      ]);
      setSelectedRevisionId(data.revision.id);
      setSelectedRevision(data.revision);
      setDetailError("");
      toast.success(data.message);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudo guardar la revisión"));
    } finally {
      setCreating(false);
    }
  }

  async function selectRevision(revisionId) {
    setSelectedRevisionId(revisionId);
    setSelectedRevision(null);
    setDetailLoading(true);
    setDetailError("");
    try {
      const { data } = await getRevisionRequest(revisionId);
      setSelectedRevision(data.revision);
    } catch (requestError) {
      setDetailError(getErrorMessage(requestError, "No se pudo cargar la revisión"));
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6"
      aria-labelledby="campaign-revisions-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="campaign-revisions-title" className="text-lg font-semibold text-zinc-950">
            Revisiones
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Snapshots inmutables del último estado guardado del borrador.
          </p>
        </div>
        {canCreate && (
          <Button type="button" loading={creating} onClick={createRevision}>
            Guardar revisión
          </Button>
        )}
      </div>

      {canCreate && (
        <p className="mt-3 text-xs leading-5 text-zinc-600">
          Guarda antes cualquier cambio pendiente del HTML. La revisión no podrá editarse.
        </p>
      )}

      {loading ? (
        <div className="mt-5"><Spinner label="Cargando revisiones..." /></div>
      ) : loadError ? (
        <Alert tone="error" className="mt-5">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <Button type="button" variant="secondary" onClick={loadRevisions}>Reintentar</Button>
          </div>
        </Alert>
      ) : revisions.length === 0 ? (
        <Alert className="mt-5">Todavía no hay revisiones guardadas.</Alert>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Histórico</h3>
            <ol className="mt-3 space-y-2" aria-label="Histórico de revisiones">
              {revisions.map((revision) => {
                const isSelected = selectedRevisionId === revision.id;
                return (
                  <li key={revision.id}>
                    <button
                      type="button"
                      className={`focus-ring w-full rounded-xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                      aria-pressed={isSelected}
                      onClick={() => selectRevision(revision.id)}
                    >
                      <span className="block font-bold text-zinc-950">v{revision.version}</span>
                      <span className="mt-1 block text-xs text-zinc-600">
                        {formatDate(revision.createdAt)}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-zinc-700">
                        {authorName(revision.createdBy)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="min-w-0">
            {detailLoading ? (
              <Spinner label="Cargando revisión..." />
            ) : detailError ? (
              <Alert tone="error">{detailError}</Alert>
            ) : selectedRevision ? (
              <article className="space-y-5" aria-labelledby="selected-revision-title">
                <header>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 id="selected-revision-title" className="text-xl font-bold text-zinc-950">
                      Revisión {selectedRevision.version}
                    </h3>
                    <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      Solo lectura
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    Guardada por {authorName(selectedRevision.createdBy)} · {formatDate(selectedRevision.createdAt)}
                  </p>
                  <p className="mt-1 break-all text-xs text-zinc-500">
                    SHA-256: <code>{selectedRevision.contentHash}</code>
                  </p>
                </header>

                <div className="grid gap-5 2xl:grid-cols-2">
                  <Textarea
                    id={`revision-${selectedRevision.id}-corrected-html`}
                    label="HTML corregido guardado"
                    value={selectedRevision.htmlCorrected}
                    readOnly
                    spellCheck="false"
                    hint="Snapshot histórico inmutable."
                  />
                  <EmailPreview html={selectedRevision.htmlCorrected} />
                </div>

                <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <summary className="focus-ring cursor-pointer rounded font-semibold text-zinc-800">
                    Ver HTML original del snapshot
                  </summary>
                  <Textarea
                    id={`revision-${selectedRevision.id}-original-html`}
                    label="HTML original guardado"
                    value={selectedRevision.htmlOriginal}
                    readOnly
                    spellCheck="false"
                    className="mt-4"
                  />
                </details>
              </article>
            ) : (
              <Alert>Selecciona una revisión para consultar su snapshot.</Alert>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
