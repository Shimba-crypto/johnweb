export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface PastPaper {
  id: string;
  subjectId: string;
  title: string;
  year: number;
  grade: string;
  examType: "internal" | "external";
  description: string;
  createdAt: string;
}

export interface Question {
  id: string;
  paperId: string;
  questionNumber: number;
  text: string;
  marks: number;
  modelAnswer: string;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  isCorrect: boolean;
  feedback: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}
