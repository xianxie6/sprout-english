// Offline cache: pages network-first, pack media cache-first (it never changes for a given file name).
const CACHE = "sprout-v1";
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const media = url.pathname.includes("/pack/") && !url.pathname.endsWith("index.json");
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      if (media) {
        const hit = await c.match(e.request);
        if (hit) return hit;
      }
      try {
        const res = await fetch(e.request);
        if (res.ok) c.put(e.request, res.clone());
        return res;
      } catch {
        return (await c.match(e.request)) || Response.error();
      }
    }),
  );
});
