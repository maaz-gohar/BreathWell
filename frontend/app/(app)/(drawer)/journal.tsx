import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import VoiceRecorder from '../../../components/journal/VoiceRecorder';
import AppScreenHeader from '../../../components/ui/AppScreenHeader';
import Card from '../../../components/ui/Card';
import Loading from '../../../components/ui/Loading';
import { COLORS } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import { journalService } from '../../../services/journal.service';

// Your backend base URL
const API_BASE_URL = 'https://x80w9dj3-8000.euw.devtunnels.ms';

interface JournalEntry {
  _id: string;
  userId: string;
  type: 'voice' | 'text';
  audioUrl: string;
  transcription?: string;
  duration?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  title?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export default function JournalScreen() {
  const { user } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchJournals();
    setupAudio();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const fetchJournals = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading journal entries...');
      const data = await journalService.getJournals();
      
      const processedJournals = data.map(journal => ({
        ...journal,
        audioUrl: getAbsoluteAudioUrl(journal.audioUrl)
      }));
      
      console.log('✅ Loaded journals:', processedJournals.length);
      setJournals(processedJournals);
    } catch (error) {
      console.error('❌ Error loading recordings:', error);
      Alert.alert('Error', 'Failed to load journal entries');
      setJournals([]);
    } finally {
      setLoading(false);
    }
  };

  const getAbsoluteAudioUrl = (audioUrl: string | undefined): string => {
    if (!audioUrl) {
      console.warn('⚠️ No audio URL provided');
      return '';
    }

    if (audioUrl.startsWith('http')) {
      return audioUrl;
    }

    if (audioUrl.startsWith('/')) {
      const cleanPath = audioUrl.substring(1);
      return `${API_BASE_URL}/${cleanPath}`;
    }

    return `${API_BASE_URL}/audio/${audioUrl}`;
  };

  const handleVoiceRecordingComplete = async (uri: string, duration: number) => {
    try {
      console.log('🎙️ Voice recording complete, URI:', uri);
      console.log('⏱️ Actual duration:', duration, 'seconds');
      
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        type: 'audio/m4a',
        name: `journal_${Date.now()}.m4a`,
      } as any);
      
      formData.append('duration', duration.toString());
      
      setTranscribing(true);
      const savedJournal = await journalService.saveVoiceJournal(formData);
      console.log('✅ Journal saved successfully:', savedJournal);
      
      Alert.alert('Success', 'Voice journal saved successfully!');
      
      const processedJournal = {
        ...savedJournal,
        audioUrl: getAbsoluteAudioUrl(savedJournal.audioUrl)
      };
      
      setJournals(prev => [processedJournal, ...prev]);
      
    } catch (error: any) {
      console.error('❌ Save voice journal error:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', `Failed to save voice journal: ${error.message || 'Unknown error'}`);
    } finally {
      setTranscribing(false);
    }
  };

  const playAudio = async (audioUrl: string, journalId: string) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      setPlayingId(journalId);
      
      console.log('🎵 Attempting to play audio from:', audioUrl);
      
      if (!audioUrl) {
        throw new Error('Audio URL is empty');
      }

      const finalAudioUrl = audioUrl.trim();
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: finalAudioUrl },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        }
      );

      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            console.log('✅ Audio finished playing');
            setPlayingId(null);
          }
        } else {
          if (status.error) {
            console.error(`❌ Playback error: ${status.error}`);
            setPlayingId(null);
            Alert.alert('Playback Error', 'Could not play audio file. Please try again.');
          }
        }
      });

      console.log('✅ Audio playback started');
      
    } catch (error: any) {
      console.error('❌ Error playing audio:', error);
      tryAlternativeUrls(audioUrl, journalId);
    }
  };

  const tryAlternativeUrls = async (originalAudioUrl: string, journalId: string) => {
    console.log('🔄 Attempting alternative URL construction...');
    
    const filename = originalAudioUrl.split('/').pop();
    if (!filename) {
      Alert.alert('Playback Error', 'Could not determine audio filename');
      setPlayingId(null);
      return;
    }

    const alternativeUrls = [
      `${API_BASE_URL}/audio/${filename}`,
      `${API_BASE_URL}/api/audio/${filename}`,
      originalAudioUrl.replace('/api/audio/', '/audio/'),
      originalAudioUrl,
    ];

    const uniqueUrls = [...new Set(alternativeUrls)];

    for (const altUrl of uniqueUrls) {
      try {
        console.log('🔄 Trying alternative URL:', altUrl);
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: altUrl },
          { 
            shouldPlay: true,
            isLooping: false,
            volume: 1.0,
          }
        );

        setSound(newSound);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingId(null);
          }
        });

        console.log('✅ Audio playback started with alternative URL:', altUrl);
        return;
      } catch (altError) {
        console.error('❌ Alternative URL failed:', altUrl, altError);
      }
    }
    
    Alert.alert(
      'Playback Error', 
      'Could not play audio file.\n\nPlease check:\n• Your internet connection\n• Server is running\n• Audio file exists on server'
    );
    setPlayingId(null);
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        console.log('⏹️ Stopping audio playback');
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setPlayingId(null);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    Alert.alert(
      'Delete Journal',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (playingId === id) {
                await stopAudio();
              }
              
              await journalService.deleteJournal(id);
              setJournals(prev => prev.filter(entry => entry._id !== id));
              Alert.alert('Success', 'Journal entry deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete journal');
            }
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSentimentColor = (sentiment: string | undefined): string => {
    if (!sentiment) return '#666';
    const colors = {
      positive: '#4CAF50',
      negative: '#F44336',
      neutral: '#FFC107',
    };
    return colors[sentiment as keyof typeof colors] || '#666';
  };

  const getSentimentBackgroundColor = (sentiment: string | undefined): string => {
    if (!sentiment) return '#F5F5F5';
    const colors = {
      positive: '#E8F5E8',
      negative: '#FFEBEE',
      neutral: '#FFF8E1',
    };
    return colors[sentiment as keyof typeof colors] || '#F5F5F5';
  };

  if (loading) {
    return <Loading fullScreen text="Loading journals..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <AppScreenHeader title="Voice Journal" subtitle="Express yourself freely" />

      <Card style={styles.recorderCard}>
        <View style={styles.recorderHeader}>
          <Ionicons name="mic" size={24} color={COLORS.primary} />
          <Text style={styles.recorderTitle}>Record Your Thoughts</Text>
        </View>
        <Text style={styles.recorderDescription}>
          Hold the button to record your thoughts. Speak freely about your day, feelings, or anything on your mind.
        </Text>
        
        <VoiceRecorder onRecordingComplete={handleVoiceRecordingComplete} />
        
        {transcribing && (
          <View style={styles.transcribingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.transcribingText}>
              Processing your recording...
            </Text>
          </View>
        )}
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <Text style={styles.sectionCount}>{journals.length} {journals.length === 1 ? 'entry' : 'entries'}</Text>
        </View>

        {journals.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="journal-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No journal entries yet</Text>
            <Text style={styles.emptySubtext}>
              Record your first voice journal to get started
            </Text>
          </Card>
        ) : (
          journals.map((journal) => (
            <Card key={journal._id} style={styles.journalCard}>
              <View style={styles.journalHeader}>
                <View style={styles.journalInfo}>
                  <Text style={styles.journalDate}>
                    {formatDate(journal.createdAt)}
                  </Text>
                  {journal.duration !== undefined && (
                    <Text style={styles.journalDuration}>
                      Duration: {formatDuration(journal.duration)}
                    </Text>
                  )}
                </View>
                {journal.sentiment && (
                  <View style={[
                    styles.sentimentBadge,
                    { backgroundColor: getSentimentBackgroundColor(journal.sentiment) }
                  ]}>
                    <Text 
                      style={[
                        styles.sentimentText,
                        { color: getSentimentColor(journal.sentiment) }
                      ]}
                    >
                      {journal.sentiment}
                    </Text>
                  </View>
                )}
              </View>

              {journal.audioUrl && (
                <View style={styles.audioPlayerSection}>
                  <Text style={styles.audioLabel}>Your Recording:</Text>
                  <View style={styles.audioControls}>
                    <TouchableOpacity
                      style={[
                        styles.playButton,
                        playingId === journal._id && styles.stopButton
                      ]}
                      onPress={() => playingId === journal._id ? stopAudio() : playAudio(journal.audioUrl, journal._id)}
                      disabled={transcribing}
                    >
                      <Ionicons
                        name={playingId === journal._id ? "stop" : "play"}
                        size={20}
                        color={playingId === journal._id ? COLORS.error : COLORS.primary}
                      />
                      <Text style={[
                        styles.playButtonText,
                        { color: playingId === journal._id ? COLORS.error : COLORS.primary }
                      ]}>
                        {playingId === journal._id ? "Stop" : "Play"}
                      </Text>
                    </TouchableOpacity>
                    {journal.duration !== undefined && (
                      <Text style={styles.audioDuration}>
                        {formatDuration(journal.duration)}
                      </Text>
                    )}
                  </View>
                  {playingId === journal._id && (
                    <ActivityIndicator size="small" color={COLORS.primary} style={styles.playingIndicator} />
                  )}
                </View>
              )}

              {journal.transcription && (
                <View style={styles.transcriptionContainer}>
                  <Text style={styles.transcriptionLabel}>Transcription:</Text>
                  <Text style={styles.transcriptionText}>
                    {journal.transcription}
                  </Text>
                </View>
              )}

              <View style={styles.journalActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteJournal(journal._id)}
                >
                  <Ionicons name="trash" size={18} color={COLORS.error} />
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
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
    padding: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 30
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  recorderCard: {
    margin: 16,
    marginTop: 20,
  },
  recorderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recorderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
  },
  recorderDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  transcribingText: {
    marginLeft: 8,
    color: COLORS.textLight,
    fontSize: 14,
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
  },
  sectionCount: {
    fontSize: 14,
    color: COLORS.textLight,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
  },
  journalCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  journalInfo: {
    flex: 1,
  },
  journalDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  journalDuration: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  sentimentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentimentText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  audioPlayerSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  audioLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 8,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  stopButton: {
    backgroundColor: '#FEE2E2',
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  audioDuration: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  playingIndicator: {
    marginTop: 4,
    alignSelf: 'center',
  },
  transcriptionContainer: {
    marginBottom: 12,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 4,
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  journalActions: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
    marginLeft: 6,
  },
});