import createDOMPurify from "dompurify";

export const EMAIL_PREVIEW_CSP = [
  "default-src 'none'",
  "script-src 'none'",
  "script-src-attr 'none'",
  "style-src 'unsafe-inline'",
  "img-src 'none'",
  "font-src 'none'",
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  "connect-src 'none'",
  "worker-src 'none'",
  "manifest-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

const ALLOWED_EMAIL_TAGS = [
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "b",
  "big",
  "blockquote",
  "br",
  "caption",
  "center",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "font",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "i",
  "img",
  "ins",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "s",
  "section",
  "small",
  "span",
  "strike",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

const ALLOWED_EMAIL_ATTRIBUTES = [
  "abbr",
  "align",
  "alt",
  "aria-hidden",
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
  "bgcolor",
  "border",
  "cellpadding",
  "cellspacing",
  "class",
  "colspan",
  "dir",
  "height",
  "id",
  "lang",
  "role",
  "rowspan",
  "scope",
  "style",
  "summary",
  "title",
  "valign",
  "width",
];

const RESOURCE_AND_NAVIGATION_ATTRIBUTES = new Set([
  "action",
  "archive",
  "background",
  "cite",
  "codebase",
  "data",
  "formaction",
  "href",
  "manifest",
  "ping",
  "poster",
  "src",
  "srcdoc",
  "srcset",
  "usemap",
  "xlink:href",
]);

const FORBIDDEN_ACTIVE_TAGS = [
  "applet",
  "audio",
  "base",
  "button",
  "embed",
  "fieldset",
  "form",
  "frame",
  "frameset",
  "iframe",
  "input",
  "link",
  "math",
  "meta",
  "object",
  "option",
  "optgroup",
  "script",
  "select",
  "source",
  "svg",
  "template",
  "textarea",
  "track",
  "video",
];

function stripCssResources(css = "") {
  return css
    .replace(/@import\s+(?:url\(\s*[^)]*\)|["'][^"']*["'])[^;]*;?/gi, "")
    .replace(/url\s*\(\s*[^)]*\)/gi, "none");
}

export function createSafeEmailPreview(sourceHtml, windowObject = globalThis.window) {
  if (!windowObject?.document) {
    throw new Error("Se necesita un entorno DOM para generar la preview");
  }

  const purifier = createDOMPurify(windowObject);

  purifier.addHook("uponSanitizeAttribute", (_node, hookEvent) => {
    const attributeName = hookEvent.attrName.toLowerCase();
    if (attributeName.startsWith("on") || RESOURCE_AND_NAVIGATION_ATTRIBUTES.has(attributeName)) {
      hookEvent.keepAttr = false;
      return;
    }

    if (attributeName === "style") {
      hookEvent.attrValue = stripCssResources(hookEvent.attrValue);
    }
  });

  const safeBody = purifier.sanitize(String(sourceHtml ?? ""), {
    ALLOWED_TAGS: ALLOWED_EMAIL_TAGS,
    ALLOWED_ATTR: ALLOWED_EMAIL_ATTRIBUTES,
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: FORBIDDEN_ACTIVE_TAGS,
    KEEP_CONTENT: true,
  });
  purifier.removeAllHooks();

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${EMAIL_PREVIEW_CSP}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      :root { color-scheme: light; }
      html { background: #f4f4f5; }
      body { box-sizing: border-box; min-height: 100vh; margin: 0; padding: 16px; overflow-wrap: anywhere; background: #ffffff; }
      img:not([src]) { display: inline-block; min-width: 1px; min-height: 1px; }
    </style>
  </head>
  <body>${safeBody}</body>
</html>`;
}
