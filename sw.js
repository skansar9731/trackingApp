self.addEventListener('install', () => console.log('SW installed'));
self.addEventListener('activate', () => console.log('SW active'));
self.addEventListener('fetch', () => {});