export type SubjectEntry = {
  id: string;
  name: string;
  group?: string;
};

export const zambiaGrade12Subjects: SubjectEntry[] = [
  { id: 'english-language', name: 'English Language', group: 'Languages' },
  { id: 'mathematics', name: 'Mathematics', group: 'Sciences' },
  { id: 'additional-mathematics', name: 'Additional Mathematics', group: 'Sciences' },
  { id: 'biology', name: 'Biology', group: 'Sciences' },
  { id: 'chemistry', name: 'Chemistry', group: 'Sciences' },
  { id: 'physics', name: 'Physics', group: 'Sciences' },
  { id: 'science', name: 'Science', group: 'Sciences' },
  { id: 'agricultural-science', name: 'Agricultural Science', group: 'Sciences' },
  { id: 'computer-studies', name: 'Computer Studies', group: 'Sciences' },
  { id: 'civic-education', name: 'Civic Education', group: 'Humanities' },
  { id: 'religious-education', name: 'Religious Education', group: 'Humanities' },
  { id: 'history', name: 'History', group: 'Humanities' },
  { id: 'geography', name: 'Geography', group: 'Humanities' },
  { id: 'literature-in-english', name: 'Literature in English', group: 'Humanities' },
  { id: 'french', name: 'French', group: 'Languages' },
  { id: 'chinese-language', name: 'Chinese Language', group: 'Languages' },
  { id: 'cinyanja', name: 'Cinyanja', group: 'Languages' },
  { id: 'art-design', name: 'Art & Design', group: 'Arts' },
  { id: 'musical-arts-education', name: 'Musical Arts Education', group: 'Arts' },
  { id: 'design-technology', name: 'Design & Technology', group: 'Practical' },
  { id: 'fashion-fabrics', name: 'Fashion & Fabrics', group: 'Practical' },
  { id: 'food-nutrition', name: 'Food & Nutrition', group: 'Practical' },
  { id: 'home-management', name: 'Home Management', group: 'Practical' },
  { id: 'physical-education', name: 'Physical Education', group: 'Practical' },
  { id: 'commerce', name: 'Commerce', group: 'Business' },
  { id: 'principles-of-accounts', name: 'Principles of Accounts', group: 'Business' },
  { id: 'metal-work', name: 'Metal Work', group: 'Practical' }
];

export const subjectCatalogByCountry: Record<string, SubjectEntry[]> = {
  Zambia: zambiaGrade12Subjects
};
