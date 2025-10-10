import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { 
  Text, 
  Title, 
  Button, 
  Card, 
  TextInput, 
  Avatar, 
  List,
  ActivityIndicator,
  Menu,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { UserPreferences, EmergencyContact } from '../../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.164:3000';

export default function ProfileScreen() {
  const { 
    user, 
    logout, 
    enableBiometric, 
    biometricEnabled, 
    updateProfile,
    uploadAvatar,
    pickImage,
  } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  
  const [preferences, setPreferences] = useState<UserPreferences>(
    user?.preferences || { theme: 'light', notifications: true }
  );
  
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(
    user?.preferences?.emergencyContact || { name: '', phone: '' }
  );

  const getAbsoluteAvatarUrl = (avatarPath: string | undefined): string | undefined => {
    if (!avatarPath) return undefined;
    
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    
    if (avatarPath.startsWith('/')) {
      const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
      const absoluteUrl = `${API_BASE_URL.replace('/api', '')}/${cleanPath}`;
      return absoluteUrl;
    }
    
    const absoluteUrl = `${API_BASE_URL.replace('/api', '')}/avatars/${avatarPath}`;
    return absoluteUrl;
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
      });
      setPreferences(user.preferences || { theme: 'light', notifications: true });
      setEmergencyContact(user.preferences?.emergencyContact || { name: '', phone: '' });
    }
  }, [user]);

  const handleSaveProfile = async (): Promise<void> => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving profile data:', {
        name: profileData.name,
        preferences: {
          ...preferences,
          emergencyContact: emergencyContact.name && emergencyContact.phone 
            ? emergencyContact 
            : undefined,
        },
      });

      const result = await updateProfile({
        name: profileData.name,
        preferences: {
          ...preferences,
          emergencyContact: emergencyContact.name && emergencyContact.phone 
            ? emergencyContact 
            : undefined,
        },
      });

      console.log('📨 Profile update result:', result);

      if (result.success) {
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert(
          'Update Failed', 
          result.message || 'Failed to update profile. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('🚨 Profile update error:', error);
      Alert.alert(
        'Error', 
        error.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (): Promise<void> => {
    try {
      setUploading(true);
      const imageUri = await pickImage();
      
      if (imageUri) {
        console.log('🖼️ Uploading avatar from:', imageUri);
        const result = await uploadAvatar(imageUri);
        
        if (result.success) {
          Alert.alert('Success', 'Avatar updated successfully');
        } else {
          Alert.alert('Error', result.message || 'Failed to upload avatar');
        }
      }
    } catch (error: any) {
      console.error('Error changing avatar:', error);
      Alert.alert('Error', error.message || 'Failed to change avatar');
    } finally {
      setUploading(false);
      setMenuVisible(false);
    }
  };

  const handleRemoveAvatar = async (): Promise<void> => {
    try {
      setUploading(true);
      console.log('🗑️ Removing avatar...');
      const result = await updateProfile({ avatar: '' });
      
      if (result.success) {
        Alert.alert('Success', 'Avatar removed successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to remove avatar');
      }
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      Alert.alert('Error', error.message || 'Failed to remove avatar');
    } finally {
      setUploading(false);
      setMenuVisible(false);
    }
  };

  const handleEnableBiometric = async (): Promise<void> => {
    try {
      const result = await enableBiometric();
      if (result.success) {
        Alert.alert('Success', 'Biometric login enabled');
      } else {
        Alert.alert('Error', result.message || 'Failed to enable biometric login');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to enable biometric login');
    }
  };

  const handleLogout = (): void => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type "DELETE" to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Info', 'Account deletion feature would be implemented here');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const getAvatarLabel = (): string => {
    return user?.name
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'U';
  };

  const avatarUrl = getAbsoluteAvatarUrl(user?.avatar);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {uploading ? (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator size="large" color="#2196F3" />
                  </View>
                ) : (
                  <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                      <Avatar.Image
                        size={100}
                        source={avatarUrl ? { uri: avatarUrl } : undefined}
                        label={getAvatarLabel()}
                        style={styles.avatar}
                        onPress={() => setMenuVisible(true)}
                        onError={(error) => {
                          console.error('❌ Avatar loading error:', error.nativeEvent);
                        }}
                      />
                    }
                  >
                    <Menu.Item 
                      onPress={handleAvatarChange} 
                      title="Change Avatar" 
                      leadingIcon="camera" 
                    />
                    {user?.avatar && (
                      <Menu.Item 
                        onPress={handleRemoveAvatar} 
                        title="Remove Avatar" 
                        leadingIcon="delete" 
                      />
                    )}
                  </Menu>
                )}
                <Text style={styles.avatarHint}>
                  Tap to change
                </Text>
              </View>
              
              <View style={styles.profileInfo}>
                {editing ? (
                  <TextInput
                    label="Name"
                    value={profileData.name}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                    mode="outlined"
                    style={styles.editInput}
                    disabled={loading}
                  />
                ) : (
                  <>
                    <Title style={styles.profileName}>{user?.name}</Title>
                    <Text style={styles.profileEmail}>{user?.email}</Text>
                  </>
                )}
              </View>
            </View>
            
            <View style={styles.profileActions}>
              {editing ? (
                <View style={styles.editActions}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setEditing(false);
                      // Reset form data
                      if (user) {
                        setProfileData({
                          name: user.name,
                          email: user.email,
                        });
                        setPreferences(user.preferences || { theme: 'light', notifications: true });
                        setEmergencyContact(user.preferences?.emergencyContact || { name: '', phone: '' });
                      }
                    }}
                    style={styles.cancelButton}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveProfile}
                    loading={loading}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </View>
              ) : (
                <Button
                  mode="outlined"
                  onPress={() => setEditing(true)}
                  icon="pencil"
                >
                  Edit Profile
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Preferences */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Preferences</Title>
            
            <List.Item
              title="Notifications"
              description="Receive daily reminders and updates"
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={preferences.notifications}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, notifications: value }))}
                  disabled={!editing || loading}
                />
              )}
            />
            
            <List.Item
              title="Biometric Login"
              description="Use fingerprint or face ID to login"
              left={props => <List.Icon {...props} icon="fingerprint" />}
              right={() => (
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleEnableBiometric}
                  disabled={loading}
                />
              )}
            />

            <List.Item
              title="Dark Mode"
              description="Use dark theme throughout the app"
              left={props => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={preferences.theme === 'dark'}
                  onValueChange={(value) => setPreferences(prev => ({ 
                    ...prev, 
                    theme: value ? 'dark' : 'light' 
                  }))}
                  disabled={!editing || loading}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Emergency Contact */}
        {editing && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Emergency Contact</Title>
              
              <TextInput
                label="Contact Name"
                value={emergencyContact.name}
                onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, name: text }))}
                mode="outlined"
                style={styles.contactInput}
                disabled={!editing || loading}
              />
              
              <TextInput
                label="Phone Number"
                value={emergencyContact.phone}
                onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, phone: text }))}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.contactInput}
                disabled={!editing || loading}
              />
              
              <Text style={styles.contactNote}>
                This contact will be notified in case of crisis situations.
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* App Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>App Information</Title>
            
            <List.Item
              title="Version"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />
            
            <List.Item
              title="Privacy Policy"
              left={props => <List.Icon {...props} icon="shield-account" />}
              onPress={() => Alert.alert('Privacy Policy', 'Privacy policy would be shown here')}
            />
            
            <List.Item
              title="Terms of Service"
              left={props => <List.Icon {...props} icon="file-document" />}
              onPress={() => Alert.alert('Terms', 'Terms of service would be shown here')}
            />
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={styles.dangerCard}>
          <Card.Content>
            <Title style={styles.dangerTitle}>Danger Zone</Title>
            
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              textColor="#F44336"
              icon="logout"
            >
              Logout
            </Button>
            
            <Button
              mode="text"
              onPress={handleDeleteAccount}
              textColor="#F44336"
              icon="delete"
            >
              Delete Account
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 20,
    elevation: 4,
  },
  profileContent: {
    paddingVertical: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  avatar: {
    backgroundColor: '#2196F3',
  },
  avatarLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  editInput: {
    marginBottom: 8,
  },
  profileActions: {
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    marginRight: 8,
  },
  sectionCard: {
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  contactInput: {
    marginBottom: 12,
  },
  contactNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  dangerCard: {
    marginBottom: 20,
    borderColor: '#F44336',
    borderWidth: 1,
    elevation: 2,
  },
  dangerTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#F44336',
  },
  logoutButton: {
    marginBottom: 12,
    borderColor: '#F44336',
  },
});