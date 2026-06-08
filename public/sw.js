const CACHE_NAME = "hours-cache-v1";
const STATIC_ASSETS = [
	"/",
	"/offline.html",
	"/favicon.ico",
	"/favicon.svg",
	"/icon-192.png",
	"/icon-512.png",
	"/maskable-icon-192.png",
	"/maskable-icon-512.png",
	"/apple-touch-icon.png",
	"/og-image.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(STATIC_ASSETS))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const request = event.request;

	if (request.method !== "GET") {
		return;
	}

	const url = new URL(request.url);

	if (url.origin !== self.location.origin) {
		return;
	}

	if (request.mode === "navigate") {
		event.respondWith(networkFirstNavigation(request));
		return;
	}

	if (isStaticAsset(url)) {
		event.respondWith(cacheFirst(request));
	}
});

async function networkFirstNavigation(request) {
	const cache = await caches.open(CACHE_NAME);

	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		return (await cache.match(request)) || (await cache.match("/")) || (await cache.match("/offline.html"));
	}
}

async function cacheFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	const response = await fetch(request);
	if (response.ok) {
		cache.put(request, response.clone());
	}
	return response;
}

function isStaticAsset(url) {
	return (
		url.pathname.startsWith("/_next/static/") ||
		url.pathname.startsWith("/_next/image") ||
		/\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname)
	);
}

self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SHOW_NOTIFICATION") {
		const { title, options } = event.data;
		event.waitUntil(self.registration.showNotification(title, options));
	}
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	event.waitUntil(
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (client.url === "/" && "focus" in client) {
					return client.focus();
				}
			}
			if (self.clients.openWindow) {
				return self.clients.openWindow("/");
			}
		}),
	);
});
