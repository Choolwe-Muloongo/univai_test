export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  '';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type FetchOptions = RequestInit & { parseJson?: boolean };

export function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanBase = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseIncludesApi = cleanBase === '/api' || cleanBase.endsWith('/api');
  const pathIncludesApi = cleanPath === '/api' || cleanPath.startsWith('/api/');
  const apiPath = pathIncludesApi ? cleanPath : `/api${cleanPath}`;

  if (baseIncludesApi && pathIncludesApi) {
    return `${cleanBase}${cleanPath.replace(/^\/api/, '') || ''}`;
  }

  if (baseIncludesApi) {
    return `${cleanBase}${cleanPath}`;
  }

  return `${cleanBase}${apiPath}`;
}

export async function apiFetch<T>(
  path: string,
  { parseJson = true, headers, ...options }: FetchOptions = {}
): Promise<T> {
  const url = buildApiUrl(path);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch (error) {
      details = null;
      void error;
    }
    throw new ApiError(`Request failed: ${response.status}`, response.status, details);
  }

  if (!parseJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
