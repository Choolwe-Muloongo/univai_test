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

export type Discussion = {
  id: string;
  title: string;
  author: string;
  avatar: string;
  snippet: string;
  comments: number;
  timestamp: string;
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
    title: 'BSc Computer Science',
    description: 'Foundational concepts of computing, including algorithms, data structures, and software engineering.',
    schoolId: 'ict',
    progress: 75,
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

export const lessons: { [courseId: string]: Lesson[] } = {
  cs101: [
    { id: 'l1', title: 'Introduction to Algorithms', content: 'An algorithm is a finite sequence of well-defined instructions, typically used to solve a class of specific problems or to perform a computation.' },
    { id: 'l2', title: 'Data Structures', content: 'In computer science, a data structure is a data organization, management, and storage format that is usually chosen for efficient access to data.' },
    { id: 'l3', title: 'Software Development Lifecycle', content: 'The SDLC aims to produce high-quality software that meets or exceeds customer expectations, reaches completion within times and cost estimates.' },
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
  { id: 'd1', title: 'Best resources for learning React?', author: 'Jane Doe', avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026704d', snippet: 'I\'m new to frontend development and trying to pick up React. What are the best tutorials or courses you\'d recommend? Any advice is appreciated!', comments: 12, timestamp: '2 hours ago' },
  { id: 'd2', title: 'Tips for clinical rotations in nursing school', author: 'John Smith', avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026705d', snippet: 'My first clinical rotation is coming up and I\'m feeling nervous. Does anyone have advice on how to make the most of it and what to expect?', comments: 8, timestamp: '1 day ago' },
  { id: 'd3', title: 'Group project for BUS301 - Strategic Marketing', author: 'Emily White', avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026706d', snippet: 'Looking for 2 more members for our group project. We are planning to analyze a tech startup\'s marketing strategy. DM me if interested!', comments: 5, timestamp: '3 days ago' },
];
