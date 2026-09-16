const VERSION = 'any-v27';

const CORE = [
    __PRECACHE_LIST__
];

const FONT_CSS = [
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0',
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap'
];

function cacheFont(cssUrl) {
    return fetch(cssUrl)
        .then(r => r.text())
        .then(css => {
            const urls = [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1]))];
            return urls.length ? caches.open(VERSION).then(c => c.addAll(urls)) : null;
        })
        .catch(() => null);
}

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(VERSION)
            .then(c => c.addAll(CORE))
            .then(() => Promise.all(FONT_CSS.map(cacheFont)))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    if (url.origin === location.origin) {
        if (req.mode === 'navigate') {
            e.respondWith(
                fetch(req)
                    .then(res => {
                        if (res.ok) {
                            const copy = res.clone();
                            caches.open(VERSION).then(c => c.put('./index.html', copy));
                        }
                        return res;
                    })
                    .catch(() => caches.match('./index.html'))
            );
            return;
        }
        e.respondWith(
            caches.match(req).then(cached =>
                cached || fetch(req).then(res => {
                    if (res.ok) {
                        const copy = res.clone();
                        caches.open(VERSION).then(c => c.put(req, copy));
                    }
                    return res;
                })
            )
        );
        return;
    }

    e.respondWith(
        caches.match(req).then(cached =>
            cached || fetch(req).then(res => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(VERSION).then(c => c.put(req, copy));
                }
                return res;
            })
        )
    );
});