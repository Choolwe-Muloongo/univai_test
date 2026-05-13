import type { LearningObject, LearningObjectType, ReviewStatus } from '@/lib/schemas';

interface DraftLearningObjectParams {
  type: LearningObjectType;
  title: string;
  content: string;
  prompt: string;
  generatorFlow: string;
  model?: string;
  generatedBy?: string;
  sourceMaterial?: string;
  programmeContent?: boolean;
}

interface ReviewLearningObjectParams {
  learningObject: LearningObject;
  reviewerIdentity: string;
  notes?: string;
}

const DEFAULT_MODEL = 'configured-genkit-model';

function summarizeSourceMaterial(sourceMaterial?: string) {
  if (!sourceMaterial?.trim()) return undefined;
  const normalized = sourceMaterial.replace(/\s+/g, ' ').trim();
  return normalized.length > 280 ? `${normalized.slice(0, 277)}...` : normalized;
}

function createLearningObjectId(type: LearningObjectType) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `lo_${type.toLowerCase()}_${Date.now()}_${randomPart}`;
}

export function createDraftLearningObject({
  type,
  title,
  content,
  prompt,
  generatorFlow,
  model = DEFAULT_MODEL,
  generatedBy = 'ai-content-factory',
  sourceMaterial,
  programmeContent = false,
}: DraftLearningObjectParams): LearningObject {
  const now = new Date().toISOString();
  const requiresHumanApproval = programmeContent;

  return {
    type,
    title,
    content,
    generationMetadata: {
      id: createLearningObjectId(type),
      generatedAt: now,
      generatedBy,
      generatorFlow,
      model,
      prompt,
      sourceMaterialSummary: summarizeSourceMaterial(sourceMaterial),
      programmeContent,
      humanApprovalRequired: requiresHumanApproval,
    },
    reviewStatus: requiresHumanApproval ? 'pending_review' : 'draft',
    reviewerIdentity: null,
    version: 1,
    approvalHistory: [],
    publishedAt: null,
  };
}

export function reviewLearningObject(
  status: Extract<ReviewStatus, 'approved' | 'changes_requested' | 'rejected'>,
  { learningObject, reviewerIdentity, notes }: ReviewLearningObjectParams
): LearningObject {
  const now = new Date().toISOString();

  return {
    ...learningObject,
    reviewStatus: status,
    reviewerIdentity,
    approvalHistory: [
      ...learningObject.approvalHistory,
      {
        status,
        reviewerIdentity,
        reviewedAt: now,
        notes,
        version: learningObject.version,
      },
    ],
  };
}

export function publishLearningObject({
  learningObject,
  reviewerIdentity,
  notes,
}: ReviewLearningObjectParams): LearningObject {
  if (learningObject.generationMetadata.humanApprovalRequired && learningObject.reviewStatus !== 'approved') {
    throw new Error('Human approval is required before publishing formal programme content.');
  }

  const now = new Date().toISOString();
  return {
    ...learningObject,
    reviewStatus: 'published',
    reviewerIdentity,
    publishedAt: now,
    approvalHistory: [
      ...learningObject.approvalHistory,
      {
        status: 'published',
        reviewerIdentity,
        reviewedAt: now,
        notes,
        version: learningObject.version,
      },
    ],
  };
}

export function reviseLearningObject(
  learningObject: LearningObject,
  content: string,
  reviewerIdentity: string,
  notes?: string
): LearningObject {
  return {
    ...learningObject,
    content,
    version: learningObject.version + 1,
    reviewStatus: learningObject.generationMetadata.humanApprovalRequired ? 'pending_review' : 'draft',
    reviewerIdentity,
    approvalHistory: [
      ...learningObject.approvalHistory,
      {
        status: 'changes_requested',
        reviewerIdentity,
        reviewedAt: new Date().toISOString(),
        notes,
        version: learningObject.version,
      },
    ],
    publishedAt: null,
  };
}
