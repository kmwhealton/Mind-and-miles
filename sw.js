const CACHE = "mind-miles-static-2";
const LOCAL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const CDN = [
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await c.addAll(LOCAL);
      // cache.put accepts opaque cross-origin responses; cache.add does not
      await Promise.all(
        CDN.map((u) =>
          fetch(new Request(u, { mode: "no-cors" }))
            .then((res) => c.put(u, res))
            .catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  let sameOrigin = true;
  try {
    sameOrigin = new URL(e.request.url).origin === self.location.origin;
  } catch (err) {}
  if (sameOrigin) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(e.request).then((hit) => hit || caches.match("./index.html"))
        )
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((hit) => {
        if (hit) return hit;
        return fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        });
      })
    );
  }
});
