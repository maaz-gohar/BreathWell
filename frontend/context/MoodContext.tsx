// context/MoodContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { MoodContextType, Mood, MoodAnalytics, ApiResponse } from '../types';
import apiService from '../services/api';

const MoodContext = createContext<MoodContextType | undefined>(undefined);

interface MoodProviderProps {
  children: ReactNode;
}

export const MoodProvider: React.FC<MoodProviderProps> = ({ children }) => {
  const [todayMood, setTodayMood] = useState<Mood | null>(null);
  const [weeklyMoods, setWeeklyMoods] = useState<Mood[]>([]);
  const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTodayMood = async (): Promise<void> => {
    try {
      console.log('🔄 Fetching today mood...');
      const response = await apiService.get<any>('/moods/today');
      console.log('📅 Today mood response:', response);
      
      // ✅ FIXED: Extract data from apiService wrapper
      const responseData = response.data || response;
      
      if (responseData && responseData.mood) {
        setTodayMood(responseData.mood);
      } else if (responseData && responseData._id) {
        setTodayMood(responseData);
      } else {
        setTodayMood(null);
      }
    } catch (error) {
      console.error('❌ Error fetching today\'s mood:', error);
      setTodayMood(null);
    }
  };

  const fetchWeeklyMoods = async (): Promise<void> => {
    try {
      console.log('🔄 Fetching weekly moods...');
      const response = await apiService.get<any>('/moods/weekly');
      console.log('📅 Weekly moods response:', response);
      
      // ✅ FIXED: Extract data from apiService wrapper
      const responseData = response.data || response;
      
      if (responseData && Array.isArray(responseData.moods)) {
        setWeeklyMoods(responseData.moods);
      } else if (responseData && Array.isArray(responseData)) {
        setWeeklyMoods(responseData);
      } else {
        setWeeklyMoods([]);
      }
    } catch (error) {
      console.error('❌ Error fetching weekly moods:', error);
      setWeeklyMoods([]);
    }
  };

  const fetchAnalytics = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('🔄 Fetching analytics from API...');
      const response = await apiService.get<any>('/moods/analytics');
      console.log('📊 Analytics API response:', response);
      
      // ✅ FIXED: Extract data from apiService wrapper
      let analyticsData = response.data || response;
      
      console.log('📊 Extracted analytics data:', analyticsData);

      if (analyticsData && typeof analyticsData === 'object') {
        const finalAnalytics: MoodAnalytics = {
          weeklyAverages: analyticsData.weeklyAverages || [],
          distribution: analyticsData.distribution || {},
          totalMoods: analyticsData.totalMoods || 0,
          averageMood: analyticsData.averageMood || 0
        };
        
        console.log('✅ Setting final analytics data:', finalAnalytics);
        setAnalytics(finalAnalytics);
      } else {
        console.log('❌ No valid analytics data found');
        setAnalytics(null);
      }
    } catch (error: any) {
      console.error('❌ Error fetching analytics:', error);
      console.error('Error details:', error.response?.data || error.message);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const addMood = async (moodData: Omit<Mood, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Mood>> => {
    try {
      setLoading(true);
      console.log('➕ Adding mood:', moodData);
      const response = await apiService.post<any>('/moods', moodData);
      console.log('✅ Add mood response:', response);
      
      let mood: Mood | null = null;
      
      // ✅ FIXED: Extract data from apiService wrapper
      const responseData = response.data || response;
      
      // Handle different response structures
      if (responseData && responseData.mood) {
        mood = responseData.mood;
      } else if (responseData && responseData._id) {
        mood = responseData;
      }

      if (mood) {
        setTodayMood(mood);
        // Refresh analytics after adding a new mood
        await fetchAnalytics();
      }

      return {
        success: response.success || true,
        data: mood || undefined,
        message: response.message || 'Mood added successfully',
      };
    } catch (error: any) {
      console.error('❌ Error adding mood:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error adding mood',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setLoading(false);
    }
  };

  const value: MoodContextType = {
    todayMood,
    weeklyMoods,
    analytics,
    loading,
    fetchTodayMood,
    fetchWeeklyMoods,
    fetchAnalytics,
    addMood,
  };

  return (
    <MoodContext.Provider value={value}>
      {children}
    </MoodContext.Provider>
  );
};

export const useMood = (): MoodContextType => {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
};