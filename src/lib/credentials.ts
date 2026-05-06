export type CredentialType =
  | 'short_course_certificate'
  | 'professional_certificate'
  | 'diploma'
  | 'degree'
  | 'transcript'
  | 'statement_of_results'
  | 'postgraduate_credential';

export type CredentialStatus = 'issued' | 'pending' | 'expired' | 'revoked';

export type CredentialAuditEvent = {
  id: string;
  action: 'created' | 'issued' | 'viewed' | 'verified' | 'revoked' | 'updated';
  actor: string;
  createdAt: string;
  note?: string | null;
};

export type CredentialRecord = {
  id: string;
  publicId: string;
  type: CredentialType;
  status: CredentialStatus;
  title: string;
  recipientName: string;
  recipientId?: string | null;
  programName?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  score?: number | null;
  gradePointAverage?: number | null;
  creditsEarned?: number | null;
  verificationPath: string;
  revokedAt?: string | null;
  revokedReason?: string | null;
  auditHistory: CredentialAuditEvent[];
  metadata?: Record<string, unknown>;
};

export type CredentialVerificationResult = {
  isValid: boolean;
  credential: CredentialRecord | null;
  checkedAt: string;
  message: string;
};

type LegacyExamResult = {
  courseTitle?: string;
  studentName?: string;
  completedAt?: string;
  score?: number;
  status?: string;
  resultStatus?: string;
  publicId?: string;
  credentialType?: CredentialType;
};

const credentialTypeLabels: Record<CredentialType, string> = {
  short_course_certificate: 'Short-course certificate',
  professional_certificate: 'Professional certificate',
  diploma: 'Diploma',
  degree: 'Degree',
  transcript: 'Transcript',
  statement_of_results: 'Statement of results',
  postgraduate_credential: 'Postgraduate credential',
};

const statusLabels: Record<CredentialStatus, string> = {
  issued: 'Issued',
  pending: 'Pending issue',
  expired: 'Expired',
  revoked: 'Revoked',
};

export function getCredentialTypeLabel(type: CredentialType) {
  return credentialTypeLabels[type];
}

export function getCredentialStatusLabel(status: CredentialStatus) {
  return statusLabels[status];
}

export function buildCredentialPublicId(sourceId: string, type: CredentialType = 'short_course_certificate') {
  const prefixByType: Record<CredentialType, string> = {
    short_course_certificate: 'SCC',
    professional_certificate: 'PC',
    diploma: 'DIP',
    degree: 'DEG',
    transcript: 'TRN',
    statement_of_results: 'SOR',
    postgraduate_credential: 'PG',
  };
  const compactId = sourceId.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 10) || 'PENDING';

  return `UAI-${prefixByType[type]}-${compactId}`;
}

export function buildCredentialVerificationPath(publicId: string) {
  return `/verify/${encodeURIComponent(publicId)}`;
}

export function buildCredentialVerificationUrl(publicId: string, origin = '') {
  const path = buildCredentialVerificationPath(publicId);
  return origin ? `${origin.replace(/\/$/, '')}${path}` : path;
}

export function buildCredentialQrCodeUrl(verificationUrl: string, size = 160) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(verificationUrl)}`;
}

export function isCredentialRecord(value: unknown): value is CredentialRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<CredentialRecord>;
  return Boolean(candidate.publicId && candidate.title && candidate.recipientName && candidate.status && candidate.type);
}

function normalizeStatus(status?: string): CredentialStatus {
  if (status === 'revoked' || status === 'pending' || status === 'expired') {
    return status;
  }

  return 'issued';
}

export function credentialFromExamResult(id: string, result: LegacyExamResult): CredentialRecord {
  const type = result.credentialType ?? 'short_course_certificate';
  const publicId = result.publicId ?? buildCredentialPublicId(id, type);
  const issuedAt = result.completedAt ?? new Date().toISOString();
  const status = normalizeStatus(result.status ?? result.resultStatus);

  return {
    id,
    publicId,
    type,
    status,
    title: result.courseTitle ?? 'Completed course',
    recipientName: result.studentName ?? 'Student',
    issuedAt,
    score: typeof result.score === 'number' ? result.score : null,
    verificationPath: buildCredentialVerificationPath(publicId),
    revokedAt: status === 'revoked' ? issuedAt : null,
    revokedReason: status === 'revoked' ? 'Revoked by registry administrator.' : null,
    auditHistory: [
      {
        id: `${publicId}-created`,
        action: 'created',
        actor: 'UnivAI Registry',
        createdAt: issuedAt,
        note: 'Credential record created from completed assessment results.',
      },
      {
        id: `${publicId}-issued`,
        action: 'issued',
        actor: 'Academic Office',
        createdAt: issuedAt,
        note: 'Public verification ID, verification URL, and QR code generated.',
      },
    ],
    metadata: {
      source: 'exam_results',
      legacyCertificateId: id,
    },
  };
}

export function normalizeCredentials(payload: unknown): CredentialRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isCredentialRecord).map((credential) => ({
      ...credential,
      verificationPath: credential.verificationPath || buildCredentialVerificationPath(credential.publicId),
      auditHistory: credential.auditHistory ?? [],
    }));
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  return Object.entries(payload as Record<string, unknown>).map(([id, value]) => {
    if (isCredentialRecord(value)) {
      return {
        ...value,
        id: value.id || id,
        verificationPath: value.verificationPath || buildCredentialVerificationPath(value.publicId),
        auditHistory: value.auditHistory ?? [],
      };
    }

    return credentialFromExamResult(id, value as LegacyExamResult);
  });
}

export function findCredentialByIdOrPublicId(credentials: CredentialRecord[], id: string) {
  const decodedId = decodeURIComponent(id);
  return credentials.find(
    (credential) => credential.id === decodedId || credential.publicId.toLowerCase() === decodedId.toLowerCase(),
  ) ?? null;
}
