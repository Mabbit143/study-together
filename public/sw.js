const CACHE = "study-together-shell-v2";
const SHELL = ["/", "/?room=old-english-demo"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(Promise.all([caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("study-together-shell-") && key !== CACHE).map((key) => caches.delete(key)))), self.clients.claim()])); });
self.addEventListener("fetch", (event) => {
  const request = event.request; const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  const navigation = request.mode === "navigate"; const staticAsset = url.pathname.startsWith("/_next/static/") || url.pathname === "/sw.js";
  if (!navigation && !staticAsset) return;
  event.respondWith((async () => { try { const response = await fetch(request); if (response.ok && response.type === "basic" && !response.headers.has("set-cookie")) { const cache = await caches.open(CACHE); await cache.put(request, response.clone()); if (navigation) { const html = await response.clone().text(); const assets = [...html.matchAll(/(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g)].map((match) => new URL(match[1], self.location.origin).href); await Promise.all([...new Set(assets)].map(async (asset) => { try { const assetResponse = await fetch(asset); if (assetResponse.ok && assetResponse.type === "basic") await cache.put(asset, assetResponse); } catch { /* A later online navigation can fill this optional asset. */ } })); } } return response; } catch { const cached = await caches.match(request); if (cached) return cached; if (navigation) return (await caches.match("/")) || Response.error(); return Response.error(); } })());
});
