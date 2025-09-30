// app/api/seed/route.ts
import { db } from '../../../lib/firebase-server'; // Adjust path as needed
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  writeBatch 
} from 'firebase/firestore';

// Import your data from the file containing the constants
import { 
  schools, 
  courses, 
  program,
  flattenedLessons, 
  jobs, 
  researchOpportunities, 
  discussions, 
  consultantApplications, 
  badges, 
  leaderboardData,
  semester1ExamQuestions
} from '../../../lib/data'; // Adjust path for your data file

// Define the collections we want to seed
const COLLECTIONS_TO_SEED = [
    { name: 'schools', data: schools, isArray: true },
    { name: 'courses', data: courses, isArray: true },
    { name: 'lessons', data: flattenedLessons, isArray: true },
    // The Program constant is a single object, we'll handle it specially
    { name: 'jobs', data: jobs, isArray: true },
    { name: 'researchOpportunities', data: researchOpportunities, isArray: true },
    { name: 'discussions', data: discussions, isArray: true },
    { name: 'consultantApplications', data: consultantApplications, isArray: true },
    { name: 'badges', data: badges, isArray: true },
    { name: 'leaderboardData', data: leaderboardData, isArray: true },
    // Lessons need to be flattened/restructured if you want them in their own collection
    // ... add others as needed
];

export async function POST(
  request:Request
) {
  // --- 1. Check Seeding Status ---
  const seedStatusRef = doc(db, 'meta', 'seedStatus');
  const seedStatusSnap = await getDoc(seedStatusRef);

  if (seedStatusSnap.exists() && seedStatusSnap.data().seeded) {
    return Response.json({ message: 'Database already seeded.' }, { status: 200 });
  }

  // --- 2. Perform Seeding using a Batch Write ---
  try {
    const batch = writeBatch(db);

    // Seed all collections from the array
    COLLECTIONS_TO_SEED.forEach(config => {
      const collectionRef = collection(db, config.name);
      if (config.isArray) {
        (config.data as any[]).forEach(item => {
          // Use item.id as the document ID
          const docRef = doc(collectionRef, item.id); 
          batch.set(docRef, item);
        });
      }
    });

    // Handle the single 'program' object
    const programRef = doc(db, 'programs', program.id); 
    batch.set(programRef, program);

    const examRef = doc(db, 'exams', 'cs101-sem1-exam'); // Use a specific ID
    batch.set(examRef, { 
    id: 'cs101-sem1-exam',
    moduleId: 'cs101-sem1-1', // Link it to the module
    questions: semester1ExamQuestions // Store the array here
    });

    // --- 3. Commit the Batch ---
    await batch.commit();

    // --- 4. Update Seeding Status ---
    await setDoc(seedStatusRef, { seeded: true, timestamp: new Date() });

    return Response.json({ message: 'Database seeding complete!' }, { status: 200 });
  } catch (error) {
    console.error('Seeding error:', error);
    return Response.json({ message: 'Failed to seed database.' }, { status: 500 });
  }
}