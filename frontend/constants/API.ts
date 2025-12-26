export const API_CONFIG = {
  BASE_URL: 'https://x80w9dj3-8000.euw.devtunnels.ms/api', // Change to your local IP
  TIMEOUT: 30000,
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      PROFILE: '/auth/profile',
      UPDATE_PROFILE: '/auth/profile',
      AVATAR: '/auth/avatar'
    },
    CHAT: {
      MESSAGE: '/chat/message',
      SESSIONS: '/chat/sessions',
      SESSION: '/chat/session'
    },
    HABIT: {
      BASE: '/habits',
      STREAKS: '/habits/streaks'
    },
    JOURNAL: {
      VOICE: '/journal/voice',
      BASE: '/journal',
      AUDIO: '/journal/audio'
    },
    MOOD: {
      BASE: '/moods',
      TODAY: '/moods/today',
      WEEKLY: '/moods/weekly',
      ANALYTICS: '/moods/analytics'
    },
    WELLNESS: {
      PLAN: '/wellness/plan',
      GENERATE_PLAN: '/wellness/plan/generate',
      SOS: '/wellness/sos'
    }
  }
};

export const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  secondary: '#10B981',
  accent: '#F59E0B',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  mood: {
    excellent: '#10B981',
    good: '#3B82F6',
    okay: '#F59E0B',
    poor: '#F97316',
    terrible: '#EF4444'
  }
};