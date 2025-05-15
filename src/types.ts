import { ReactNode } from 'react';

export interface QuizQuestion {
  id: string;
  question: string;
  description?: string;
  options?: string[];
  icon: ReactNode;
  type: 'choice' | 'text';
  placeholder?: string;
}