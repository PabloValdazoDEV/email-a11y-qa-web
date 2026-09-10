import { z } from "zod";
import {
  DRAFT_HTML_EXTENSIONS,
  DRAFT_HTML_MAX_BYTES,
  DRAFT_HTML_MIME_TYPES,
} from "../config/draft.js";

const htmlMarkerPattern = /(?:<!doctype\s+html\b|<(?:html|head|body|table|div|p|a|img|span|section|main)\b[^>]*>)/i;

const htmlSchema = z.string().superRefine((html, context) => {
  if (html.trim().length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El HTML es obligatorio",
    });
    return;
  }
  if (new Blob([html]).size > DRAFT_HTML_MAX_BYTES) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El HTML supera el límite de 1 MiB",
    });
  }
  if (!htmlMarkerPattern.test(html)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El contenido no parece HTML válido",
    });
  }
});

export const draftHtmlSchema = z.object({ html: htmlSchema }).strict();

export function getDraftFileError(file) {
  if (!file) return "Debes seleccionar un archivo HTML";

  const dotIndex = file.name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : "";
  if (!DRAFT_HTML_EXTENSIONS.includes(extension)) {
    return "Solo se permiten archivos .html o .htm";
  }
  if (!DRAFT_HTML_MIME_TYPES.includes(file.type.toLowerCase())) {
    return "El tipo MIME del archivo no es HTML";
  }
  if (file.size === 0) return "El archivo HTML está vacío";
  if (file.size > DRAFT_HTML_MAX_BYTES) return "El archivo HTML supera el límite de 1 MiB";
  return "";
}
