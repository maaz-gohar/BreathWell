import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Title, TextInput, Button, Card } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMood } from '../../context/MoodContext';
import { RootStackParamList } from '../../types';

type MoodTrackerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MoodTracker'>;

interface Props {
  navigation: MoodTrackerScreenNavigationProp;
}

interface MoodOption {
  emoji: string;
  label: string;
  score: number;
}

const MoodTrackerScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [note, setNote] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { addMood, todayMood, fetchTodayMood } = useMood();

  const moodOptions: MoodOption[] = [
    { emoji: '😢', label: 'Sad', score: 2 },
    { emoji: '😔', label: 'Down', score: 3 },
    { emoji: '😐', label: 'Neutral', score: 5 },
    { emoji: '😊', label: 'Good', score: 7 },
    { emoji: '😄', label: 'Great', score: 9 },
    { emoji: '🤩', label: 'Amazing', score: 10 },
  ];

  const handleMoodSelect = (mood: MoodOption): void => {
    setSelectedMood(mood);
  };

  const handleSaveMood = async (): Promise<void> => {
    if (!selectedMood) {
      Alert.alert('Error', 'Please select a mood');
      return;
    }

    // Check if user already logged a mood today
    if (todayMood) {
      Alert.alert(
        'Mood Already Logged',
        'You have already logged your mood today. Would you like to update it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update',
            style: 'default',
            onPress: () => updateExistingMood()
          }
        ]
      );
      return;
    }

    await saveNewMood();
  };

  const saveNewMood = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await addMood({
        moodEmoji: selectedMood!.emoji,
        moodScore: selectedMood!.score,
        note: note.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        date: new Date().toISOString(),
      });

      if (result.success) {
        Alert.alert('Success', 'Mood logged successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Refresh today's mood
              fetchTodayMood();
              // Navigate back only if we're not on the main screen
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }
          }
        ]);
        
        // Reset form
        setSelectedMood(null);
        setNote('');
        setTags('');
      } else {
        Alert.alert('Error', result.message || 'Failed to log mood');
      }
    } catch (error: any) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', error.message || 'Failed to log mood');
    } finally {
      setLoading(false);
    }
  };

  const updateExistingMood = async (): Promise<void> => {
    // For now, we'll just show a message since your backend doesn't support updates
    // In a real app, you would implement an update endpoint
    Alert.alert(
      'Update Not Available',
      'To update your mood for today, please delete the existing entry first or wait until tomorrow to log a new mood.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteTodayMood = (): void => {
    Alert.alert(
      'Delete Today\'s Mood',
      'Are you sure you want to delete today\'s mood entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // This would call a delete endpoint if you implement it
            Alert.alert(
              'Delete Feature',
              'Mood deletion feature would be implemented here with a proper API endpoint.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  // Check if we should show the update interface
  const shouldShowUpdateInterface = todayMood && selectedMood;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>How are you feeling today?</Title>
        
        {/* Current Mood Display */}
        {todayMood && (
          <Card style={styles.currentMoodCard}>
            <Card.Content>
              <View style={styles.currentMoodHeader}>
                <Title>Today's Mood</Title>
                <Button 
                  mode="text" 
                  onPress={handleDeleteTodayMood}
                  textColor="#F44336"
                  compact
                >
                  Delete
                </Button>
              </View>
              <View style={styles.currentMood}>
                <Text style={styles.currentMoodEmoji}>{todayMood.moodEmoji}</Text>
                <View style={styles.currentMoodDetails}>
                  <Text style={styles.currentMoodScore}>Score: {todayMood.moodScore}/10</Text>
                  {todayMood.note && (
                    <Text style={styles.currentMoodNote}>{todayMood.note}</Text>
                  )}
                  {todayMood.tags && todayMood.tags.length > 0 && (
                    <Text style={styles.currentMoodTags}>
                      Tags: {todayMood.tags.join(', ')}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={styles.alreadyLoggedText}>
                ✓ You've already logged your mood today
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Mood Selection */}
        <Card style={styles.moodSelectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              {todayMood ? 'Update Your Mood' : 'Select Your Mood'}
            </Title>
            <Text style={styles.subtitle}>
              {todayMood 
                ? 'Select a new mood to replace today\'s entry' 
                : 'Choose how you\'re feeling right now'
              }
            </Text>
            <View style={styles.moodGrid}>
              {moodOptions.map((mood, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.moodOption,
                    selectedMood?.emoji === mood.emoji && styles.moodOptionSelected,
                    todayMood && todayMood.moodEmoji === mood.emoji && styles.moodOptionCurrent
                  ]}
                  onPress={() => handleMoodSelect(mood)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                  <Text style={styles.moodScore}>{mood.score}/10</Text>
                  {todayMood && todayMood.moodEmoji === mood.emoji && (
                    <Text style={styles.currentIndicator}>Current</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Note Input */}
        <Card style={styles.noteCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              {todayMood ? 'Update Note' : 'Add a Note'} (Optional)
            </Title>
            <TextInput
              mode="outlined"
              placeholder={todayMood ? "Update your thoughts..." : "How are you feeling? What's on your mind?"}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              style={styles.noteInput}
              defaultValue={todayMood?.note || ''}
            />
          </Card.Content>
        </Card>

        {/* Tags Input */}
        <Card style={styles.tagsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              {todayMood ? 'Update Tags' : 'Tags'} (Optional)
            </Title>
            <TextInput
              mode="outlined"
              placeholder="work, family, exercise, sleep... (comma separated)"
              value={tags}
              onChangeText={setTags}
              style={styles.tagsInput}
              defaultValue={todayMood?.tags?.join(', ') || ''}
            />
          </Card.Content>
        </Card>

        {/* Save/Update Button */}
        <Button
          mode="contained"
          onPress={handleSaveMood}
          loading={loading}
          disabled={loading || !selectedMood}
          style={styles.saveButton}
        >
          {todayMood ? 'Update Mood' : 'Save Mood'}
        </Button>

        {/* Info message for existing mood */}
        {todayMood && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.infoText}>
                💡 You can only log one mood per day. To change today's mood, 
                select a new mood above and click "Update Mood".
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  currentMoodCard: {
    marginBottom: 20,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  currentMoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentMood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentMoodEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  currentMoodDetails: {
    flex: 1,
  },
  currentMoodScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentMoodNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  currentMoodTags: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  alreadyLoggedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  moodSelectionCard: {
    marginBottom: 20,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodOption: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'white',
    position: 'relative',
  },
  moodOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  moodOptionCurrent: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moodScore: {
    fontSize: 10,
    color: '#666',
  },
  currentIndicator: {
    fontSize: 8,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  noteCard: {
    marginBottom: 20,
    elevation: 4,
  },
  noteInput: {
    minHeight: 100,
  },
  tagsCard: {
    marginBottom: 20,
    elevation: 4,
  },
  tagsInput: {
    height: 60,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 8,
  },
  infoCard: {
    marginBottom: 20,
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default MoodTrackerScreen;