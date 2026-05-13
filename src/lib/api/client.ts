export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  '';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    this.fieldErrors = parseValidationFieldErrors(details);
  }
}

function parseValidationFieldErrors(details: unknown): Record<string, string[]> {
  if (!details || typeof details !== 'object') return {};

  const payload = details as Record<string, unknown>;
  const candidates = [
    payload.errors,
    payload.fieldErrors,
    payload.validationErrors,
    payload.violations,
    payload.data && typeof payload.data === 'object' ? (payload.data as Record<string, unknown>).errors : undefined,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (Array.isArray(candidate)) {
      const mapped = mapValidationArray(candidate);
      if (Object.keys(mapped).length > 0) return mapped;
      continue;
    }
    if (typeof candidate !== 'object') continue;
    const mapped: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(candidate as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        const messages = value.filter((item): item is string => typeof item === 'string');
        if (messages.length) mapped[key] = messages;
      } else if (typeof value === 'string') {
        mapped[key] = [value];
      }
    }
    if (Object.keys(mapped).length > 0) return mapped;
  }

  return {};
}

function mapValidationArray(candidate: unknown[]): Record<string, string[]> {
  const mapped: Record<string, string[]> = {};
  for (const item of candidate) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const key = [row.field, row.path, row.param, row.name].find((value): value is string => typeof value === 'string');
    const message = [row.message, row.msg, row.error].find((value): value is string => typeof value === 'string');
    if (!key || !message) continue;
    if (!mapped[key]) mapped[key] = [];
    mapped[key].push(message);
  }
  return mapped;
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
