import { API_CONFIG } from '../constants/API';
import type {
  ApiResponse,
  IslamicModule,
  SleepRitual,
  MorningAdhkar,
  TahajjudContent,
  RuqyahContent
} from '../types';
import api from './api';

export const islamicService = {
  async getSleepModules(): Promise<IslamicModule[]> {
    const response = await api.get<ApiResponse<IslamicModule[]>>(
      `${API_CONFIG.ENDPOINTS.ISLAMIC.MODULES}?type=sleep`
    );
    const res = response.data as ApiResponse<IslamicModule[]>;
    return res.data || [];
  },

  async getRelationshipModules(): Promise<IslamicModule[]> {
    const response = await api.get<ApiResponse<IslamicModule[]>>(
      `${API_CONFIG.ENDPOINTS.ISLAMIC.MODULES}?type=relationship`
    );
    const res = response.data as ApiResponse<IslamicModule[]>;
    return res.data || [];
  },

  async getModuleById(id: string): Promise<IslamicModule | null> {
    const response = await api.get<ApiResponse<IslamicModule>>(
      API_CONFIG.ENDPOINTS.ISLAMIC.MODULE_BY_ID(id)
    );
    const res = response.data as ApiResponse<IslamicModule>;
    return res.data || null;
  },

  async getSleepRituals(): Promise<SleepRitual[]> {
    const response = await api.get<ApiResponse<SleepRitual[]>>(
      API_CONFIG.ENDPOINTS.ISLAMIC.SLEEP_RITUALS
    );
    const res = response.data as ApiResponse<SleepRitual[]>;
    return res.data || [];
  },

  async getMorningAdhkar(): Promise<MorningAdhkar | null> {
    const response = await api.get<ApiResponse<MorningAdhkar>>(
      API_CONFIG.ENDPOINTS.ISLAMIC.MORNING_ADHKAR
    );
    const res = response.data as ApiResponse<MorningAdhkar>;
    return res.data || null;
  },

  async getTahajjudContent(): Promise<TahajjudContent | null> {
    const response = await api.get<ApiResponse<TahajjudContent>>(
      API_CONFIG.ENDPOINTS.ISLAMIC.TAHAJJUD
    );
    const res = response.data as ApiResponse<TahajjudContent>;
    return res.data || null;
  },

  async getRuqyahVerses(): Promise<RuqyahContent | null> {
    const response = await api.get<ApiResponse<RuqyahContent>>(
      API_CONFIG.ENDPOINTS.ISLAMIC.RUQYAH
    );
    const res = response.data as ApiResponse<RuqyahContent>;
    return res.data || null;
  }
};
