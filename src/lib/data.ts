// src/lib/data.ts

export type School = {
  id: string;
  name: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  schoolId: string;
  progress?: number;
  imageId: string;
};

export type ProgramModule = {
  id: string;
  title: string;
  description: string;
  progress: number;
  semester: number;
  isExamAvailable: boolean;
};

export type Program = {
  id: string;
  title: string;
  description: string;
  schoolId: string;
  progress: number;
  imageId: string;
  modules: ProgramModule[];
};


export type Lesson = {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  exercise?: string;
  quiz?: any;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Internship';
};

export type ResearchOpportunity = {
  id: string;
  title: string;
  company: string;
  description: string;
  field: string;
};


export type DiscussionComment = {
    id: string;
    author: string;
    avatar: string;
    content: string;
    timestamp: string;
    upvotes: number;
}

export type Discussion = {
  id: string;
  title: string;
  author: string;
  avatar: string;
  snippet: string;
  comments: DiscussionComment[];
  timestamp: string;
};

export type ConsultantApplication = {
  id: string;
  name: string;
  department: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  avatar: string;
  documents: {
    cv: string;
    id: string;
  };
};

export type Badge = {
    id: string;
    title: string;
    description: string;
    icon: string;
}

export type LeaderboardStudent = {
    id: string;
    rank: number;
    name: string;
    avatar: string;
    school: string;
    points: number;
}


export const schools: School[] = [
  { id: 'edu', name: 'School of Education' },
  { id: 'ict', name: 'School of ICT' },
  { id: 'nursing', name: 'School of Nursing' },
  { id: 'business', name: 'School of Business' },
  { id: 'eng', name: 'School of Engineering' },
];

export const courses: Course[] = [
  {
    id: 'cs101',
    title: 'Bachelor of Science in Software Development and Emerging Technologies',
    description: 'Foundational concepts of computing, including algorithms, data structures, and software engineering.',
    schoolId: 'ict',
    progress: 100,
    imageId: '1',
  },
  {
    id: 'nur201',
    title: 'Diploma in Nursing',
    description: 'Essential skills for patient care, clinical practice, and medical ethics.',
    schoolId: 'nursing',
    progress: 45,
    imageId: '2',
  },
  {
    id: 'bus301',
    title: 'MBA',
    description: 'Advanced business administration, leadership, and strategic management.',
    schoolId: 'business',
    progress: 90,
    imageId: '3',
  },
  {
    id: 'eng401',
    title: 'Mechanical Engineering',
    description: 'Principles of mechanics, thermodynamics, and material science.',
    schoolId: 'eng',
    progress: 20,
    imageId: '4',
  },
  {
    id: 'edu110',
    title: 'Early Childhood Education',
    description: 'Theories and practices for teaching young children from birth to age 8.',
    schoolId: 'edu',
    progress: 60,
    imageId: '5',
  },
];

export const program: Program = {
    id: 'cs101',
    title: 'Bachelor of Science in Software Development and Emerging Technologies',
    description: "Duration: 4 years (8 semesters). Delivery: 100% online with AI tutors and virtual labs. Target Students: Aspiring software developers, future blockchain and AI specialists, and digital entrepreneurs. Outcome: Graduates can build scalable, secure, and innovative tech solutions, ready for global careers.",
    schoolId: 'ict',
    progress: 100,
    imageId: '1',
    modules: [
        { id: 'cs101-sem1-1', title: 'Introduction to ICT and Digital Literacy', description: 'Overview of computers, networks, and digital systems.', progress: 100, semester: 1, isExamAvailable: true },
        { id: 'cs101-sem1-2', title: 'Fundamentals of Programming', description: 'Introduction to programming using Python.', progress: 100, semester: 1, isExamAvailable: false },
        { id: 'cs101-sem1-3', title: 'Mathematics for Computer Science I', description: 'Logic, sets, functions, and basic discrete math.', progress: 100, semester: 1, isExamAvailable: false },
        { id: 'cs101-sem1-4', title: 'Introduction to Artificial Intelligence', description: 'History and applications of AI.', progress: 100, semester: 1, isExamAvailable: false },
        { id: 'cs101-sem1-5', title: 'Professional Development & Ethics', description: 'Digital ethics, professionalism, and communication skills.', progress: 100, semester: 1, isExamAvailable: false },
        { id: 'cs101-sem2-1', title: 'Web Development I (Frontend Basics)', description: 'HTML, CSS, JavaScript fundamentals. Building responsive websites.', progress: 100, semester: 2, isExamAvailable: false },
        { id: 'cs101-sem2-2', title: 'Database Systems I', description: 'Introduction to relational databases. SQL basics and Firebase Firestore integration.', progress: 100, semester: 2, isExamAvailable: false },
        { id: 'cs101-sem2-3', title: 'Software Engineering Principles', description: 'SDLC, Agile, and DevOps basics.', progress: 100, semester: 2, isExamAvailable: false },
        { id: 'cs101-sem2-4', title: 'Mathematics for Computer Science II', description: 'Probability, statistics, and linear algebra.', progress: 100, semester: 2, isExamAvailable: false },
        { id: 'cs101-sem2-5', title: 'Blockchain Fundamentals', description: 'Blockchain concepts, smart contracts, and AFTACOIN integration.', progress: 100, semester: 2, isExamAvailable: false },
    ]
}

export const semester1ExamQuestions = [
    {
      question: 'Which of these is NOT a core component of a computer system?',
      options: ['CPU', 'RAM', 'Mouse', 'Hard Drive'],
      answer: 'Mouse',
    },
    {
      question: 'What does the `if` statement do in Python?',
      options: ['Loops over a sequence', 'Defines a function', 'Makes a decision based on a condition', 'Prints output to the console'],
      answer: 'Makes a decision based on a condition',
    },
    {
        question: 'Which of the following is a key application of AI?',
        options: ['Creating spreadsheets', 'Natural Language Processing', 'Sending emails', 'Basic arithmetic'],
        answer: 'Natural Language Processing',
      },
];

export type LessonWithCourseId = Lesson & { courseId: string };

export const lessons: { [courseId: string]: Lesson[] } = {
  cs101: [
    { id: 'l1-cs101', title: 'Digital Systems Overview', content: 'An overview of modern computer hardware, software, and networking components.' },
    { id: 'l2-cs101', title: 'Cloud Collaboration', content: 'Hands-on skills using cloud storage and collaborative tools like Google Workspace or Microsoft 365.' },
    { id: 'l3-cs101', title: 'Intro to Python', content: 'Learn the fundamentals of the Python programming language, including variables, data types, and control flow.' },
  ],
  nur201: [
    { id: 'l1-nur201', title: 'Patient Assessment', content: 'Comprehensive and holistic assessment of a patient is the first step of the nursing process.' },
    { id: 'l2-nur201', title: 'Pharmacology Basics', content: 'Understanding how drugs affect the body is crucial for safe medication administration.' },
  ],
  bus301: [
    { id: 'l1-bus301', title: 'Strategic Marketing', content: 'Developing and implementing marketing strategies to achieve business objectives.' },
    { id: 'l2-bus301', title: 'Financial Accounting', content: 'The process of recording, summarizing, and reporting a company\'s business transactions.' },
  ],
  eng401: [
    { id: 'l1-eng401', title: 'Thermodynamics', content: 'The branch of physical science that deals with the relations between heat and other forms of energy.' },
  ],
  edu110: [
    { id: 'l1-edu110', title: 'Child Psychology', content: 'Understanding the cognitive and emotional development of children.' },
  ],
};

/**
 * Utility function to flatten the nested lessons object into a single array
 * with the courseId added to each lesson object.
 */
export const flattenedLessons: LessonWithCourseId[] = Object.keys(lessons).flatMap(courseId => {
    return lessons[courseId].map(lesson => ({
        ...lesson,
        courseId: courseId, // Add the courseId from the key
    }));
});

export const jobs: Job[] = [
  { id: 'j1', title: 'Software Engineer Intern', company: 'TechCorp', location: 'Remote', type: 'Internship' },
  { id: 'j2', title: 'Registered Nurse', company: 'HealthFirst Hospital', location: 'New York, NY', type: 'Full-time' },
  { id: 'j3', title: 'Business Analyst', company: 'FinancePro', location: 'London, UK', type: 'Full-time' },
  { id: 'j4', title: 'Frontend Developer', company: 'Innovate Solutions', location: 'Remote', type: 'Full-time' },
];

export const researchOpportunities: ResearchOpportunity[] = [
    { id: 'r1', title: 'AI in Medical Diagnosis', company: 'HealthFirst Hospital', description: 'Investigating the application of machine learning models to improve diagnostic accuracy in radiology.', field: 'Healthcare AI' },
    { id: 'r2', title: 'Next-Gen UI/UX with AI', company: 'Innovate Solutions', description: 'Researching how generative AI can be used to create adaptive and personalized user interfaces.', field: 'Human-Computer Interaction' },
    { id: 'r3', title: 'Decentralized Finance (DeFi) Protocols', company: 'AftaCoin', description: 'Analyzing the security and scalability of novel DeFi protocols on the blockchain.', field: 'Blockchain' },
];

export const discussions: Discussion[] = [
  { 
    id: 'd1', 
    title: 'Best resources for learning React?', 
    author: 'Jane Doe', 
    avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026704d', 
    snippet: 'I\'m new to frontend development and trying to pick up React. What are the best tutorials or courses you\'d recommend? Any advice is appreciated! I\'ve looked at the official docs, but I find them a bit dense. Looking for something more project-based.', 
    comments: [
        {id: 'c1', author: 'John Smith', avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026705d', content: 'I highly recommend the Scrimba course on React. It\'s very interactive and you build projects along the way.', timestamp: '1 hour ago', upvotes: 12},
        {id: 'c2', author: 'Emily White', avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026706d', content: 'Egghead.io has some great, concise video tutorials if you prefer that format.', timestamp: '45 minutes ago', upvotes: 5}
    ], 
    timestamp: '2 hours ago' 
  },
  { 
    id: 'd2', 
    title: 'Tips for clinical rotations in nursing school', 
    author: 'John Smith', 
    avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026705d', 
    snippet: 'My first clinical rotation is coming up and I\'m feeling nervous. Does anyone have advice on how to make the most of it and what to expect? Especially on how to interact with the preceptors.', 
    comments: [], 
    timestamp: '1 day ago' 
  },
  { 
    id: 'd3', 
    title: 'Group project for BUS301 - Strategic Marketing', 
    author: 'Emily White', 
    avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026706d', 
    snippet: 'Looking for 2 more members for our group project. We are planning to analyze a tech startup\'s marketing strategy. DM me if interested! Our focus is on digital marketing channels.', 
    comments: [], 
    timestamp: '3 days ago' 
  },
];

export const consultantApplications: ConsultantApplication[] = [
  {
    id: 'app1',
    name: 'Dr. Evelyn Reed',
    department: 'School of ICT',
    status: 'Pending',
    avatar: 'https://i.pravatar.cc/80?u=lecturer',
    documents: { cv: '#', id: '#' },
  },
  {
    id: 'app2',
    name: 'Prof. Alan Turing',
    department: 'School of Engineering',
    status: 'Pending',
    avatar: 'https://i.pravatar.cc/80?u=prof-turing',
    documents: { cv: '#', id: '#' },
  },
];

export const badges: Badge[] = [
    { id: 'b1', title: 'Module Master', description: 'Complete your first module.', icon: 'award' },
    { id: 'b2', title: 'Top Performer', description: 'Achieve over 90% in an exam.', icon: 'star' },
    { id: 'b3', title: 'Course Completer', description: 'Finish an entire course program.', icon: 'book' },
    { id: 'b4', title: 'Community Helper', description: 'Receive 10 upvotes on a comment.', icon: 'users' },
]

export const leaderboardData: LeaderboardStudent[] = [
    { id: 's1', rank: 1, name: 'Premium Student', avatar: 'https://i.pravatar.cc/80?u=student-premium', school: 'School of ICT', points: 1250 },
    { id: 's2', rank: 2, name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/80?u=alice', school: 'School of Business', points: 1180 },
    { id: 's3', rank: 3, name: 'Bob Williams', avatar: 'https://i.pravatar.cc/80?u=bob', school: 'School of Engineering', points: 1120 },
    { id: 's4', rank: 4, name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/80?u=charlie', school: 'School of ICT', points: 1050 },
    { id: 's5', rank: 5, name: 'Diana Miller', avatar: 'https://i.pravatar.cc/80?u=diana', school: 'School of Nursing', points: 980 },
]

    
