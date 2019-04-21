const FALLBACK_HTML_URL = '/offline.html';
const FALLBACK_IMAGE_URL = '/offline.svg';

workbox.routing.setCatchHandler(({ event, request, url }) => {
  switch (request.destination) {
    case 'document':
      return caches.match(FALLBACK_HTML_URL);
      break;

    case 'image':
      return caches.match(FALLBACK_IMAGE_URL);
      break;

    default:
      return Response.error();
  }
});

workbox.routing.setDefaultHandler(workbox.strategies.staleWhileRevalidate());
