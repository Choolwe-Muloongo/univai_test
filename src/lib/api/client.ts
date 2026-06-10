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

type FetchOptions = RequestInit & { parseJson?: boolean; loadingLabel?: string; successMessage?: string };


function dispatchLoadingEvent(name: 'univai:loading-start' | 'univai:loading-end', detail: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function shouldShowSuccessToast(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function loadingLabelFor(method: string) {
  const normalized = method.toUpperCase();
  if (normalized === 'POST') return 'Saving changes...';
  if (normalized === 'PATCH' || normalized === 'PUT') return 'Updating changes...';
  if (normalized === 'DELETE') return 'Deleting item...';
  return 'Loading data...';
}

function isSilentGuestAuthCheck(path: string, status: number) {
  const normalized = path.startsWith('/api/') ? path.replace(/^\/api/, '') : path;
  return status === 401 && (normalized === '/auth/me' || normalized === 'auth/me');
}


const AFFILIATE_CODE_KEYS = ['univai.affiliate.code', 'univai.referral.code'];

function storedAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null;
  for (const key of AFFILIATE_CODE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim()) return value.trim();
  }
  return null;
}

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

function guardReviewedPublishing(path: string, body: BodyInit | null | undefined): BodyInit | null | undefined {
  const isNormalCourseSave = path === '/admin/courses' || path === '/admin/short-courses/drafts';
  const isReviewedPublish = /^\/admin\/courses\/[^/]+\/publish-reviewed$/.test(path);

  if (!isNormalCourseSave || isReviewedPublish || typeof body !== 'string') {
    return body;
  }

  try {
    const payload = JSON.parse(body) as Record<string, unknown>;

    if (path === '/admin/short-courses/drafts' && payload.course && typeof payload.course === 'object') {
      return JSON.stringify({
        ...payload,
        course: {
          ...(payload.course as Record<string, unknown>),
          status: 'draft',
        },
      });
    }

    return JSON.stringify({ ...payload, status: 'draft' });
  } catch {
    return body;
  }
}

function apiErrorMessage(status: number, details: unknown): string {
  if (!details || typeof details !== 'object') return `Request failed: ${status}`;
  const payload = details as Record<string, unknown>;
  const message = typeof payload.message === 'string' ? payload.message : `Request failed: ${status}`;
  const exception = typeof payload.exception === 'string' ? payload.exception : null;
  const file = typeof payload.file === 'string' ? payload.file : null;
  const line = typeof payload.line === 'number' || typeof payload.line === 'string' ? String(payload.line) : null;
  const location = file && line ? ` (${file}:${line})` : '';
  return exception ? `${message} - ${exception}${location}` : message;
}

function normalizeArrayEndpointPayload(path: string, payload: unknown): unknown {
  const isArrayEndpoint = path === '/schools' || path === '/courses' || path === '/programs' || path === '/programmes' || path === 'schools' || path === 'courses' || path === 'programs' || path === 'programmes';
  if (!isArrayEndpoint) return payload;
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.items, record.results, record.schools, record.courses, record.programs, record.programmes];
  const match = candidates.find(Array.isArray);
  return match ?? [];
}

export async function apiFetch<T>(
  path: string,
  { parseJson = true, headers, body, loadingLabel, successMessage, ...options }: FetchOptions = {}
): Promise<T> {
  const url = buildApiUrl(path);
  const guardedBody = guardReviewedPublishing(path, body);
  const affiliateCode = storedAffiliateCode();
  const method = options.method || 'GET';
  const loadingId = `api-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  dispatchLoadingEvent('univai:loading-start', { id: loadingId, label: loadingLabel || loadingLabelFor(method), path, method });

  try {
    const response = await fetch(url, {
      ...options,
      body: guardedBody,
      headers: {
        'Content-Type': 'application/json',
        ...(affiliateCode ? { 'X-Univai-Referral-Code': affiliateCode } : {}),
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
      const message = apiErrorMessage(response.status, details);
      if (isSilentGuestAuthCheck(path, response.status)) {
        dispatchLoadingEvent('univai:loading-end', { id: loadingId, path, method });
      } else {
        dispatchLoadingEvent('univai:loading-end', { id: loadingId, errorMessage: message, path, method });
      }
      throw new ApiError(message, response.status, details);
    }

    const completeMessage = successMessage || (shouldShowSuccessToast(method) ? 'Your change was saved successfully.' : undefined);
    dispatchLoadingEvent('univai:loading-end', { id: loadingId, successMessage: completeMessage, path, method });

    if (!parseJson) {
      return undefined as T;
    }

    const payload = await response.json();
    return normalizeArrayEndpointPayload(path, payload) as T;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      const message = error instanceof Error ? error.message : 'Network request failed.';
      dispatchLoadingEvent('univai:loading-end', { id: loadingId, errorMessage: message, path, method });
    }
    throw error;
  }
}
