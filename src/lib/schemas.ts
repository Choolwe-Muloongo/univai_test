import { z } from 'zod';

export const LearningObjectTypeSchema = z.enum([
  'Notes',
  'Slides',
  'VideoScript',
  'Video',
  'Flashcards',
  'Quiz',
  'Assignment',
  'Rubric',
  'StudyGuide',
  'Exercise',
  'StudyPlan',
  'TutorResponse',
  'PublicNotice',
  'AdmissionsLetter',
  'Email',
  'Document',
]);
export type LearningObjectType = z.infer<typeof LearningObjectTypeSchema>;

export const ReviewStatusSchema = z.enum([
  'draft',
  'pending_review',
  'changes_requested',
  'approved',
  'rejected',
  'published',
]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const ApprovalHistoryEntrySchema = z.object({
  status: ReviewStatusSchema,
  reviewerIdentity: z.string().min(1),
  reviewedAt: z.string().datetime(),
  notes: z.string().optional(),
  version: z.number().int().positive(),
});
export type ApprovalHistoryEntry = z.infer<typeof ApprovalHistoryEntrySchema>;

export const GenerationMetadataSchema = z.object({
  id: z.string().min(1),
  generatedAt: z.string().datetime(),
  generatedBy: z.string().min(1),
  generatorFlow: z.string().min(1),
  model: z.string().min(1),
  prompt: z.string().min(1),
  sourceMaterialSummary: z.string().optional(),
  programmeContent: z.boolean(),
  humanApprovalRequired: z.boolean(),
});
export type GenerationMetadata = z.infer<typeof GenerationMetadataSchema>;

export const LearningObjectSchema = z.object({
  type: LearningObjectTypeSchema,
  title: z.string().min(1),
  content: z.string().min(1),
  generationMetadata: GenerationMetadataSchema,
  reviewStatus: ReviewStatusSchema,
  reviewerIdentity: z.string().nullable(),
  version: z.number().int().positive(),
  approvalHistory: z.array(ApprovalHistoryEntrySchema),
  publishedAt: z.string().datetime().nullable(),
});
export type LearningObject = z.infer<typeof LearningObjectSchema>;

export const GenerateContentInputSchema = z.object({
  topic: z.string().min(5, { message: 'Please provide a more detailed topic.' }),
  contentType: LearningObjectTypeSchema.extract([
    'Notes',
    'Slides',
    'VideoScript',
    'Video',
    'Flashcards',
    'Quiz',
    'Assignment',
    'Rubric',
    'StudyGuide',
    'Exercise',
    'PublicNotice',
    'AdmissionsLetter',
    'Email',
    'Document',
  ]),
  sourceMaterial: z.string().optional(),
  generatedBy: z.string().default('ai-content-factory'),
  programmeContent: z.boolean().default(false),
});
export type GenerateContentInput = z.infer<typeof GenerateContentInputSchema>;

export const GenerateContentOutputSchema = z.object({
  content: z.string(),
  learningObject: LearningObjectSchema,
});
export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;
