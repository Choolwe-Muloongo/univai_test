import { apiFetch } from '@/lib/api/client';

export type BetaReportType = 'error' | 'feature' | 'improvement' | 'other';
export type BetaReportSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BetaReportStatus = 'open' | 'reviewing' | 'planned' | 'resolved' | 'verifying' | 'verified' | 'failed_verification' | 'closed';

export type BetaReportPayload = {
  type: BetaReportType;
  source?: string;
  severity?: BetaReportSeverity;
  title: string;
  description?: string;
  pageUrl?: string;
  browser?: string;
  device?: string;
  errorName?: string;
  errorMessage?: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
};

export type BetaReportRecord = {
  id: number;
  type: BetaReportType;
  source: string;
  severity: BetaReportSeverity;
  status: BetaReportStatus;
  title: string;
  description?: string | null;
  pageUrl?: string | null;
  browser?: string | null;
  device?: string | null;
  errorName?: string | null;
  errorMessage?: string | null;
  stackTrace?: string | null;
  context?: Record<string, unknown> | null;
  verificationStatus?: 'not_run' | 'running' | 'passed' | 'failed' | null;
  verificationMessage?: string | null;
  verificationLastRunAt?: string | null;
  verificationAttempts?: number | null;
  user?: { id: number; name?: string | null; email?: string | null; role?: string | null } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdminBetaReportsResponse = {
  summary: {
    open: number;
    critical: number;
    errors: number;
    features: number;
  };
  reports: BetaReportRecord[];
};

export type VerifyAllBetaReportsResponse = {
  checked: number;
  closed: number;
  failed: number;
  skipped?: number;
  message?: string;
  reports?: BetaReportRecord[];
};

export async function submitBetaReport(payload: BetaReportPayload): Promise<{ id: number; message: string }> {
  return apiFetch('/beta-reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAdminBetaReports(params: { status?: string; type?: string } = {}): Promise<AdminBetaReportsResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.type) query.set('type', params.type);
  const qs = query.toString();
  return apiFetch(`/admin/beta-reports${qs ? `?${qs}` : ''}`);
}

export async function updateBetaReport(id: number, payload: { status: BetaReportStatus; severity?: BetaReportSeverity }): Promise<BetaReportRecord> {
  return apiFetch(`/admin/beta-reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function verifyAllBetaReports(params: { status?: string; type?: string } = {}): Promise<VerifyAllBetaReportsResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.type) query.set('type', params.type);
  const qs = query.toString();
  return apiFetch(`/admin/beta-reports/verify-all${qs ? `?${qs}` : ''}`, {
    method: 'POST',
  });
}
