const CACHE = "kanji-note-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("kanji-note-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname === "/share" ||
    event.request.headers.has("RSC")
  )
    return;
  if (
    event.request.mode === "navigate" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon.svg"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
          }
          return response;
        })
        .catch(
          async () =>
            (await caches.match(event.request)) ||
            (event.request.mode === "navigate" ? await caches.match("/") : null) ||
            new Response("Offline", { status: 503 }),
        ),
    );
  }
});
