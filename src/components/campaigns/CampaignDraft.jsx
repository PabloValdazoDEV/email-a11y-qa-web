import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  getDraftRequest,
  importDraftRequest,
  replaceDraftRequest,
  updateDraftRequest,
} from "../../api/drafts.js";
import { DRAFT_HTML_ACCEPT } from "../../config/draft.js";
import { draftHtmlSchema, getDraftFileError } from "../../utils/draftValidation.js";
import { getErrorMessage } from "../../utils/errors.js";
import { Alert } from "../ui/Alert.jsx";
import { Button } from "../ui/Button.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { Textarea } from "../ui/Textarea.jsx";
import { EmailPreview } from "./EmailPreview.jsx";

export function CampaignDraft({ campaignId, canEdit }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(draftHtmlSchema),
    defaultValues: { html: "" },
  });
  const isTextMode = ["paste", "edit", "replace"].includes(mode);
  const previewHtml = isTextMode ? watch("html") : draft?.htmlCurrent ?? "";

  const loadDraft = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await getDraftRequest(campaignId);
      setDraft(data.draft);
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setDraft(null);
      } else {
        setLoadError(getErrorMessage(requestError, "No se pudo cargar el borrador"));
      }
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  function beginTextMode(nextMode) {
    reset({ html: nextMode === "edit" ? draft.htmlCurrent : "" });
    setMode(nextMode);
  }

  function beginUpload() {
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMode("upload");
  }

  function cancelAction() {
    reset({ html: "" });
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMode(null);
  }

  async function saveText(values) {
    try {
      const response = mode === "edit"
        ? await updateDraftRequest(campaignId, values.html)
        : await replaceDraftRequest(campaignId, values.html);
      setDraft(response.data.draft);
      setMode(null);
      toast.success(response.data.message);
    } catch (requestError) {
      setError("root", {
        message: getErrorMessage(requestError, "No se pudo guardar el borrador"),
      });
    }
  }

  function selectFile(event) {
    const file = event.target.files?.[0] ?? null;
    const validationError = getDraftFileError(file);
    setFileError(validationError);
    setSelectedFile(validationError ? null : file);
  }

  async function importFile(event) {
    event.preventDefault();
    const validationError = getDraftFileError(selectedFile);
    if (validationError) {
      setFileError(validationError);
      return;
    }

    setImporting(true);
    setFileError("");
    try {
      const { data } = await importDraftRequest(campaignId, selectedFile);
      setDraft(data.draft);
      setMode(null);
      setSelectedFile(null);
      toast.success(data.message);
    } catch (requestError) {
      setFileError(getErrorMessage(requestError, "No se pudo importar el archivo HTML"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6"
      aria-labelledby="campaign-email-title"
    >
      <h2 id="campaign-email-title" className="text-lg font-semibold text-zinc-950">
        Email
      </h2>

      {loading ? (
        <div className="mt-4"><Spinner label="Cargando borrador..." /></div>
      ) : loadError ? (
        <Alert tone="error" className="mt-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <Button type="button" variant="secondary" onClick={loadDraft}>Reintentar</Button>
          </div>
        </Alert>
      ) : (
        <>
          {draft ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm font-semibold text-emerald-700">Borrador guardado</p>
              {mode !== "edit" && mode !== "replace" && (
                <div className="grid gap-5 2xl:grid-cols-2">
                  <Textarea
                    id="saved-draft-html"
                    label="HTML actual"
                    value={draft.htmlCurrent}
                    readOnly
                    spellCheck="false"
                    hint="El código se muestra como texto y no se ejecuta."
                  />
                  <EmailPreview html={previewHtml} />
                </div>
              )}
            </div>
          ) : (
            <Alert className="mt-4">Todavía no has añadido ningún HTML.</Alert>
          )}

          {canEdit && !mode && (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {draft ? (
                <>
                  <Button type="button" onClick={() => beginTextMode("edit")}>
                    Editar HTML
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => beginTextMode("replace")}>
                    Sustituir HTML
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => beginTextMode("paste")}>
                  Pegar HTML
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={beginUpload}>
                Subir archivo HTML
              </Button>
            </div>
          )}

          {canEdit && isTextMode && (
            <form onSubmit={handleSubmit(saveText)} className="mt-5 space-y-4" noValidate>
              {errors.root && <Alert tone="error">{errors.root.message}</Alert>}
              <div className="grid gap-5 2xl:grid-cols-2">
                <Textarea
                  id="draft-html"
                  label="HTML del email"
                  registration={register("html")}
                  error={errors.html}
                  disabled={isSubmitting}
                  spellCheck="false"
                  hint="Máximo 1 MiB. El contenido se guardará sin ejecutarse ni corregirse."
                />
                <EmailPreview html={previewHtml} />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={cancelAction} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  {mode === "edit" ? "Guardar cambios" : "Guardar borrador"}
                </Button>
              </div>
            </form>
          )}

          {canEdit && mode === "upload" && (
            <form onSubmit={importFile} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="draft-html-file" className="mb-1.5 block text-sm font-medium text-zinc-800">
                  Archivo HTML
                </label>
                <input
                  ref={fileInputRef}
                  id="draft-html-file"
                  type="file"
                  accept={DRAFT_HTML_ACCEPT}
                  onChange={selectFile}
                  disabled={importing}
                  aria-invalid={Boolean(fileError)}
                  aria-describedby={fileError ? "draft-html-file-error" : "draft-html-file-hint"}
                  className="focus-ring block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-800"
                />
                <p id="draft-html-file-hint" className="mt-1.5 text-xs leading-5 text-zinc-600">
                  Formatos .html y .htm. Máximo 1 MiB.
                </p>
                {selectedFile && (
                  <p className="mt-2 break-words text-sm text-zinc-700">
                    Archivo seleccionado: <strong>{selectedFile.name}</strong>
                  </p>
                )}
                {fileError && (
                  <p id="draft-html-file-error" role="alert" className="mt-1.5 text-sm text-red-700">
                    {fileError}
                  </p>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={cancelAction} disabled={importing}>
                  Cancelar
                </Button>
                <Button type="submit" loading={importing} disabled={!selectedFile}>
                  Importar HTML
                </Button>
              </div>
            </form>
          )}

          {!canEdit && !draft && (
            <p className="mt-4 text-sm text-zinc-600">
              Tu rol permite consultar borradores, pero no crear uno.
            </p>
          )}
        </>
      )}
    </section>
  );
}
