export function takeTokenFromHash() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("token") || "";
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  return token;
}
