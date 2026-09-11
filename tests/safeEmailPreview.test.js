import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  createSafeEmailPreview,
  EMAIL_PREVIEW_CSP,
} from "../src/utils/emailPreview.js";

function generatePreview(html) {
  const dom = new JSDOM("");
  const preview = createSafeEmailPreview(html, dom.window);
  dom.window.close();
  return preview;
}

function parsePreview(html) {
  return new JSDOM(generatePreview(html)).window.document;
}

test("wraps valid email HTML in a document with the strict preview CSP", () => {
  const document = parsePreview(`
    <table role="presentation" style="width: 100%; color: #222">
      <tr><td><h1>Hola Pablo</h1></td></tr>
    </table>
  `);

  assert.equal(
    document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content,
    EMAIL_PREVIEW_CSP,
  );
  assert.equal(document.querySelector("h1")?.textContent, "Hola Pablo");
  assert.match(document.querySelector("table")?.getAttribute("style") ?? "", /color: #222/i);
});

test("removes active elements, nested frames and forms while preserving readable text", () => {
  const document = parsePreview(`
    <script>alert(1)</script>
    <form action="https://example.com"><button>Enviar</button></form>
    <iframe src="https://example.com"></iframe>
    <object data="https://example.com/file"></object>
    <embed src="https://example.com/file">
    <meta http-equiv="refresh" content="0;url=https://example.com">
    <base href="https://example.com">
    <p>Contenido seguro</p>
  `);

  assert.equal(document.querySelector("script, form, button, iframe, object, embed, meta[http-equiv='refresh'], base"), null);
  assert.match(document.body.textContent, /Contenido seguro/);
});

test("removes inline handlers and every resource or navigation attribute", () => {
  const document = parsePreview(`
    <img src="https://example.com/tracking.gif" srcset="https://example.com/a.png 2x" onload="alert(1)" alt="Imagen">
    <a href="javascript:alert(1)" ping="https://example.com/ping" onclick="alert(1)">Click</a>
    <div onclick="alert(1)" style="color: red">Texto</div>
  `);

  const image = document.querySelector("img");
  const link = document.querySelector("a");
  const div = document.querySelector("div");
  assert.equal(image?.hasAttribute("src"), false);
  assert.equal(image?.hasAttribute("srcset"), false);
  assert.equal(image?.hasAttribute("onload"), false);
  assert.equal(link?.hasAttribute("href"), false);
  assert.equal(link?.hasAttribute("ping"), false);
  assert.equal(link?.hasAttribute("onclick"), false);
  assert.equal(div?.hasAttribute("onclick"), false);
  assert.match(div?.getAttribute("style") ?? "", /color: red/i);
});

test("strips style blocks and CSS resource references while preserving safe inline styles", () => {
  const preview = generatePreview(`
    <style>
      @import url("https://example.com/email.css");
      .hero { color: blue; background-image: url(https://example.com/hero.png); }
    </style>
    <div class="hero" style="color: red; background: url('https://example.com/pixel.gif')">Hola</div>
  `);

  assert.doesNotMatch(preview, /example\.com/i);
  assert.doesNotMatch(preview, /\.hero \{/i);
  assert.match(preview, /color: red/i);
});

test("does not mutate the supplied HTML while deriving the preview", () => {
  const htmlCurrent = '<div style="color: green"><strong>Original</strong></div>';
  const untouchedCopy = htmlCurrent;

  const preview = generatePreview(htmlCurrent);

  assert.equal(htmlCurrent, untouchedCopy);
  assert.match(preview, /<strong>Original<\/strong>/);
  assert.notEqual(preview, htmlCurrent);
});
