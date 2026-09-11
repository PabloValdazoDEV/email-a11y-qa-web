import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { api } from "../src/api/api.js";
import { CampaignRevisions } from "../src/components/campaigns/CampaignRevisions.jsx";

const campaignId = "77777777-7777-4777-8777-777777777777";
const revisionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const correctedHtml = "<p>HTML corregido</p>";
const originalHtml = "<p>HTML original</p>";
const { act, createElement } = React;

function axiosResponse(config, data, status = 200) {
  return { config, data, status, statusText: "OK", headers: {}, request: {} };
}

function summary(version = 1) {
  return {
    id: revisionId,
    version,
    createdAt: "2026-09-11T12:00:00.000Z",
    createdBy: { id: "user-1", name: "Pablo", lastName: "Valdazo" },
  };
}

function detail(version = 1) {
  return {
    ...summary(version),
    campaignId,
    htmlOriginal: originalHtml,
    htmlCorrected: correctedHtml,
    contentHash: "a".repeat(64),
    createdByUserId: "user-1",
  };
}

async function waitFor(condition, message) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (condition()) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
  assert.fail(message);
}

async function withRenderedRevisions({ canCreate, adapter }, callback) {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" });
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousReact = globalThis.React;
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  const previousAdapter = api.defaults.adapter;

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.React = React;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  api.defaults.adapter = adapter;

  const root = createRoot(dom.window.document.querySelector("#root"));
  try {
    await act(async () => root.render(createElement(CampaignRevisions, {
      campaignId,
      canCreate,
    })));
    await callback({ dom, root });
  } finally {
    await act(async () => root.unmount());
    api.defaults.adapter = previousAdapter;
    dom.window.close();
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.navigator = previousNavigator;
    globalThis.React = previousReact;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
}

test("shows an empty history without exposing the create action to VIEWER", async () => {
  const adapter = async (config) => axiosResponse(config, { revisions: [] });

  await withRenderedRevisions({ canCreate: false, adapter }, async ({ dom }) => {
    const document = dom.window.document;
    await waitFor(
      () => document.body.textContent.includes("Todavía no hay revisiones guardadas"),
      "The empty state was not rendered",
    );

    assert.equal(
      [...document.querySelectorAll("button")]
        .some((button) => button.textContent.includes("Guardar revisión")),
      false,
    );
  });
});

test("lists the history and opens a Revision as readonly with the safe preview", async () => {
  const calls = [];
  const adapter = async (config) => {
    calls.push(`${config.method}:${config.url}`);
    if (config.url.endsWith("/revisions/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")) {
      return axiosResponse(config, { revision: detail(2) });
    }
    return axiosResponse(config, {
      revisions: [summary(2), { ...summary(1), id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }],
    });
  };

  await withRenderedRevisions({ canCreate: true, adapter }, async ({ dom }) => {
    const document = dom.window.document;
    await waitFor(
      () => document.body.textContent.includes("v2"),
      "The revision history was not rendered",
    );

    const versionButton = [...document.querySelectorAll("button")]
      .find((button) => button.textContent.includes("v2"));
    await act(async () => {
      versionButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
    await waitFor(
      () => document.body.textContent.includes("Revisión 2"),
      "The revision detail was not rendered",
    );

    const textareas = [...document.querySelectorAll("textarea")];
    const iframe = document.querySelector("iframe");
    assert.equal(textareas.length, 2);
    assert.ok(textareas.every((textarea) => textarea.readOnly));
    assert.equal(textareas[0].value, correctedHtml);
    assert.match(document.body.textContent, /Solo lectura/);
    assert.equal(iframe.getAttribute("sandbox"), "");
    assert.match(iframe.getAttribute("srcdoc") ?? "", /HTML corregido/);
    assert.deepEqual(calls, [
      `get:/api/v1/campaigns/${campaignId}/revisions`,
      `get:/api/v1/revisions/${revisionId}`,
    ]);
  });
});

test("creates a Revision from the backend and adds it to the history", async () => {
  const calls = [];
  const adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data });
    if (config.method === "post") {
      return axiosResponse(config, {
        message: "Revisión 1 guardada",
        revision: detail(),
      }, 201);
    }
    return axiosResponse(config, { revisions: [] });
  };

  await withRenderedRevisions({ canCreate: true, adapter }, async ({ dom }) => {
    const document = dom.window.document;
    dom.window.confirm = () => true;
    await waitFor(
      () => document.body.textContent.includes("Todavía no hay revisiones guardadas"),
      "The empty state was not rendered",
    );

    const createButton = [...document.querySelectorAll("button")]
      .find((button) => button.textContent.includes("Guardar revisión"));
    await act(async () => {
      createButton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
    await waitFor(
      () => document.body.textContent.includes("Revisión 1"),
      "The created revision was not selected",
    );

    const createCall = calls.find((call) => call.method === "post");
    assert.equal(createCall.url, `/api/v1/campaigns/${campaignId}/revisions`);
    assert.equal(createCall.data, "{}");
    assert.match(document.body.textContent, /Solo lectura/);
    assert.match(document.body.textContent, /v1/);
  });
});

test("renders a controlled load error with a retry action", async () => {
  const adapter = async (config) => {
    const error = new Error("Request failed");
    error.config = config;
    error.response = { status: 500, data: { message: "Fallo controlado" } };
    throw error;
  };

  await withRenderedRevisions({ canCreate: true, adapter }, async ({ dom }) => {
    const document = dom.window.document;
    await waitFor(
      () => document.body.textContent.includes("Fallo controlado"),
      "The error state was not rendered",
    );

    assert.ok([...document.querySelectorAll("button")]
      .some((button) => button.textContent.includes("Reintentar")));
  });
});
