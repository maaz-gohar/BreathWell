import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/API';
import type { LoginData, RegisterData, User } from '../types';
import api from './api';

// Define the actual response types from your backend
interface AuthBackendResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

interface ProfileBackendResponse {
  success: boolean;
  message?: string;
  user: User;
}

interface AvatarBackendResponse {
  success: boolean;
  message?: string;
  avatar: string;
}

export const authService = {
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post<AuthBackendResponse>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      data
    );

    if (response.data.success) {
      return {
        user: response.data.user,
        token: response.data.token
      };
    }
    throw new Error(response.data.message || 'Registration failed');
  },

  async login(data: LoginData): Promise<{ user: User; token: string }> {
    const response = await api.post<AuthBackendResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      data
    );

    if (response.data.success) {
      return {
        user: response.data.user,
        token: response.data.token
      };
    }
    throw new Error(response.data.message || 'Login failed');
  },

  async getProfile(): Promise<User> {
    const response = await api.get<ProfileBackendResponse>(
      API_CONFIG.ENDPOINTS.AUTH.PROFILE
    );

    if (response.data.success) {
      return response.data.user;
    }
    throw new Error(response.data.message || 'Failed to get profile');
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<ProfileBackendResponse>(
      API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE,
      data
    );

    if (response.data.success) {
      return response.data.user;
    }
    throw new Error(response.data.message || 'Failed to update profile');
  },

  async updateAvatar(formData: FormData): Promise<{ avatar: string }> {
    const response = await api.put<AvatarBackendResponse>(
      API_CONFIG.ENDPOINTS.AUTH.AVATAR,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success) {
      return { avatar: response.data.avatar };
    }
    throw new Error(response.data.message || 'Failed to update avatar');
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  }
};