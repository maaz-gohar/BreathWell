import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/Colors';
import { Formatters } from '../../utils/formatters';
import Card from '../ui/Card';

interface HabitCardProps {
  habit: any;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function HabitCard({
  habit,
  onComplete,
  onEdit,
  onDelete,
}: HabitCardProps) {
  // FIX: Check entries array instead of completedDates
  const isTodayCompleted = React.useMemo(() => {
    if (!habit.entries || !Array.isArray(habit.entries)) {
      return false;
    }
    
    const today = Formatters.date(new Date(), 'yyyy-MM-dd');
    return habit.entries.some((entry: any) => {
      if (!entry.completed) return false;
      
      // Convert entry date to same format for comparison
      const entryDate = Formatters.date(new Date(entry.date), 'yyyy-MM-dd');
      return entryDate === today;
    });
  }, [habit.entries]);

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{habit.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{habit.category}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Ionicons name="trash" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      {habit.description && (
        <Text style={styles.description}>{habit.description}</Text>
      )}

      <View style={styles.footer}>
        <View style={styles.streakContainer}>
          <Ionicons name="flame" size={16} color={COLORS.accent} />
          <Text style={styles.streakText}>{habit.streakCount} day streak</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.completeButton,
            isTodayCompleted && styles.completedButton,
          ]}
          onPress={onComplete}
          disabled={isTodayCompleted} // Optional: disable if already completed
        >
          <Ionicons
            name={isTodayCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={isTodayCompleted ? COLORS.success : COLORS.primary}
          />
          <Text style={styles.completeText}>
            {isTodayCompleted ? 'Completed' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  completedButton: {
    backgroundColor: '#D1FAE5',
  },
  completeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 6,
  },
});