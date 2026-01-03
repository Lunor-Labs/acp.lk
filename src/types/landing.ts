export interface Student {
  name: string;
  year: string;
  district: string;
  subject: string;
  grade: string;
}

export interface TopStudent {
  rank: number;
  name: string;
  school: string;
  marks: number;
  image: string;
}

export interface Review {
  id: number;
  text: string;
  name: string;
  image: string;
}

export interface ProcessStep {
  icon: 'document' | 'calendar' | 'group';
  title: string;
  description: string;
}

export interface ClassCenter {
  title: string;
  buttonText: string;
  image: string;
}

