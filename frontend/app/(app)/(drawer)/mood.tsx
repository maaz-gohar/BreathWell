import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MoodPicker from '../../../components/mood/MoodPicker';
import AppScreenHeader from '../../../components/ui/AppScreenHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { COLORS } from '../../../constants/Colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import { moodService } from '../../../services/mood.service';
import { Formatters } from '../../../utils/formatters';

// Map mood names to emojis for the picker
const MOOD_EMOJI_MAP: Record<string, string> = {
  excellent: '😊',
  good: '🙂',
  okay: '😐',
  poor: '😔',
  terrible: '😢'
};

// Map mood names to scores (1-10)
const MOOD_SCORE_MAP: Record<string, number> = {
  excellent: 9,
  good: 7,
  okay: 5,
  poor: 3,
  terrible: 1
};

export default function MoodScreen() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [todayMood, setTodayMood] = useState<any>(null);
  const [weeklyMoods, setWeeklyMoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMoodData();
  }, []);

  const fetchMoodData = async () => {
    try {
      const [today, weekly] = await Promise.all([
        moodService.getTodayMood(),
        moodService.getWeeklyMoods(),
      ]);
      setTodayMood(today);
      setWeeklyMoods(weekly);
    } catch (error) {
      console.error('Failed to fetch mood data:', error);
    }
  };

  const handleAddMood = async () => {
    if (!selectedMood) {
      Alert.alert('Error', 'Please select your mood');
      return;
    }

    setLoading(true);
    try {
      // Convert frontend data to backend format
      const moodData = {
        moodEmoji: MOOD_EMOJI_MAP[selectedMood] || '😐',
        moodScore: intensity, // Use the intensity slider value
        note: note,
        tags: tags.length > 0 ? tags : [selectedMood]
      };

      console.log('Sending mood data:', moodData);
      
      await moodService.addMood(moodData);
      Alert.alert('Success', 'Mood recorded successfully');
      
      // Reset form
      setSelectedMood(null);
      setIntensity(5);
      setNote('');
      setTags([]);
      
      // Refresh data
      fetchMoodData();
    } catch (error: any) {
      console.error('Mood recording error:', error);
      Alert.alert('Error', error.message || 'Failed to record mood');
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (moodEmoji: string) => {
    // Map emojis to colors
    const emojiColorMap: Record<string, string> = {
      '😊': COLORS.mood.excellent,
      '🙂': COLORS.mood.good,
      '😐': COLORS.mood.okay,
      '😔': COLORS.mood.poor,
      '😢': COLORS.mood.terrible
    };
    return emojiColorMap[moodEmoji] || COLORS.textLight;
  };

  const getMoodNameFromEmoji = (emoji: string): string => {
    const emojiNameMap: Record<string, string> = {
      '😊': 'Excellent',
      '🙂': 'Good',
      '😐': 'Okay',
      '😔': 'Poor',
      '😢': 'Terrible'
    };
    return emojiNameMap[emoji] || 'Unknown';
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <ScrollView style={styles.container}>
      <AppScreenHeader title="Mood Tracker" subtitle="How are you feeling today?" />

      {/* Today's Mood */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Mood</Text>
        {todayMood ? (
          <View style={styles.todayMoodContainer}>
            <View
              style={[
                styles.moodIndicator,
                { backgroundColor: getMoodColor(todayMood.moodEmoji) },
              ]}
            >
              <Text style={styles.moodEmoji}>
                {todayMood.moodEmoji}
              </Text>
            </View>
            <View style={styles.moodDetails}>
              <Text style={styles.moodText}>
                {getMoodNameFromEmoji(todayMood.moodEmoji)} ({todayMood.moodScore}/10)
              </Text>
              {todayMood.note && (
                <Text style={styles.moodNote}>{todayMood.note}</Text>
              )}
              <Text style={styles.moodTime}>
                Recorded at {Formatters.time(todayMood.createdAt)}
              </Text>
              {todayMood.tags && todayMood.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {todayMood.tags.map((tag: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.noMoodText}>No mood recorded today</Text>
        )}
      </Card>

      {/* Add Mood */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Record New Mood</Text>
        
        <MoodPicker
          selectedMood={selectedMood}
          onSelectMood={setSelectedMood}
        />

        <View style={styles.intensityContainer}>
          <Text style={styles.intensityLabel}>
            Intensity: {intensity}/10
          </Text>
          <View style={styles.sliderContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.sliderDot,
                  intensity >= value && styles.sliderDotActive,
                ]}
                onPress={() => setIntensity(value)}
              />
            ))}
          </View>
        </View>

        <Input
          label="Add a note (optional)"
          placeholder="How are you feeling?"
          value={note}
          onChangeText={setNote}
          // multiline
          // numberOfLines={3}
          // style={styles.noteInput}
        />

        {/* Tags Input */}
        <View style={styles.tagsInputContainer}>
          <Text style={styles.tagsLabel}>Tags (optional)</Text>
          <Input
            placeholder="Add a tag and press enter"
            onSubmitEditing={(e) => {
              addTag(e.nativeEvent.text);
              (e.currentTarget as any).clear && (e.currentTarget as any).clear();
            }}
            blurOnSubmit={false}
          />
          {tags.length > 0 && (
            <View style={styles.tagsList}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tagInput}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={styles.tagInputText}>#{tag} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Button
          title="Record Mood"
          onPress={handleAddMood}
          loading={loading}
          disabled={!selectedMood}
        />
      </Card>

      {/* Weekly Overview */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Overview</Text>
        <View style={styles.weekContainer}>
          {weeklyMoods.length > 0 ? (
            weeklyMoods.map((mood, index) => (
              <View key={index} style={styles.dayContainer}>
                <Text style={styles.dayLabel}>
                  {Formatters.date(mood.date || mood.createdAt, 'EEE')}
                </Text>
                <View
                  style={[
                    styles.dayMood,
                    { backgroundColor: getMoodColor(mood.moodEmoji) },
                  ]}
                >
                  <Text style={styles.dayEmoji}>
                    {mood.moodEmoji}
                  </Text>
                </View>
                <Text style={styles.dayScore}>
                  {mood.moodScore}/10
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noWeeklyData}>No mood data for this week</Text>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxxl + 8,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  title: {
    ...TYPOGRAPHY.heading1,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    margin: SPACING.lg,
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  todayMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodDetails: {
    flex: 1,
  },
  moodText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  moodNote: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  moodTime: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  noMoodText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    padding: 20,
  },
  intensityContainer: {
    marginVertical: 20,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  sliderDotActive: {
    backgroundColor: COLORS.primary,
  },
  noteInput: {
    marginVertical: 16,
  },
  tagsInputContainer: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagInput: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagInputText: {
    fontSize: 14,
    color: COLORS.text,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 100,
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  dayMood: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayEmoji: {
    fontSize: 20,
  },
  dayScore: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
  },
  noWeeklyData: {
    textAlign: 'center',
    color: COLORS.textLight,
    padding: 20,
    width: '100%',
  },
});