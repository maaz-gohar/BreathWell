import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/Colors';

interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { id: 'excellent', label: 'Excellent', emoji: '😊', color: COLORS.mood.excellent },
  { id: 'good', label: 'Good', emoji: '🙂', color: COLORS.mood.good },
  { id: 'okay', label: 'Okay', emoji: '😐', color: COLORS.mood.okay },
  { id: 'poor', label: 'Poor', emoji: '😔', color: COLORS.mood.poor },
  { id: 'terrible', label: 'Terrible', emoji: '😢', color: COLORS.mood.terrible },
];

interface MoodPickerProps {
  selectedMood: string | null;
  onSelectMood: (mood: string) => void;
}

export default function MoodPicker({ selectedMood, onSelectMood }: MoodPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <View style={styles.moodGrid}>
        {MOOD_OPTIONS.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodButton,
              selectedMood === mood.id && {
                backgroundColor: mood.color,
                borderColor: mood.color,
              },
            ]}
            onPress={() => onSelectMood(mood.id)}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                selectedMood === mood.id && styles.selectedMoodLabel,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  moodButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    width: '18%',
    marginBottom: 10,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 5,
  },
  moodLabel: {
    fontSize: 8,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedMoodLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
});