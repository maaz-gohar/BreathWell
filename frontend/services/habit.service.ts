import { API_CONFIG } from '../constants/API';
import type { Habit, Streak, StreakSummary } from '../types';
import api from './api';

export const habitService = {
  async createHabit(data: Omit<Habit, '_id' | 'createdAt'>): Promise<Habit> {
    console.log('Creating habit with data:', data);
    try {
      const response = await api.post<any>(
        API_CONFIG.ENDPOINTS.HABIT.BASE,
        data
      );
      console.log('API Response:', response.data);
      
      if (response.data && response.data.habit) {
        return response.data.habit;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Create habit error:', error.response?.data || error.message);
      throw error;
    }
  },

  async getHabits(): Promise<Habit[]> {
    try {
      const response = await api.get<any>(
        API_CONFIG.ENDPOINTS.HABIT.BASE
      );
      console.log('Get habits response:', response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.habits) {
        return response.data.habits;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Get habits error:', error.response?.data || error.message);
      return [];
    }
  },

  async updateHabit(id: string, data: Partial<Habit>): Promise<Habit> {
    try {
      const response = await api.put<any>(
        `${API_CONFIG.ENDPOINTS.HABIT.BASE}/${id}`,
        data
      );
      console.log('Update habit response:', response.data);
      return response.data.habit || response.data;
    } catch (error: any) {
      console.error('Update habit error:', error.response?.data || error.message);
      throw error;
    }
  },

  async deleteHabit(id: string): Promise<void> {
    try {
      await api.delete(`${API_CONFIG.ENDPOINTS.HABIT.BASE}/${id}`);
      console.log('Habit deleted:', id);
    } catch (error: any) {
      console.error('Delete habit error:', error.response?.data || error.message);
      throw error;
    }
  },

  async completeHabit(id: string): Promise<Habit> {
    console.log('Completing habit:', id);
    try {
      const response = await api.post<any>(
        `${API_CONFIG.ENDPOINTS.HABIT.BASE}/${id}/complete`
      );
      console.log('Complete habit response:', response.data);
      
      if (response.data && response.data.habit) {
        return response.data.habit;
      } else {
        throw new Error('Invalid response format from complete endpoint');
      }
    } catch (error: any) {
      console.error('Complete habit error:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  async getStreaks(): Promise<Streak[]> {
    try {
      const response = await api.get<any>(
        API_CONFIG.ENDPOINTS.HABIT.STREAKS
      );
      console.log('Get streaks response:', response.data);
      
      // Your backend returns StreakSummary, not Streak[]
      // Convert it to the format your frontend expects
      if (response.data) {
        const summary: StreakSummary = response.data;
        
        // If you need individual streaks, you'll need to get habits first
        const habits = await this.getHabits();
        
        return habits.map(habit => ({
          habitId: habit._id,
          habitName: habit.name,
          currentStreak: habit.streakCount,
          longestStreak: habit.bestStreak,
          lastCompleted: habit.entries?.find(e => e.completed)?.date
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error('Get streaks error:', error.response?.data || error.message);
      return [];
    }
  },

  // Add this new method to get streak summary
  async getStreakSummary(): Promise<StreakSummary> {
    try {
      const response = await api.get<any>(
        API_CONFIG.ENDPOINTS.HABIT.STREAKS
      );
      console.log('Get streak summary response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get streak summary error:', error.response?.data || error.message);
      return {
        totalStreaks: 0,
        bestStreak: 0,
        completedToday: 0,
        totalHabits: 0
      };
    }
  }
};