export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChatMessage {
  sessionId: boolean;
  _id: string;
  user: string;
  message: string;
  response?: string;
  createdAt: string;
}

export interface ChatSession {
  messages: any;
  _id: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  streakCount: number;
  bestStreak: number;
  entries: Array<{
    date: string;
    completed: boolean;
    _id: string;
  }>;
  reminderTime?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface JournalEntry {
  _id: string;
  userId: string;
  type: 'voice' | 'text';
  audioUrl: string;
  transcription?: string;
  duration?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  title?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}


export interface MoodEntry {
  _id: string;
  userId: string;
  moodEmoji: string;
  moodScore: number;
  note?: string;
  tags: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

// Add this type for creating mood
export interface CreateMoodData {
  moodEmoji: string;
  moodScore: number;
  note?: string;
  tags: string[];
}

export interface WellnessPlan {
  _id: string;
  user: string;
  dailyTasks: Array<{
    title: string;
    description: string;
    time: string;
    completed: boolean;
  }>;
  weeklyGoals: string[];
  motivationalQuote: string;
  createdAt: string;
  updatedAt: string;
}

export interface Streak {
  habitId: string;
  habitName: string;
  currentStreak: number;
  longestStreak: number;
  lastCompleted?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  journal?: JournalEntry;  // For single journal response
  journals?: JournalEntry[]; // For multiple journals response
  total?: number;
  page?: number;
  totalPages?: number;
}

export interface CreateHabitResponse {
  message: string;
  habit: Habit;
}

export interface GetHabitsResponse {
  habits: Habit[];
}

export interface StreakSummary {
  totalStreaks: number;
  bestStreak: number;
  completedToday: number;
  totalHabits: number;
}

// Islamic Heal Well Module types
export interface Verse {
  surah: string;
  verseRange: string;
  arabicText?: string;
  translation: string;
  hadithRef?: string;
}

export interface SunnahPractice {
  title: string;
  description: string;
  hadithSource?: string;
}

export interface RegulationLayer {
  type: 'breathing' | 'dhikr' | 'dua' | 'journal';
  instruction: string;
  dhikrText?: string;
  breathingConfig?: {
    inhale: number;
    exhale: number;
    rounds: number;
  };
}

export interface IslamicModule {
  id: string;
  moduleType: 'sleep' | 'relationship' | 'general';
  emotionalState: string;
  displayLabel: string;
  emoji?: string;
  emotionalValidation?: string;
  verses: Verse[];
  sunnahPractices: SunnahPractice[];
  regulationLayer?: RegulationLayer;
  reflectionPrompts: string[];
  closingAffirmation?: string;
  order?: number;
}

export interface SleepRitual {
  title: string;
  description: string;
  order?: number;
}

export interface MorningAdhkar {
  title: string;
  source?: string;
  items: string[];
}

export interface TahajjudContent {
  title: string;
  source?: string;
  whenWaking?: string;
  verses?: Array<{ surah: string; verseRange: string; translation: string }>;
}

export interface RuqyahVerse {
  ref: string;
  name: string;
  hadithRef?: string;
}

export interface RuqyahContent {
  title: string;
  verses: RuqyahVerse[];
}