export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  biometricEnabled: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  emergencyContact?: EmergencyContact;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  biometricEnabled: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<{ user: User; token: string }>>;
  register: (name: string, email: string, password: string) => Promise<ApiResponse<{ user: User; token: string }>>;
  logout: () => Promise<void>;
  enableBiometric: () => Promise<ApiResponse<void>>;
  biometricLogin: () => Promise<ApiResponse<void>>;
  updateProfile: (profileData: { name?: string; avatar?: string; preferences?: any }) => Promise<ApiResponse<{ user: User }>>;
  uploadAvatar: (imageUri: string) => Promise<ApiResponse<{ user: User }>>;
  pickImage: () => Promise<string | null>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface Mood {
  _id: string;
  userId: string;
  date: string;
  moodEmoji: string;
  moodScore: number;
  note?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MoodContextType {
  todayMood: Mood | null;
  weeklyMoods: Mood[];
  analytics: MoodAnalytics | null;
  loading: boolean;
  fetchTodayMood: () => Promise<void>;
  fetchWeeklyMoods: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  addMood: (moodData: Omit<Mood, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<Mood>>;
}

export interface MoodAnalytics {
  weeklyAverages: WeeklyAverage[];
  distribution: Record<string, number>;
  totalMoods: number;
  averageMood: number;
}

export interface WeeklyAverage {
  week: string;
  average: number;
}

export interface ChatMessage {
  _id?: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sentiment: 'positive' | 'neutral' | 'negative' | 'crisis';
}

export interface ChatSession {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  crisisDetected: boolean;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitEntry {
  date: string;
  completed: boolean;
}

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  streakCount: number;
  bestStreak: number;
  entries: HabitEntry[];
  reminderTime?: string;
  category: 'health' | 'mindfulness' | 'productivity' | 'self_care';
  createdAt: string;
  updatedAt: string;
}

export interface StreakStats {
  totalStreaks: number;
  bestStreak: number;
  completedToday: number;
  totalHabits: number;
}

export interface WellnessPlan {
  daily: string[];
  weekly: string[];
  tips: string[];
}

export interface CrisisResources {
  hotlines: CrisisHotline[];
  message: string;
}

export interface CrisisHotline {
  name: string;
  number: string;
}

export interface JournalEntry {
  _id: string;
  userId: string;
  type: 'voice' | 'text';
  audioUrl?: string;
  transcription?: string;
  duration?: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  MoodTracker: undefined;
  Chat: { sessionId?: string };
  Breathing: undefined;
  Habits: undefined;
  Analytics: undefined;
  Profile: undefined;
  Journal: undefined;
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
} 