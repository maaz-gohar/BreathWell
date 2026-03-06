import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import HabitCard from '../../../components/habits/HabitCard';
import HabitForm from '../../../components/habits/HabitForm';
import AppScreenHeader from '../../../components/ui/AppScreenHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Loading from '../../../components/ui/Loading';
import { COLORS } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import { habitService } from '../../../services/habit.service';
import type { StreakSummary } from '../../../types'; // Add this import

export default function HabitsScreen() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [streakSummary, setStreakSummary] = useState<StreakSummary | null>(null); // Add this
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const [habitsData, streaksData, summaryData] = await Promise.all([
        habitService.getHabits(),
        habitService.getStreaks(),
        habitService.getStreakSummary(), // Add this
      ]);
      setHabits(habitsData || []);
      setStreaks(streaksData || []);
      setStreakSummary(summaryData); // Add this
    } catch (error) {
      console.error('Failed to fetch habits:', error);
      setHabits([]);
      setStreaks([]);
      setStreakSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteHabit = async (id: string) => {
    try {
      console.log('Completing habit:', id);
      await habitService.completeHabit(id);
      fetchHabits(); // Refresh all data
    } catch (error: any) {
      console.error('Complete habit error:', error);
      Alert.alert('Error', `Failed to complete habit: ${error.message}`);
    }
  };

  const handleDeleteHabit = async (id: string) => {
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
              await habitService.deleteHabit(id);
              fetchHabits();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete habit');
            }
          },
        },
      ]
    );
  };

  const handleEditHabit = (habit: any) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingHabit) {
        await habitService.updateHabit(editingHabit._id, data);
      } else {
        await habitService.createHabit(data);
      }
      setShowForm(false);
      setEditingHabit(null);
      fetchHabits();
    } catch (error) {
      Alert.alert('Error', 'Failed to save habit');
    }
  };

  // FIX THE LOADING CHECK
  if (loading) {
    return <Loading fullScreen text="Loading habits..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <AppScreenHeader title="Habit Tracker" subtitle="Build healthy routines" />

      {/* Streaks Summary - Updated to use streakSummary */}
      {streakSummary && (
        <Card style={styles.streaksCard}>
          <Text style={styles.sectionTitle}>Streak Summary</Text>
          <View style={styles.streaksContainer}>
            <View style={styles.streakItem}>
              <View style={styles.streakCircle}>
                <Text style={styles.streakCount}>{streakSummary.totalStreaks}</Text>
                <Text style={styles.streakLabel}>total</Text>
              </View>
              <Text style={styles.streakName}>Current Streak</Text>
            </View>
            
            <View style={styles.streakItem}>
              <View style={styles.streakCircle}>
                <Text style={styles.streakCount}>{streakSummary.bestStreak}</Text>
                <Text style={styles.streakLabel}>days</Text>
              </View>
              <Text style={styles.streakName}>Best Streak</Text>
            </View>
            
            <View style={styles.streakItem}>
              <View style={styles.streakCircle}>
                <Text style={styles.streakCount}>{streakSummary.completedToday}</Text>
                <Text style={styles.streakLabel}>of {streakSummary.totalHabits}</Text>
              </View>
              <Text style={styles.streakName}>Today</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Habits List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Habits</Text>
          <Button
            title="Add Habit"
            onPress={() => setShowForm(true)}
            icon={<Ionicons name="add" size={20} color="#FFFFFF" />}
            size="small"
          />
        </View>

        {habits.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No habits yet</Text>
            <Text style={styles.emptySubtext}>
              Start building healthy habits today
            </Text>
            <Button
              title="Create First Habit"
              onPress={() => setShowForm(true)}
              style={styles.createButton}
            />
          </Card>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit._id}
              habit={habit}
              onComplete={() => handleCompleteHabit(habit._id)}
              onEdit={() => handleEditHabit(habit)}
              onDelete={() => handleDeleteHabit(habit._id)}
            />
          ))
        )}
      </View>

      {/* Habit Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <HabitForm
          initialData={editingHabit}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingHabit(null);
          }}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    paddingTop: 30,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  streaksCard: {
    margin: 16,
    marginTop: 20,
  },
  streaksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  streakName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    width: '100%',
  },
});