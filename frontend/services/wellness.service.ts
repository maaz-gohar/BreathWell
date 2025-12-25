import { API_CONFIG } from '../constants/API';
import type { ApiResponse, WellnessPlan } from '../types';
import api from './api';

interface SOSResponse {
  message: string;
  resources: string[];
}

export const wellnessService = {
  async getWellnessPlan(): Promise<WellnessPlan> {
    const response = await api.get<ApiResponse<WellnessPlan>>(
      API_CONFIG.ENDPOINTS.WELLNESS.PLAN
    );
    return (response.data as ApiResponse<WellnessPlan>).data;
  },

  async generateWellnessPlan(): Promise<WellnessPlan> {
    const response = await api.post<ApiResponse<WellnessPlan>>(
      API_CONFIG.ENDPOINTS.WELLNESS.GENERATE_PLAN
    );
    return (response.data as ApiResponse<WellnessPlan>).data;
  },

  async handleSOS(): Promise<SOSResponse> {
    const response = await api.post<ApiResponse<SOSResponse>>(
      API_CONFIG.ENDPOINTS.WELLNESS.SOS
    );
    return (response.data as ApiResponse<SOSResponse>).data!;
  }
};