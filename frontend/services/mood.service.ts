import { API_CONFIG } from '../constants/API';
import type { CreateMoodData, MoodEntry } from '../types';
import api from './api';

// Define response interfaces based on your backend
interface MoodResponse {
  message?: string;
  mood?: MoodEntry;
  moods?: MoodEntry[];
}

export const moodService = {
  async addMood(data: CreateMoodData): Promise<MoodEntry> {
    const response = await api.post<MoodResponse>(
      API_CONFIG.ENDPOINTS.MOOD.BASE, 
      data
    );
    
    // Type assertion
    const apiResponse = response.data as MoodResponse;
    if (apiResponse.mood) {
      return apiResponse.mood;
    }
    throw new Error(apiResponse.message || 'Failed to add mood');
  },

  async getTodayMood(): Promise<MoodEntry | null> {
    try {
      const response = await api.get<MoodResponse>(
        API_CONFIG.ENDPOINTS.MOOD.TODAY
      );
      
      // Type assertion
      const apiResponse = response.data as MoodResponse;
      if (apiResponse.mood) {
        return apiResponse.mood;
      }
      return null;
    } catch (error) {
      console.error('Error fetching today mood:', error);
      return null;
    }
  },

  async getWeeklyMoods(): Promise<MoodEntry[]> {
    const response = await api.get<MoodResponse>(
      API_CONFIG.ENDPOINTS.MOOD.WEEKLY
    );
    
    // Type assertion
    const apiResponse = response.data as MoodResponse;
    if (apiResponse.moods && Array.isArray(apiResponse.moods)) {
      return apiResponse.moods;
    }
    return [];
  },

  async getMoodAnalytics(): Promise<any> {
    const response = await api.get<any>(
      API_CONFIG.ENDPOINTS.MOOD.ANALYTICS
    );
    return response.data;
  },

  async updateMood(id: string, data: Partial<MoodEntry>): Promise<MoodEntry> {
    const response = await api.put<MoodResponse>(
      `${API_CONFIG.ENDPOINTS.MOOD.BASE}/${id}`, 
      data
    );
    
    // Type assertion
    const apiResponse = response.data as MoodResponse;
    if (apiResponse.mood) {
      return apiResponse.mood;
    }
    throw new Error(apiResponse.message || 'Failed to update mood');
  },

  async deleteMood(id: string): Promise<void> {
    await api.delete(
      `${API_CONFIG.ENDPOINTS.MOOD.BASE}/${id}`
    );
  }
};