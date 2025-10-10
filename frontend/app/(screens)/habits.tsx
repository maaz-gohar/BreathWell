import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Text, Title, Button, Card, TextInput, Dialog, Portal } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { RootStackParamList, Habit, StreakStats } from '../../types';

type HabitsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Habits'>;

interface Props {
  navigation: HabitsScreenNavigationProp;
}

const HabitsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'health' as 'health' | 'mindfulness' | 'productivity' | 'self_care',
  });

  useEffect(() => {
    loadHabits();
    loadStats();
  }, []);

  const loadHabits = async (): Promise<void> => {
    try {
      console.log('🚀 Loading habits from API...');
      const response = await apiService.get<any>('/habits');
      console.log('📦 Full API response:', JSON.stringify(response, null, 2));
      
      // ✅ FIXED: Handle apiService wrapper structure
      // apiService returns: { success: boolean, data?: any, message?: string }
      let habitsData: Habit[] = [];

      if (response.success && response.data) {
        // Case 1: Response has success: true and data property
        console.log('✅ Response has success and data');
        const responseData = response.data;
        
        if (Array.isArray(responseData.habits)) {
          habitsData = responseData.habits;
        } else if (Array.isArray(responseData)) {
          habitsData = responseData;
        } else if (responseData && responseData.habits && Array.isArray(responseData.habits)) {
          habitsData = responseData.habits;
        }
      } else if (response.success && response.habits) {
        // Case 2: Response has success: true and habits property
        console.log('✅ Response has success and habits');
        habitsData = response.habits;
      } else if (Array.isArray(response)) {
        // Case 3: Response is directly the array (fallback)
        console.log('✅ Response is direct array');
        habitsData = response;
      } else if (response.habits && Array.isArray(response.habits)) {
        // Case 4: Response has habits property directly
        console.log('✅ Response has habits property directly');
        habitsData = response.habits;
      } else {
        console.log('❌ No habits found in response structure:', Object.keys(response));
        habitsData = [];
      }

      console.log('🎯 Final habits data to set:', habitsData);
      setHabits(habitsData);
      
    } catch (error) {
      console.error('❌ Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits');
      setHabits([]);
    } finally {
      setRefreshing(false);
    }
  };

  const loadStats = async (): Promise<void> => {
    try {
      const response = await apiService.get<any>('/habits/streaks');
      console.log('📊 Stats response:', response);
      
      // ✅ FIXED: Handle apiService wrapper for stats
      let statsData = response;
      
      if (response.success && response.data) {
        statsData = response.data;
      }
      
      if (statsData && (statsData.completedToday !== undefined || statsData.totalStreaks !== undefined)) {
        setStats(statsData);
      } else {
        // Create default stats if API doesn't return them
        const completedToday = habits.filter(habit => 
          habit.entries && habit.entries.some(entry => {
            try {
              const today = new Date().toDateString();
              const entryDate = new Date(entry.date).toDateString();
              return entryDate === today && entry.completed === true;
            } catch {
              return false;
            }
          })
        ).length;
        
        const totalStreaks = habits.reduce((sum, habit) => sum + (habit.streakCount || 0), 0);
        const bestStreak = Math.max(...habits.map(habit => habit.bestStreak || 0), 0);
        
        setStats({
          completedToday,
          totalStreaks,
          bestStreak,
          totalHabits: habits.length
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Create default stats on error
      const completedToday = habits.filter(habit => 
        habit.entries && habit.entries.some(entry => {
          try {
            const today = new Date().toDateString();
            const entryDate = new Date(entry.date).toDateString();
            return entryDate === today && entry.completed === true;
          } catch {
            return false;
          }
        })
      ).length;
      
      const totalStreaks = habits.reduce((sum, habit) => sum + (habit.streakCount || 0), 0);
      const bestStreak = Math.max(...habits.map(habit => habit.bestStreak || 0), 0);
      
      setStats({
        completedToday,
        totalStreaks,
        bestStreak,
        totalHabits: habits.length
      });
    }
  };

  const handleAddHabit = async (): Promise<void> => {
    if (!newHabit.name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    setLoading(true);
    try {
      console.log('➕ Adding new habit:', newHabit);
      const response = await apiService.post<any>('/habits', newHabit);
      console.log('📨 Add habit response:', response);

      // ✅ FIXED: Handle apiService wrapper for new habit
      let newHabitData: Habit | null = null;

      if (response.success && response.data) {
        // Response has success and data
        const responseData = response.data;
        if (responseData.habit) {
          newHabitData = responseData.habit;
        } else if (responseData._id) {
          newHabitData = responseData;
        }
      } else if (response.success && response.habit) {
        // Response has success and habit
        newHabitData = response.habit;
      } else if (response._id) {
        // Direct habit object
        newHabitData = response;
      } else if (response.habit && response.habit._id) {
        // Nested in habit property
        newHabitData = response.habit;
      }

      if (newHabitData) {
        console.log('✅ New habit created:', newHabitData);
        setHabits(prev => [newHabitData!, ...prev]);
        setShowAddDialog(false);
        setNewHabit({ name: '', description: '', category: 'health' });
        await loadStats();
        Alert.alert('Success', 'Habit created successfully!');
      } else {
        console.log('❌ No habit data in response, reloading...');
        // If we can't parse the response, reload all habits
        await loadHabits();
        setShowAddDialog(false);
        setNewHabit({ name: '', description: '', category: 'health' });
        Alert.alert('Success', 'Habit created successfully!');
      }
    } catch (error: any) {
      console.error('❌ Error adding habit:', error);
      Alert.alert('Error', error.message || 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habitId: string): Promise<void> => {
    try {
      console.log('🔄 Toggling habit:', habitId);
      const response = await apiService.post(`/habits/${habitId}/complete`);
      console.log('🔄 Toggle response:', response);

      // Reload all habits to get updated data
      await loadHabits();
      await loadStats();
      
    } catch (error: any) {
      console.error('Error toggling habit:', error);
      Alert.alert('Error', error.message || 'Failed to update habit');
    }
  };

  const handleDeleteHabit = (habitId: string): void => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.delete(`/habits/${habitId}`);
              // Remove from local state immediately
              setHabits(prev => prev.filter(habit => habit._id !== habitId));
              await loadStats();
              Alert.alert('Success', 'Habit deleted successfully');
            } catch (error: any) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', error.message || 'Failed to delete habit');
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      health: '#4CAF50',
      mindfulness: '#2196F3',
      productivity: '#FF9800',
      self_care: '#9C27B0',
    };
    return colors[category as keyof typeof colors] || '#666';
  };

  const isHabitCompletedToday = (habit: Habit): boolean => {
    if (!habit.entries || !Array.isArray(habit.entries)) return false;
    
    const today = new Date().toDateString();
    return habit.entries.some(entry => {
      if (!entry || !entry.date) return false;
      try {
        const entryDate = new Date(entry.date).toDateString();
        return entryDate === today && entry.completed === true;
      } catch (error) {
        return false;
      }
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHabits();
    loadStats();
  };

  const handleCloseDialog = () => {
    Keyboard.dismiss(); // Dismiss keyboard first
    setShowAddDialog(false);
    setNewHabit({ name: '', description: '', category: 'health' });
  };

  // Debug: Log current state
  console.log('🔍 Habits Screen State:', {
    habitsCount: habits.length,
    habits: habits,
    stats: stats,
    loading: loading,
    refreshing: refreshing
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header with Refresh Button */}
        <View style={styles.header}>
          <Title style={styles.title}>Habit Tracker</Title>
          <Button 
            mode="outlined" 
            onPress={handleRefresh}
            icon="refresh"
            compact
            loading={refreshing}
          >
            Refresh
          </Button>
        </View>

        {/* Stats Overview */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Your Progress</Title>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats?.completedToday || 0}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats?.totalStreaks || 0}</Text>
                <Text style={styles.statLabel}>Total Streaks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats?.bestStreak || 0}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{habits.length}</Text>
                <Text style={styles.statLabel}>Total Habits</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Habits List */}
        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>
              Your Habits ({habits.length})
            </Title>
            <Button
              mode="contained"
              onPress={() => setShowAddDialog(true)}
              style={styles.addButton}
              icon="plus"
            >
              Add Habit
            </Button>
          </View>

          {habits.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyText}>
                  No habits yet. Start building healthy routines!
                </Text>
                <Text style={styles.emptySubtext}>
                  Your habits will appear here once loaded.
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => setShowAddDialog(true)}
                  style={styles.emptyButton}
                >
                  Create Your First Habit
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={handleRefresh}
                  style={styles.refreshButton}
                >
                  Refresh List
                </Button>
              </Card.Content>
            </Card>
          ) : (
            habits.map(habit => (
              <Card key={habit._id} style={styles.habitCard}>
                <Card.Content>
                  <View style={styles.habitHeader}>
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      {habit.description && (
                        <Text style={styles.habitDescription}>{habit.description}</Text>
                      )}
                      <View style={styles.habitMeta}>
                        <Text 
                          style={[
                            styles.habitCategory,
                            { color: getCategoryColor(habit.category) }
                          ]}
                        >
                          {habit.category.replace('_', ' ')}
                        </Text>
                        <Text style={styles.streakText}>
                          🔥 {habit.streakCount || 0} day streak
                        </Text>
                        {habit.bestStreak > 0 && (
                          <Text style={styles.bestStreakText}>
                            🏆 Best: {habit.bestStreak}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.completeButton,
                        isHabitCompletedToday(habit) && styles.completeButtonActive
                      ]}
                      onPress={() => handleToggleHabit(habit._id)}
                    >
                      <Text style={styles.completeButtonText}>
                        {isHabitCompletedToday(habit) ? '✓' : '+'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.habitActions}>
                    <Button
                      mode="text"
                      onPress={() => handleDeleteHabit(habit._id)}
                      textColor="#F44336"
                      compact
                    >
                      Delete
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Habit Dialog */}
      <Portal>
        <Dialog 
          visible={showAddDialog} 
          onDismiss={handleCloseDialog}
          dismissable={true} // ✅ Added: Allows dismissing by clicking outside
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <Dialog.Title>Add New Habit</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  label="Habit Name *"
                  value={newHabit.name}
                  onChangeText={(text) => setNewHabit(prev => ({ ...prev, name: text }))}
                  mode="outlined"
                  style={styles.dialogInput}
                  placeholder="e.g., Morning Meditation"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss} // ✅ Dismiss keyboard on return
                />
                <TextInput
                  label="Description (Optional)"
                  value={newHabit.description}
                  onChangeText={(text) => setNewHabit(prev => ({ ...prev, description: text }))}
                  mode="outlined"
                  multiline
                  style={styles.dialogInput}
                  placeholder="e.g., 10 minutes of meditation every morning"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss} // ✅ Dismiss keyboard on return
                  blurOnSubmit={true} // ✅ Dismiss keyboard when submitted
                />
                <Text style={styles.categoryLabel}>Category</Text>
                <View style={styles.categoryButtons}>
                  {(['health', 'mindfulness', 'productivity', 'self_care'] as const).map(category => (
                    <Button
                      key={category}
                      mode={newHabit.category === category ? "contained" : "outlined"}
                      onPress={() => {
                        Keyboard.dismiss(); // ✅ Dismiss keyboard when selecting category
                        setNewHabit(prev => ({ ...prev, category }));
                      }}
                      style={styles.categoryButton}
                      compact
                    >
                      {category.replace('_', ' ')}
                    </Button>
                  ))}
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={handleCloseDialog}>Cancel</Button>
                <Button 
                  onPress={handleAddHabit} 
                  loading={loading}
                  disabled={loading || !newHabit.name.trim()}
                >
                  Add Habit
                </Button>
              </Dialog.Actions>
            </View>
          </TouchableWithoutFeedback>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsCard: {
    marginBottom: 20,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  habitsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
  },
  addButton: {
    borderRadius: 20,
  },
  emptyCard: {
    marginBottom: 16,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
  },
  emptyButton: {
    borderRadius: 20,
    marginBottom: 8,
  },
  refreshButton: {
    borderRadius: 20,
  },
  habitCard: {
    marginBottom: 12,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  habitInfo: {
    flex: 1,
    marginRight: 12,
  },
  habitName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  streakText: {
    fontSize: 12,
    color: '#FF9800',
  },
  bestStreakText: {
    fontSize: 12,
    color: '#FFD700',
  },
  completeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  habitActions: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  dialogInput: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    margin: 4,
  },
});

export default HabitsScreen;