import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.164:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('userToken');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json';
        } else {
          delete config.headers['Content-Type'];
        }
        
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleUnauthorized(): Promise<void> {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
  }

  // ✅ FIXED: Handle both response formats (with and without success field)
  public async get<T>(url: string, params?: any): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      const response: AxiosResponse = await this.client.get(url, { params });
      
      console.log('📥 GET Response:', response.data);
      
      // Check if response already has success field (your format)
      if (response.data && typeof response.data.success === 'boolean') {
        return response.data;
      }
      
      // If no success field, wrap the response data
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // ✅ FIXED: Handle both response formats for POST
  public async post<T>(url: string, data?: any, config?: any): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      let requestConfig = { ...config };

      if (data instanceof FormData) {
        requestConfig = {
          ...requestConfig,
          headers: {
            ...requestConfig?.headers,
          },
        };
      }

      console.log('📤 POST Request to:', url);
      console.log('📦 POST Data:', data);

      const response: AxiosResponse = await this.client.post(url, data, requestConfig);
      
      console.log('📥 POST Response:', response.data);
      
      // Check if response already has success field
      if (response.data && typeof response.data.success === 'boolean') {
        console.log('✅ Response has success field');
        return response.data;
      }
      
      // If no success field, wrap the response data
      console.log('🔄 Wrapping response data without success field');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  public async put<T>(url: string, data?: any): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      const response: AxiosResponse = await this.client.put(url, data);
      
      console.log('📥 PUT Response:', response.data);
      
      if (response.data && typeof response.data.success === 'boolean') {
        return response.data;
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  public async delete<T>(url: string): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      const response: AxiosResponse = await this.client.delete(url);
      
      console.log('📥 DELETE Response:', response.data);
      
      if (response.data && typeof response.data.success === 'boolean') {
        return response.data;
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // File upload method with better error handling
  public async uploadFile<T>(url: string, formData: FormData): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      
      console.log('📤 Uploading file to:', `${API_BASE_URL}${url}`);
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('📥 Raw upload response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', responseText);
        return {
          success: false,
          message: 'Invalid response from server',
          error: 'Response is not valid JSON',
        };
      }

      if (response.ok) {
        // Handle both response formats
        if (typeof data.success === 'boolean') {
          return data;
        }
        return { 
          success: true, 
          data: data.journal || data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Upload failed',
          error: data.error || `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      return {
        success: false,
        message: 'Upload failed - network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Multipart post method using axios (alternative to uploadFile)
  public async multipartPost<T>(url: string, formData: FormData): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      
      const response: AxiosResponse = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        timeout: 45000,
      });
      
      console.log('📥 Multipart POST Response:', response.data);
      
      // Handle both response formats
      if (response.data && typeof response.data.success === 'boolean') {
        return response.data;
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  private handleError(error: AxiosError): { success: boolean; data?: any; message?: string } {
    console.error('🔴 API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      responseData: error.response?.data
    });
    
    if (error.response) {
      const responseData = error.response.data as any;
      return {
        success: false,
        message: responseData?.message || 'Server error occurred',
        error: error.message,
        data: responseData,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'No response from server - check your connection',
        error: error.message,
      };
    } else {
      return {
        success: false,
        message: 'Request failed to send',
        error: error.message,
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;