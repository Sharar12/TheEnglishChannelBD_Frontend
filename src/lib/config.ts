// ============================================================
// Central backend configuration — change URL in .env.local only
// ============================================================

// Backend base URL (no trailing slash)
const BACKEND_URL =
  (typeof process !== 'undefined' && (process as any).env?.BACKEND_URL) ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:8001';

// API base URL (for client-side fetch via Next.js rewrite proxy, use '/api')
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Storage base URL for public assets (images, avatars, etc.)
export const STORAGE_URL =
  (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_STORAGE_BASE) ||
  `${BACKEND_URL}/storage`;

// Laravel API URL for server-side requests (API routes, server actions)
export const LARAVEL_API = process.env.LARAVEL_API_URL || `${BACKEND_URL}/api`;

// The raw backend URL for cases like next.config.ts image patterns
export { BACKEND_URL };

// --------------- Helper functions ---------------

/** Build a full storage URL from a relative path. Returns absolute URLs unchanged. */
export function storageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = STORAGE_URL.endsWith('/') ? STORAGE_URL.slice(0, -1) : STORAGE_URL;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${clean}`;
}

/** Build a video stream URL from a storage path or relative path. */
export function videoStreamUrl(path: string | null | undefined): string {
  if (!path) return '';
  // If it's a full URL, extract the storage portion
  if (path.startsWith('http')) {
    const match = path.match(/\/storage\/(.+)/);
    if (match) {
      const cleanPath = match[1].replace(/^courses\/videos\//, '');
      return `${BACKEND_URL}/api/video/stream/${cleanPath}`;
    }
    return path; // YouTube/external URLs pass through
  }
  const cleanPath = path.replace(/^storage\//, '').replace(/^courses\/videos\//, '');
  return `${BACKEND_URL}/api/video/stream/${cleanPath}`;
}
