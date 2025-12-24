/**
 * Deskbot Service Worker
 * 
 * Handles caching of static assets for offline PWA functionality.
 * Does NOT cache API calls to ensure fresh data from the backend.
 */

// Cache version - increment to force cache update
const CACHE_VERSION = 'deskbot-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png'
];

// API endpoints that should NEVER be cached
// NOTE: Update this array when adding new API endpoints to the worker
const API_ENDPOINTS = [
  '/api/deskbot/turn'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // Activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_VERSION)
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve from cache for static assets, network for API calls
 */
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Check if this is an API call
  const isApiCall = API_ENDPOINTS.some(endpoint => 
    requestUrl.pathname.startsWith(endpoint)
  );
  
  // Never cache API calls - always go to network
  if (isApiCall) {
    console.log('[Service Worker] API call - bypassing cache:', requestUrl.pathname);
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', requestUrl.pathname);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        console.log('[Service Worker] Fetching from network:', requestUrl.pathname);
        return fetch(event.request)
          .then((response) => {
            // Only cache successful responses for same-origin requests
            if (response.status === 200 && requestUrl.origin === location.origin) {
              const responseToCache = response.clone();
              caches.open(CACHE_VERSION)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // Could return a custom offline page here
            throw error;
          });
      })
  );
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
