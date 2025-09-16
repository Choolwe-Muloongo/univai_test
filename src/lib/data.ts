
export type School = {
  id: string;
  name: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  schoolId: string;
  progress: number;
  imageId: string;
};

export type ProgramModule = {
  id: string;
  title: string;
  description: string;
  progress: number;
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
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Internship';
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
    progress: 15,
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
    description: 'This program provides a comprehensive foundation in computer science, ready for global careers. Duration: 4 years (8 semesters). Delivery: 100% online with AI tutors and virtual labs. Target Students: Aspiring software developers, future blockchain and AI specialists, and digital entrepreneurs. Outcome: Graduates can build scalable, secure, and innovative tech solutions.',
    schoolId: 'ict',
    progress: 15,
    imageId: '1',
    modules: [
        { id: 'cs101-sem1-1', title: 'Introduction to ICT and Digital Literacy', description: 'Overview of computers, networks, and digital systems.', progress: 100 },
        { id: 'cs101-sem1-2', title: 'Fundamentals of Programming', description: 'Introduction to programming using Python.', progress: 80 },
        { id: 'cs101-sem1-3', title: 'Mathematics for Computer Science I', description: 'Logic, sets, functions, and basic discrete math.', progress: 60 },
        { id: 'cs101-sem1-4', title: 'Introduction to Artificial Intelligence', description: 'History and applications of AI.', progress: 40 },
        { id: 'cs101-sem1-5', title: 'Professional Development & Ethics', description: 'Digital ethics, professionalism, and communication skills.', progress: 15 },
    ]
}

export const lessons: { [courseId: string]: Lesson[] } = {
  cs101: [
    { id: 'l1-1', title: 'Digital Systems Overview', content: 'An overview of modern computer hardware, software, and networking components.' },
    { id: 'l1-2', title: 'Cloud Collaboration', content: 'Hands-on skills using cloud storage and collaborative tools like Google Workspace or Microsoft 365.' },
    { id: 'l2-1', title: 'Intro to Python', content: 'An algorithm is a finite sequence of well-defined instructions, typically used to solve a class of specific problems or to perform a computation.' },
    { id: 'l2-2', title: 'Algorithms and Flowcharts', content: 'In computer science, a data structure is a data organization, management, and storage format that is usually chosen for efficient access to data.' },
    { id: 'l3-1', title: 'Logic and Sets', content: 'Introduction to propositional logic, set theory, and their applications in computer science.' },
    { id: 'l4-1', title: 'History of AI', content: 'Exploring the origins of AI and key milestones in its development.' },
    { id: 'l4-2', title: 'Intro to Machine Learning', content: 'A brief overview of machine learning concepts, including supervised and unsupervised learning.' },
    { id: 'l5-1', title: 'Digital Ethics', content: 'Understanding ethical issues in the digital world, including privacy, security, and intellectual property.' },
  ],
  nur201: [
    { id: 'l1', title: 'Patient Assessment', content: 'Comprehensive and holistic assessment of a patient is the first step of the nursing process.' },
    { id: 'l2', title: 'Pharmacology Basics', content: 'Understanding how drugs affect the body is crucial for safe medication administration.' },
  ],
  bus301: [
    { id: 'l1', title: 'Strategic Marketing', content: 'Developing and implementing marketing strategies to achieve business objectives.' },
    { id: 'l2', title: 'Financial Accounting', content: 'The process of recording, summarizing, and reporting a company\'s business transactions.' },
  ],
  eng401: [
    { id: 'l1', title: 'Thermodynamics', content: 'The branch of physical science that deals with the relations between heat and other forms of energy.' },
  ],
  edu110: [
    { id: 'l1', title: 'Child Psychology', content: 'Understanding the cognitive and emotional development of children.' },
  ],
};

export const jobs: Job[] = [
  { id: 'j1', title: 'Software Engineer Intern', company: 'TechCorp', location: 'Remote', type: 'Internship' },
  { id: 'j2', title: 'Registered Nurse', company: 'HealthFirst Hospital', location: 'New York, NY', type: 'Full-time' },
  { id: 'j3', title: 'Business Analyst', company: 'FinancePro', location: 'London, UK', type: 'Full-time' },
  { id: 'j4', title: 'Frontend Developer', company: 'Innovate Solutions', location: 'Remote', type: 'Full-time' },
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
