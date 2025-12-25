import { API_CONFIG } from '../constants/API';
import type { JournalEntry } from '../types';
import api from './api';

export const journalService = {
  async saveVoiceJournal(formData: FormData): Promise<JournalEntry> {
    try {
      console.log('Saving voice journal...');
      const response = await api.post<any>(
        API_CONFIG.ENDPOINTS.JOURNAL.VOICE, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('Save voice journal response:', response.data);
      
      // Backend returns: { success, message, journal }
      if (response.data && response.data.journal) {
        return response.data.journal;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Save voice journal error:', error.response?.data || error.message);
      throw error;
    }
  },

  async getJournals(): Promise<JournalEntry[]> {
    try {
      const response = await api.get<any>(
        API_CONFIG.ENDPOINTS.JOURNAL.BASE
      );
      console.log('Get journals response:', response.data);
      
      // Handle different response formats:
      // 1. { journals: [] }
      if (response.data && response.data.journals) {
        return response.data.journals;
      }
      // 2. { success, journals: [] }
      else if (response.data && response.data.data && response.data.data.journals) {
        return response.data.data.journals;
      }
      // 3. { success, data: [] }
      else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // 4. Direct array
      else if (Array.isArray(response.data)) {
        return response.data;
      }
      // 5. Empty response
      else {
        console.warn('Unexpected journals response format:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Get journals error:', error.response?.data || error.message);
      return [];
    }
  },

  async getJournal(id: string): Promise<JournalEntry> {
    try {
      const response = await api.get<any>(
        `${API_CONFIG.ENDPOINTS.JOURNAL.BASE}/${id}`
      );
      
      if (response.data && response.data.journal) {
        return response.data.journal;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Get journal error:', error.response?.data || error.message);
      throw error;
    }
  },

  async deleteJournal(id: string): Promise<void> {
    try {
      await api.delete(`${API_CONFIG.ENDPOINTS.JOURNAL.BASE}/${id}`);
      console.log('Journal deleted:', id);
    } catch (error: any) {
      console.error('Delete journal error:', error.response?.data || error.message);
      throw error;
    }
  },

  getAudioUrl(filename: string): string {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.JOURNAL.AUDIO}/${filename}`;
  }
};