'use strict';
const CACHE = 'beyondbeams-shell-v11';
const SHELL = ['/', '/sign-in', '/agents', '/dashboard', '/cases/new', '/review', '/admin/audit', '/legal/privacy', '/legal/cookies', '/legal/terms', '/style.css', '/app.js', '/manifest.webmanifest', '/favicon.svg', '/logo.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method === 'GET' && url.origin === self.location.origin && SHELL.includes(url.pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});
