import { collection, doc, getDocs, getFirestore, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

export type ResearchProfile = {
  userId: string;
  researchInterests: string[];
  researchScore: number;
  publications: number;
  projects: number;
  grants: number;
  patents: number;
  startups: number;
  currentRole: string;
};

export type ResearchProject = {
  projectId: string;
  title: string;
  abstract: string;
  category: string;
  status: string;
  principalInvestigator: string;
  researchAssistants: string[];
  budget: number;
  fundingSource: string;
  startDate: string;
  endDate: string;
  milestones: string[];
  deliverables: string[];
  partners: string[];
};

export type FundingOpportunity = {
  id: string;
  title: string;
  organization: string;
  category: string;
  deadline: string;
  amount: string;
  description: string;
  eligibility: string;
  applicationUrl: string;
};

export type Publication = {
  publicationId: string;
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  doi: string;
  publicationDate: string;
  downloads: number;
  citations: number;
};

export type LivingLab = {
  labId: string;
  name: string;
  manager: string;
  description: string;
  projects: string[];
  participants: string[];
};

export type InnovationChallenge = {
  challengeId: string;
  title: string;
  description: string;
  deadline: string;
  prizePool: string;
  participants: string[];
};

export type Startup = {
  startupId: string;
  name: string;
  founders: string[];
  industry: string;
  stage: string;
  valuation: number;
  fundingRaised: number;
};

export type ResearchPortalData = {
  profile: ResearchProfile;
  projects: ResearchProject[];
  funding: FundingOpportunity[];
  publications: Publication[];
  labs: LivingLab[];
  challenges: InnovationChallenge[];
  startups: Startup[];
};

const fallback: ResearchPortalData = {
  profile: {
    userId: 'demo',
    researchInterests: ['Artificial Intelligence', 'Education', 'Fintech'],
    researchScore: 245,
    publications: 2,
    projects: 3,
    grants: 1,
    patents: 0,
    startups: 1,
    currentRole: 'Research Participant',
  },
  projects: [
    { projectId: 'p1', title: 'AI for Adaptive University Learning', abstract: 'Investigating personalised learning systems for university students.', category: 'Artificial Intelligence', status: 'Active', principalInvestigator: 'Research Office', researchAssistants: ['Student Research Team'], budget: 85000, fundingSource: 'University Innovation Fund', startDate: '2026-02-01', endDate: '2027-01-31', milestones: ['Literature review', 'Prototype', 'Pilot study'], deliverables: ['Dataset', 'Prototype', 'Research paper'], partners: ['UnivAI Learning Lab'] },
    { projectId: 'p2', title: 'Digital Finance Access for Students', abstract: 'Exploring inclusive digital finance and responsible student payment systems.', category: 'Fintech', status: 'Funded', principalInvestigator: 'Research Office', researchAssistants: [], budget: 120000, fundingSource: 'Innovation Grant', startDate: '2026-04-15', endDate: '2027-04-14', milestones: ['Concept note', 'Field study'], deliverables: ['Policy brief', 'Dataset'], partners: ['Fintech Community'] },
    { projectId: 'p3', title: 'Climate-Smart Campus', abstract: 'A living-lab study of energy efficiency and climate resilience on campus.', category: 'Climate', status: 'Proposal', principalInvestigator: 'Research Office', researchAssistants: [], budget: 50000, fundingSource: 'Pending', startDate: '2026-09-01', endDate: '2027-08-31', milestones: ['Proposal review'], deliverables: ['Campus climate baseline'], partners: ['Climate Living Lab'] },
  ],
  funding: [
    { id: 'f1', title: 'African Innovation Research Fund', organization: 'AU-EU Innovation', category: 'Innovation', deadline: '2026-09-18', amount: '€100,000', description: 'Support for collaborative African research and innovation projects.', eligibility: 'Universities and research teams with African partners.', applicationUrl: '#' },
    { id: 'f2', title: 'Digital Education Research Call', organization: 'Mastercard Foundation', category: 'Education', deadline: '2026-10-02', amount: '$150,000', description: 'Research addressing equitable digital access and learning outcomes.', eligibility: 'Higher education institutions and eligible partners.', applicationUrl: '#' },
    { id: 'f3', title: 'Climate Innovation Grant', organization: 'UNDP', category: 'Climate', deadline: '2026-10-20', amount: '$75,000', description: 'Applied research and prototypes for climate resilience.', eligibility: 'Research institutions, innovators and consortia.', applicationUrl: '#' },
  ],
  publications: [
    { publicationId: 'pub1', title: 'Personalised Learning in African Universities', authors: ['UnivAI Research Team'], abstract: 'A study of adaptive learning approaches in African higher education.', keywords: ['AI', 'education', 'personalisation'], doi: '10.0000/univai.2026.001', publicationDate: '2026-05-20', downloads: 324, citations: 8 },
    { publicationId: 'pub2', title: 'Digital Finance and Student Success', authors: ['UnivAI Research Team'], abstract: 'Examining digital financial tools and student persistence.', keywords: ['fintech', 'students', 'digital finance'], doi: '10.0000/univai.2026.002', publicationDate: '2026-07-12', downloads: 187, citations: 3 },
  ],
  labs: [
    { labId: 'lab1', name: 'AI & Education Living Lab', manager: 'Research Office', description: 'A collaborative environment for testing AI-enabled learning interventions.', projects: ['p1'], participants: ['Students', 'Lecturers', 'Researchers'] },
    { labId: 'lab2', name: 'Climate-Smart Campus Lab', manager: 'Research Office', description: 'Campus-scale experimentation around climate and energy solutions.', projects: ['p3'], participants: ['Students', 'Facilities', 'Researchers'] },
  ],
  challenges: [
    { challengeId: 'c1', title: 'Build for Campus 2030', description: 'Prototype a technology solution to a real university challenge.', deadline: '2026-09-30', prizePool: 'K100,000', participants: [] },
    { challengeId: 'c2', title: 'AI for Africa Challenge', description: 'Develop responsible AI applications with measurable social impact.', deadline: '2026-10-15', prizePool: '$25,000', participants: [] },
  ],
  startups: [
    { startupId: 's1', name: 'StudyFlow AI', founders: ['UnivAI Research Team'], industry: 'EdTech', stage: 'MVP', valuation: 0, fundingRaised: 25000 },
  ],
};

function getFirebaseDb() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (!config.apiKey || !config.projectId || !config.appId) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return getFirestore(app);
}

async function readCollection<T>(name: string, fallbackRows: T[]): Promise<T[]> {
  try {
    const db = getFirebaseDb();
    if (!db) return fallbackRows;
    const snap = await getDocs(query(collection(db, name), orderBy('title'), limit(100)));
    return snap.docs.map((item) => item.data() as T);
  } catch {
    return fallbackRows;
  }
}

export async function getResearchPortalData(userId: string): Promise<ResearchPortalData> {
  const [projects, funding, publications, labs, challenges, startups] = await Promise.all([
    readCollection('research_projects', fallback.projects),
    readCollection('funding_opportunities', fallback.funding),
    readCollection('publications', fallback.publications),
    readCollection('living_labs', fallback.labs),
    readCollection('innovation_challenges', fallback.challenges),
    readCollection('startups', fallback.startups),
  ]);
  let profile = { ...fallback.profile, userId };
  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDocs(query(collection(db, 'research_profiles'), limit(100)));
      const match = snap.docs.find((item) => item.id === userId || item.data().userId === userId);
      if (match) profile = { ...profile, ...(match.data() as Partial<ResearchProfile>) };
    }
  } catch {
    // Keep the usable local fallback when Firestore is unavailable.
  }
  return { profile, projects, funding, publications, labs, challenges, startups };
}

export async function saveResearchProfile(profile: ResearchProfile) {
  const db = getFirebaseDb();
  if (!db) return false;
  await setDoc(doc(db, 'research_profiles', profile.userId), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
  return true;
}
