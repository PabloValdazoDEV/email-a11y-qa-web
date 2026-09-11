import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { EmailPreview } from "../src/components/campaigns/EmailPreview.jsx";

const DEBOUNCE_WAIT_MS = 450;
const { act, createElement } = React;

async function withRenderedPreview(initialHtml, callback) {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" });
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousReact = globalThis.React;
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.React = React;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  const root = createRoot(dom.window.document.querySelector("#root"));
  try {
    await act(async () => root.render(createElement(EmailPreview, { html: initialHtml })));
    await callback({ dom, root });
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.navigator = previousNavigator;
    globalThis.React = previousReact;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
}

test("renders the derived HTML only inside a fully sandboxed iframe", async () => {
  await withRenderedPreview('<script>alert(1)</script><p onclick="alert(2)">Hola</p>', async ({ dom }) => {
    const iframe = dom.window.document.querySelector("iframe");

    assert.ok(iframe);
    assert.equal(iframe.getAttribute("sandbox"), "");
    assert.equal(iframe.hasAttribute("allow"), false);
    assert.equal(iframe.getAttribute("referrerpolicy"), "no-referrer");
    assert.doesNotMatch(iframe.getAttribute("srcdoc") ?? "", /<script|onclick=/i);
    assert.equal(dom.window.document.querySelector("script"), null);
  });
});

test("switches between the 680 px desktop and 375 px mobile viewports", async () => {
  await withRenderedPreview("<p>Hola</p>", async ({ dom }) => {
    const document = dom.window.document;
    const iframe = document.querySelector("iframe");
    const mobileButton = [...document.querySelectorAll("button")]
      .find((button) => button.textContent.trim() === "Móvil");

    assert.match(iframe.parentElement.className, /w-\[680px\]/);
    await act(async () => {
      mobileButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
    assert.match(iframe.parentElement.className, /w-\[375px\]/);
    assert.match(iframe.title, /móvil/);
  });
});

test("updates the preview after its debounce without persisting or executing the HTML", async () => {
  await withRenderedPreview("<p>Primera versión</p>", async ({ dom, root }) => {
    const iframe = dom.window.document.querySelector("iframe");
    const firstDocument = iframe.getAttribute("srcdoc");

    await act(async () => root.render(createElement(EmailPreview, {
      html: "<p>Segunda versión</p>",
    })));
    assert.equal(iframe.getAttribute("srcdoc"), firstDocument);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_WAIT_MS));
    });
    assert.match(iframe.getAttribute("srcdoc") ?? "", /Segunda versión/);
  });
});
