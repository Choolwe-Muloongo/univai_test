export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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

export async function apiFetch<T>(
  path: string,
  { parseJson = true, headers, ...options }: FetchOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let cookieHeader: string | undefined;
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      cookieHeader = cookieStore.toString();
    } catch (error) {
      cookieHeader = undefined;
      void error;
    }
  }
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(headers || {}),
    },
    credentials: 'include',
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
