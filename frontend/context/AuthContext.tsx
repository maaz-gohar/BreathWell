import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { 
  AuthContextType, 
  User, 
  ApiResponse 
} from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// ✅ FIXED: Create a proper API service with better error handling
const apiService = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.164:3000/api';
      
      console.log(`🔍 GET ${endpoint}`, { token: !!token });
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(`📨 GET ${endpoint} response:`, data);

      if (response.ok) {
        return { success: true, data };
      } else {
        return { 
          success: false, 
          message: data.message || `GET request failed with status ${response.status}` 
        };
      }
    } catch (error: any) {
      console.error(`🚨 GET ${endpoint} error:`, error);
      return { 
        success: false, 
        message: 'Network request failed',
        error: error.message 
      };
    }
  },

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.164:3000/api';
      
      console.log(`🔍 PUT ${endpoint}`, { 
        token: !!token,
        body: JSON.stringify(body, null, 2)
      });
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log(`📨 PUT ${endpoint} response:`, data);

      if (response.ok) {
        return { success: true, data };
      } else {
        return { 
          success: false, 
          message: data.message || `PUT request failed with status ${response.status}`,
          error: data.error
        };
      }
    } catch (error: any) {
      console.error(`🚨 PUT ${endpoint} error:`, error);
      return { 
        success: false, 
        message: 'Network request failed',
        error: error.message 
      };
    }
  },
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);

  useEffect(() => {
    console.log('🔄 AuthProvider mounted');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      console.log('🔍 Checking auth status in SecureStore...');
      const token = await SecureStore.getItemAsync('userToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      console.log('📦 SecureStore contents:', { 
        hasToken: !!token, 
        hasUserData: !!userData 
      });
      
      if (token && userData) {
        console.log('✅ User found in storage');
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);
        
        const bioEnabled = await SecureStore.getItemAsync('biometricEnabled');
        setBiometricEnabled(bioEnabled === 'true');
        console.log('👤 User set in context:', parsedUser.name);
      } else {
        console.log('❌ No user data found in SecureStore');
      }
    } catch (error) {
      console.error('🚨 Auth check error:', error);
    } finally {
      setLoading(false);
      console.log('🏁 Auth loading set to false');
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    console.log('🔄 Updating user context with:', userData);
    setUser(prev => {
      if (!prev) {
        console.log('❌ No previous user to update');
        return null;
      }
      const updatedUser = { ...prev, ...userData };
      console.log('✅ User context updated from:', prev.name, 'to:', updatedUser.name);
      
      // Update SecureStore immediately
      SecureStore.setItemAsync('userData', JSON.stringify(updatedUser)).catch(console.error);
      
      return updatedUser;
    });
  };

  const refreshUser = async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing user data from API...');
      const response = await apiService.get<User>('/auth/profile');
      
      if (response.success && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
        console.log('✅ User data refreshed from API:', updatedUser.name);
      } else {
        console.log('❌ Failed to refresh user data:', response.message);
      }
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
    }
  };

  const login = async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.164:3000/api';
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const responseData = await response.json();
      console.log('📨 Backend response:', responseData);
      
      if (response.ok && responseData.token && responseData.user) {
        const { token, user: userData } = responseData;

        console.log('💾 Saving to SecureStore...');
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        
        console.log('✅ SecureStore save completed');
        
        setUser(userData);
        console.log('👤 User state updated:', userData.name);
        
        return {
          success: true,
          data: {
            token,
            user: userData
          }
        };
      } else {
        console.log('❌ Login failed:', responseData.message);
        return {
          success: false,
          message: responseData.message || 'Login failed',
          error: 'Invalid credentials or server error'
        };
      }
    } catch (error: any) {
      console.error('🚨 Login error:', error);
      return {
        success: false,
        message: 'Login failed',
        error: error.message,
      };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      console.log('📝 Attempting registration for:', email);
      
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.164:3000/api';
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const responseData = await response.json();
      console.log('📨 Registration backend response:', responseData);
      
      if (response.ok && responseData.token && responseData.user) {
        const { token, user: userData } = responseData;

        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        
        setUser(userData);
        console.log('✅ Registration successful, user set:', userData.name);
        
        return {
          success: true,
          data: {
            token,
            user: userData
          }
        };
      } else {
        return {
          success: false,
          message: responseData.message || 'Registration failed'
        };
      }
    } catch (error: any) {
      console.error('🚨 Registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
        error: error.message,
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Logging out...');
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('biometricEnabled');
      
      setUser(null);
      setBiometricEnabled(false);
      console.log('✅ Logout completed');
    } catch (error) {
      console.error('🚨 Logout error:', error);
    }
  };

  const enableBiometric = async (): Promise<ApiResponse<void>> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return { 
          success: false, 
          message: 'Biometric authentication not available' 
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
      });

      if (result.success) {
        await SecureStore.setItemAsync('biometricEnabled', 'true');
        setBiometricEnabled(true);
        return { success: true };
      } else {
        return { success: false, message: 'Authentication failed' };
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: 'Biometric setup failed',
        error: error.message,
      };
    }
  };

  const biometricLogin = async (): Promise<ApiResponse<void>> => {
    try {
      console.log('👆 Attempting biometric login...');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
      });

      console.log('🔐 Biometric result:', result);
      
      if (result.success) {
        const token = await SecureStore.getItemAsync('userToken');
        const userData = await SecureStore.getItemAsync('userData');
        
        console.log('📦 Biometric - SecureStore contents:', { 
          hasToken: !!token, 
          hasUserData: !!userData 
        });
        
        if (token && userData) {
          const parsedUser: User = JSON.parse(userData);
          setUser(parsedUser);
          console.log('✅ Biometric login successful');
          return { success: true };
        } else {
          console.log('❌ Biometric login failed: No user data in SecureStore');
        }
      }
      return { success: false, message: 'Biometric authentication failed' };
    } catch (error: any) {
      console.error('🚨 Biometric login error:', error);
      return { 
        success: false, 
        message: 'Biometric login failed',
        error: error.message,
      };
    }
  };

  // ✅ FIXED: Improved updateProfile with better error handling
  const updateProfile = async (profileData: {
    name?: string;
    avatar?: string;
    preferences?: any;
  }): Promise<ApiResponse<{ user: User }>> => {
    try {
      console.log('📝 Updating profile with data:', profileData);
      console.log('👤 Current user before update:', user?.name);
      
      const response = await apiService.put<{ user: User }>('/auth/profile', profileData);
      
      console.log('📨 Profile update API response:', response);
      
      if (response.success && response.data) {
        const updatedUser = response.data.user;
        console.log('🔄 Received updated user from API:', updatedUser.name);
        
        // Update user context immediately
        updateUser(updatedUser);
        
        console.log('✅ Profile updated successfully in context and storage');
        
        return response;
      } else {
        console.log('❌ Profile update failed:', response.message);
        return response;
      }
    } catch (error: any) {
      console.error('🚨 Profile update error:', error);
      return {
        success: false,
        message: 'Profile update failed',
        error: error.message,
      };
    }
  };

  const uploadAvatar = async (imageUri: string): Promise<ApiResponse<{ user: User }>> => {
    try {
      console.log('🖼️ Uploading avatar from:', imageUri);
      
      const formData = new FormData();
      
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: imageUri,
        type,
        name: filename,
      } as any);

      // Add other profile data to maintain consistency
      if (user?.name) {
        formData.append('name', user.name);
      }
      if (user?.preferences) {
        formData.append('preferences', JSON.stringify(user.preferences));
      }

      const token = await SecureStore.getItemAsync('userToken');
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.164:3000/api';
      
      console.log('📤 Uploading avatar to server...');
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('📨 Avatar upload response:', data);

      if (response.ok && data.user) {
        updateUser(data.user);
        console.log('✅ Avatar upload successful and user context updated');
        return { success: true, data: { user: data.user } };
      } else {
        console.log('❌ Avatar upload failed:', data.message);
        return { 
          success: false, 
          message: data.message || 'Avatar upload failed' 
        };
      }
    } catch (error: any) {
      console.error('🚨 Avatar upload error:', error);
      return {
        success: false,
        message: 'Avatar upload failed',
        error: error.message,
      };
    }
  };

  const pickImage = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Sorry, we need camera roll permissions to make this work!');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error: any) {
      console.error('Error picking image:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    biometricEnabled,
    login,
    register,
    logout,
    enableBiometric,
    biometricLogin,
    updateProfile,
    uploadAvatar,
    pickImage,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};