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
  year: string;
}

export interface Review {
  id: number;
  text: string;
  name: string;
  image: string;
  rating: number;
}

export interface ProcessStep {
  icon: 'document' | 'calendar' | 'group';
  title: string;
  description: string;
}

export interface ClassCenter {
  topTitle?: string;
  title: string;
  titleHighlight?: string;
  subtitle?: string;
  description: string;
  buttonText: string;
  image: string;
  theme?: 'light' | 'dark';
  rating?: number;
  brand?: string;
}

export interface TelegramChannel {
  year: string;
  category: string;
  buttonText: string;
  image: string;
  joinLink?: string;
}

