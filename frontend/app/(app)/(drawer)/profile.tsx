import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppScreenHeader from '../../../components/ui/AppScreenHeader';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Loading from '../../../components/ui/Loading';
import { API_CONFIG } from '../../../constants/API';
import { COLORS } from '../../../constants/Colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/auth.service';
import { Formatters } from '../../../utils/formatters';

// Helper function to convert relative avatar path to absolute URL
const getFullAvatarUrl = (avatarPath: string | undefined): string => {
  if (!avatarPath || avatarPath.trim() === '') {
    return 'https://via.placeholder.com/100';
  }
  
  // If it's already a full URL, return as-is
  if (avatarPath.startsWith('http')) {
    return `${avatarPath}?t=${Date.now()}`;
  }
  
  // Convert relative path to absolute URL
  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
  const cleanPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  return `${baseUrl}${cleanPath}?t=${Date.now()}`;
};

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    moodCount: 0,
    journalCount: 0,
    habitCount: 0,
    streak: 0,
  });

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets[0].uri) {
        await updateAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const updateAvatar = async (uri: string) => {
    try {
      setLoading(true);
      console.log('Updating avatar with URI:', uri);
      
      // Create FormData
      const formData = new FormData();
      
      // Extract file extension
      const fileExtension = uri.split('.').pop();
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      
      formData.append('avatar', {
        uri: uri,
        type: mimeType,
        name: `avatar_${Date.now()}.${fileExtension}`,
      } as any);

      console.log('FormData created, calling updateAvatar service...');
      
      const response = await authService.updateAvatar(formData);
      console.log('Avatar update response:', response);
      
      // Update user in context and storage
      await updateUser({ avatar: response.avatar });
      
      Alert.alert('Success', 'Avatar updated successfully');
    } catch (error: any) {
      console.error('Avatar update error:', error);
      console.error('Error details:', error.response?.data || error.message);
      Alert.alert('Error', error.message || 'Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await updateUser({ name, email });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (!user) {
    return <Loading fullScreen />;
  }
  
  // Get the full avatar URL
  const avatarUrl = getFullAvatarUrl(user.avatar);
  console.log('Avatar URL:', avatarUrl);
  
  return (
    <ScrollView style={styles.container}>
      <AppScreenHeader title="Profile" subtitle={user?.email} />
      {/* Profile content */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ 
              uri: avatarUrl
            }}
            style={styles.avatar}
            onError={(e) => {
              console.log('Avatar image failed to load:', e.nativeEvent.error);
              console.log('Attempted URL:', avatarUrl);
            }}
            onLoad={() => console.log('Avatar loaded successfully:', avatarUrl)}
          />
          <TouchableOpacity 
            style={styles.avatarEditButton} 
            onPress={pickImage}
            disabled={loading}
          >
            <Ionicons name="camera" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>{user.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
        
        <View style={styles.memberSince}>
          <Ionicons name="calendar" size={16} color={COLORS.textLight} />
          <Text style={styles.memberSinceText}>
            {user.createdAt 
              ? `Member since ${Formatters.date(user.createdAt)}`
              : 'Welcome!'}
          </Text>
        </View>
      </View>

      {/* Stats Overview */}
      <Card style={styles.statsCard}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.moodCount}</Text>
            <Text style={styles.statLabel}>Moods</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.journalCount}</Text>
            <Text style={styles.statLabel}>Journals</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.habitCount}</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </Card>

      {/* Profile Information */}
      <Card style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile Information</Text>
          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => {
                  setEditing(false);
                  setName(user.name || '');
                  setEmail(user.email || '');
                }}
                style={styles.editButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateProfile}
                disabled={loading}
                style={[styles.editButton, styles.saveButton]}
              >
                <Text style={styles.saveText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {editing ? (
          <>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user.name || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Created</Text>
              <Text style={styles.infoValue}>
                {user.createdAt 
                  ? Formatters.date(user.createdAt)
                  : 'N/A'}
              </Text>
            </View>
            {/* <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avatar URL</Text>
              <Text style={[styles.infoValue, { fontSize: 12, color: COLORS.primary }]} numberOfLines={1}>
                {user.avatar || 'No avatar'}
              </Text>
            </View> */}
          </>
        )}
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        {/* <Text style={styles.cardTitle}>Settings</Text> */}
        
        {/* <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="notifications" size={24} color={COLORS.text} />
          <Text style={styles.settingText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="lock-closed" size={24} color={COLORS.text} />
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="help-circle" size={24} color={COLORS.text} />
          <Text style={styles.settingText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity> */}
        
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color={COLORS.error} />
          <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      </Card>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>Heal Well</Text>
        <Text style={styles.appTagline}>Guided by Faith. Powered by AI.</Text>
        {/* <Text style={styles.appVersion}>Version 1.0.0</Text> */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.xxxl,
    paddingTop: SPACING.xxxl + 28,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberSinceText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  statsCard: {
    margin: 16,
    marginTop: -30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  infoCard: {
    margin: 16,
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  saveText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    maxWidth: '60%',
  },
  settingsCard: {
    margin: 16,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  logoutText: {
    color: COLORS.error,
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
    paddingBottom: 60,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 12,
    color: COLORS.textLight,
  },
});