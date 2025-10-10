import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const theme = useTheme();
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return <Redirect href="/" />;
  }

  // Show loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: 'Mindful Companion',
        }}
      />
      <Tabs.Screen
        name="mood-tracker"
        options={{
          title: 'Mood',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="happy" size={size} color={color} />
          ),
          headerTitle: 'Mood Tracker',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Therapist',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" size={size} color={color} />
          ),
          headerTitle: 'AI Therapist',
        }}
      />
      <Tabs.Screen
        name="breathing"
        options={{
          title: 'Breathing',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" size={size} color={color} />
          ),
          headerTitle: 'Breathing Exercises',
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle" size={size} color={color} />
          ),
          headerTitle: 'Habit Tracker',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
          headerTitle: 'Mood Analytics',
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
          headerTitle: 'Voice Journal',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tabs>
  );
}