import { environment } from '../../../environments/environment';

/**
 * Ensures a file URL is always absolute.
 * Relative paths like "/uploads/..." are prefixed with the backend base URL.
 * Already-absolute URLs (http/https) are returned unchanged.
 */
export function absoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Strip /api suffix to get backend origin: http://localhost:8080
  const backendOrigin = environment.apiUrl.replace(/\/api$/, '');
  return backendOrigin + (url.startsWith('/') ? url : '/' + url);
}
