import { Request } from 'express';
import { Role } from '@prisma/client';

// User types
export interface IUser {
  id: string;
  phoneNumber: string;
  email?: string;
  name: string;
  role: Role;
  institutionId?: string;
  approved: boolean;
  profilePic?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  phoneNumber: string;
  email?: string;
  name: string;
  password: string;
  role: Role;
  institutionId?: string;
}

export interface IUserUpdate {
  email?: string;
  name?: string;
  password?: string;
  role?: Role;
  institutionId?: string;
  approved?: boolean;
  profilePic?: string;
}

// Institution types
export interface IInstitution {
  id: string;
  name: string;
  address?: string;
  approved: boolean;
  adminId: string;
  createdAt: Date;
}

export interface IInstitutionCreate {
  name: string;
  address?: string;
  adminId: string;
}

// Quiz types
export interface IQuiz {
  id: string;
  title: string;
  description?: string;
  createdById: string;
  subjectId: string;
  institutionId?: string;
  startTime: Date;
  endTime: Date;
  durationMins: number;
  settings: any;
  isActive: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizCreate {
  title: string;
  description?: string;
  subjectId: string;
  institutionId?: string;
  startTime: Date;
  endTime: Date;
  durationMins: number;
  settings: any;
}

export interface IQuizUpdate {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  durationMins?: number;
  settings?: any;
  isActive?: boolean;
  isCompleted?: boolean;
}

// Question types
export interface IQuestion {
  id: string;
  quizId: string;
  text: string;
  options: any;
  answer: string;
  difficulty: string;
  points: number;
  createdAt: Date;
}

export interface IQuestionCreate {
  quizId: string;
  text: string;
  options: any;
  answer: string;
  difficulty: string;
  points?: number;
}

// Quiz Attempt types
export interface IQuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: any;
  score: number;
  maxScore: number;
  completed: boolean;
  startedAt: Date;
  submittedAt?: Date;
  timeSpent?: number;
}

export interface IQuizAttemptCreate {
  quizId: string;
  studentId: string;
  answers: any;
  score: number;
  maxScore: number;
  completed: boolean;
  timeSpent?: number;
}

// Authentication types
export interface ILoginRequest {
  phoneNumber: string;
  password: string;
}

export interface ISignupRequest {
  phoneNumber: string;
  email?: string;
  name: string;
  password: string;
  role: Role;
  institutionId?: string;
}

export interface IOTPVerification {
  phoneNumber: string;
  code: string;
}

export interface IResetPassword {
  phoneNumber: string;
  newPassword: string;
}

// JWT Payload
export interface IJWTPayload {
  userId: string;
  role: Role;
  institutionId?: string;
}

// Extended Request with user
export interface IAuthRequest extends Request {
  user?: IUser;
}

// API Response types
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Pagination types
export interface IPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Leaderboard types
export interface ILeaderboard {
  id: string;
  institutionId?: string;
  userId: string;
  points: number;
  badges: number;
  stars: number;
  rankingCycle: string;
  cycleStart: Date;
  cycleEnd: Date;
  createdAt: Date;
}

export interface ILeaderboardCreate {
  institutionId?: string;
  userId: string;
  points: number;
  badges: number;
  stars: number;
  rankingCycle: string;
  cycleStart: Date;
  cycleEnd: Date;
}

// Notification types
export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data?: any;
  createdAt: Date;
}

export interface INotificationCreate {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: any;
}

// AI Question Generation types
export interface IAIQuestionRequest {
  subject: string;
  grade: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
}

export interface IAIQuestionResponse {
  questions: Array<{
    text: string;
    options?: string[];
    answer: string;
    difficulty: string;
    explanation?: string;
  }>;
}
