const CACHE_NAME = 'breathe-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './inhale.aac',
  './exhale.aac',
  './pause.aac',
  './icon-192.png',
  './icon-512.png'
];

// Sab assets ko install phase mein save karna
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // {cache: 'only-if-cached'} wala masla khatam karne ke liye simple addAll
      return cache.addAll(ASSETS);
    })
  );
});

// Offline hone par cache se file uthana
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Agar cache mein hai to wahi de do, warna network se lo
      return response || fetch(event.request);
    })
  );
});