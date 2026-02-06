export type AdmissionStatus = {
  status: string;
  admissionFeePaid: boolean;
};

export type ApplicationPayload = {
  fullName: string;
  email: string;
  programId: string;
  schoolId: string;
  deliveryMode: string;
  learningStyle: string;
  studyPace: string;
  country: string;
  subjectPoints: Record<string, string>;
};

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'fee_paid'
  | 'under_review'
  | 'needs_info'
  | 'approved'
  | 'rejected'
  | 'admitted';

export type ApplicationSummary = {
  id: string;
  fullName: string;
  email: string;
  programId: string;
  schoolId: string;
  status: ApplicationStatus;
  submittedAt: string;
  subjectCount: number;
  totalPoints: number;
};

export type ApplicationDetail = ApplicationSummary & {
  deliveryMode: string;
  learningStyle: string;
  studyPace: string;
  country: string;
  subjectPoints: Record<string, string>;
  notes?: string;
};

export type CreateJobPayload = {
  title: string;
  company: string;
  location: string;
  type: string;
  description?: string;
};

export type CreateResearchPayload = {
  title: string;
  company: string;
  field: string;
  description: string;
};

export type CreateDiscussionPayload = {
  title: string;
  category?: string;
  details: string;
};

export type JobApplicationPayload = {
  fullName: string;
  email: string;
  portfolio?: string;
  coverLetter?: string;
};

export type ResearchApplicationPayload = {
  fullName: string;
  email: string;
  experience?: string;
  availability?: string;
};
