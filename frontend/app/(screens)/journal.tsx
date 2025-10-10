import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Text, Title, Button, Card, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../../context/AuthContext';
import {apiService} from '../../services/api';
import { JournalEntry } from '../../types';

// Your backend base URL - make sure this matches your environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.164:3000';

export default function JournalScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordings, setRecordings] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [transcribing, setTranscribing] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    loadRecordings();
    setupAudio();
    
    // Cleanup sound on unmount
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

  const loadRecordings = async (): Promise<void> => {
    try {
      console.log('🔄 Loading journal entries...');
      const response = await apiService.get<any>('/journal');
      console.log('📥 Journal entries response:', response);
      
      let journals: JournalEntry[] = [];
      
      if (response && response.journals && Array.isArray(response.journals)) {
        journals = response.journals;
      } else if (response && Array.isArray(response)) {
        journals = response;
      } else if (response && response.data && Array.isArray(response.data.journals)) {
        journals = response.data.journals;
      } else if (response && response.data && Array.isArray(response.data)) {
        journals = response.data;
      }
      
      // ✅ FIXED: Process audio URLs to ensure they're always absolute
      const processedJournals = journals.map(journal => ({
        ...journal,
        // Ensure audioUrl is always a full, accessible URL
        audioUrl: getAbsoluteAudioUrl(journal.audioUrl)
      }));
      
      console.log('✅ Setting processed journals:', processedJournals.length);
      setRecordings(processedJournals);
      
    } catch (error) {
      console.error('❌ Error loading recordings:', error);
      Alert.alert('Error', 'Failed to load journal entries');
    }
  };

  // ✅ FIXED: Function to ensure audio URLs are always absolute and accessible
  const getAbsoluteAudioUrl = (audioUrl: string | undefined): string => {
    if (!audioUrl) {
      console.warn('⚠️ No audio URL provided');
      return '';
    }

    // If it's already a full URL, return as is
    if (audioUrl.startsWith('http')) {
      console.log('🔗 Audio URL is already absolute:', audioUrl);
      return audioUrl;
    }

    // Handle relative paths (like "/audio/filename.mp3")
    if (audioUrl.startsWith('/')) {
      // Remove leading slash if present
      const cleanPath = audioUrl.startsWith('/') ? audioUrl.substring(1) : audioUrl;
      const absoluteUrl = `${API_BASE_URL}/${cleanPath}`;
      
      console.log('🔗 Converted relative path to absolute URL:', {
        original: audioUrl,
        final: absoluteUrl
      });
      
      return absoluteUrl;
    }

    // If it's just a filename, construct the full URL
    const absoluteUrl = `${API_BASE_URL}/audio/${audioUrl}`;
    
    console.log('🔗 Converted filename to absolute URL:', {
      original: audioUrl,
      final: absoluteUrl
    });
    
    return absoluteUrl;
  };

  const startRecording = async (): Promise<void> => {
    try {
      setLoading(true);
      setRecordingDuration(0);
      
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant audio recording permissions');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // ✅ FIXED: Use m4a format explicitly for better compatibility
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      (newRecording as any).timer = timer;
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async (): Promise<void> => {
    if (!recording) return;

    setLoading(true);
    try {
      // Clear recording timer
      if ((recording as any).timer) {
        clearInterval((recording as any).timer);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setIsRecording(false);
      setRecording(null);

      if (uri) {
        await uploadRecording(uri, recordingDuration);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    } finally {
      setLoading(false);
      setRecordingDuration(0);
    }
  };

  const uploadRecording = async (uri: string, duration: number): Promise<void> => {
    setTranscribing(true);
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('Recording file not found');
      }

      // ✅ FIXED: Use .m4a extension for better compatibility
      const fileName = `recording-${Date.now()}.m4a`;
      
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        type: 'audio/m4a',
        name: fileName,
      } as any);
      formData.append('duration', duration.toString());

      console.log('📤 Uploading recording...');

      // Try uploadFile method first
      const response = await apiService.uploadFile('/journal/voice', formData);

      console.log('📥 Upload response:', response);

      if (response && response.success) {
        let newJournal: JournalEntry;
        
        if (response.journal) {
          newJournal = response.journal;
        } else if (response.data) {
          newJournal = response.data.journal || response.data;
        } else {
          // If no direct journal data, reload all recordings
          await loadRecordings();
          Alert.alert('Success', 'Journal entry saved successfully!');
          return;
        }

        // ✅ FIXED: Ensure the new journal has absolute audio URL
        const processedJournal = {
          ...newJournal,
          audioUrl: getAbsoluteAudioUrl(newJournal.audioUrl)
        };
        
        setRecordings(prev => [processedJournal, ...prev]);
        Alert.alert('Success', 'Journal entry saved successfully!');
      } else {
        throw new Error(response?.message || 'Failed to save recording');
      }
    } catch (error: any) {
      console.error('❌ Error uploading recording:', error);
      Alert.alert('Upload Error', error.message || 'Failed to save recording. Please try again.');
    } finally {
      setTranscribing(false);
    }
  };

  const playAudio = async (audioUrl: string, journalId: string) => {
    try {
      // Stop currently playing audio
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      setPlayingId(journalId);
      
      console.log('🎵 Attempting to play audio from:', audioUrl);
      
      // Validate URL
      if (!audioUrl) {
        throw new Error('Audio URL is empty');
      }

      // ✅ FIXED: Additional URL validation and cleanup
      let finalAudioUrl = audioUrl.trim();
      
      console.log('🎵 Final audio URL:', finalAudioUrl);

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load and play the sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: finalAudioUrl },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        }
      );

      setSound(newSound);

      // Set up playback status updates
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        console.log('🎵 Playback status:', status);
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
      
      // Try alternative URL construction if the first attempt fails
      tryAlternativeUrls(audioUrl, journalId);
    }
  };

  // ✅ FIXED: Separate function for trying alternative URLs
  const tryAlternativeUrls = async (originalAudioUrl: string, journalId: string) => {
    console.log('🔄 Attempting alternative URL construction...');
    
    // Extract filename from current URL
    const filename = originalAudioUrl.split('/').pop();
    if (!filename) {
      Alert.alert('Playback Error', 'Could not determine audio filename');
      setPlayingId(null);
      return;
    }

    // ✅ FIXED: Try different URL patterns based on common server configurations
    const alternativeUrls = [
      `${API_BASE_URL}/audio/${filename}`,                    // Direct audio route
      `${API_BASE_URL}/api/audio/${filename}`,               // API audio route
      originalAudioUrl.replace('/api/audio/', '/audio/'),    // Fix incorrect API path
      originalAudioUrl,                                      // Original URL (retry)
    ];

    // Remove duplicates
    const uniqueUrls = [...new Set(alternativeUrls)];

    for (const altUrl of uniqueUrls) {
      try {
        console.log('🔄 Trying alternative URL:', altUrl);
        
        // Configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Load and play
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: altUrl },
          { 
            shouldPlay: true,
            isLooping: false,
            volume: 1.0,
          }
        );

        setSound(newSound);

        // Set up playback status
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
    
    // If all alternatives fail
    Alert.alert(
      'Playback Error', 
      `Could not play audio file.\n\nPlease check:\n• Your internet connection\n• Server is running\n• Audio file exists on server`
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

  const deleteRecording = (journalId: string): void => {
    Alert.alert(
      'Delete Journal Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop audio if playing this entry
              if (playingId === journalId) {
                await stopAudio();
              }
              
              const response = await apiService.delete(`/journal/${journalId}`);
              if (response.success) {
                setRecordings(prev => prev.filter(entry => entry._id !== journalId));
                Alert.alert('Success', 'Journal entry deleted');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
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

  // Debug current state
  console.log('🔍 Journal Screen State:', {
    recordingsCount: recordings.length,
    isRecording,
    loading,
    transcribing,
    recordingDuration,
    playingId
  });

  return (
    <View style={styles.container}>
      {/* Recording Section */}
      <Card style={styles.recordingCard}>
        <Card.Content style={styles.recordingContent}>
          <Title style={styles.recordingTitle}>
            {isRecording ? `Recording... ${formatDuration(recordingDuration)}` : 'Voice Journal'}
          </Title>
          
          <Text style={styles.recordingDescription}>
            Record your thoughts and feelings. We'll transcribe it automatically and analyze the sentiment.
          </Text>

          <View style={styles.recordingControls}>
            {!isRecording ? (
              <Button
                mode="contained"
                onPress={startRecording}
                loading={loading}
                disabled={loading || transcribing}
                style={styles.recordButton}
                icon="microphone"
              >
                Start Recording
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={stopRecording}
                loading={loading}
                disabled={loading}
                style={styles.stopButton}
                icon="stop"
                buttonColor="#F44336"
              >
                Stop Recording
              </Button>
            )}
          </View>

          {transcribing && (
            <View style={styles.transcribingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.transcribingText}>
                Processing your recording...
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Debug Info Card */}
      {/* <Card style={styles.debugCard}>
        <Card.Content>
          <Text style={styles.debugText}>
            Debug: {recordings.length} journal entries loaded
          </Text>
          <Text style={styles.debugSubtext}>
            Base URL: {API_BASE_URL}
          </Text>
        </Card.Content>
      </Card> */}

      {/* Previous Recordings */}
      <ScrollView style={styles.recordingsList}>
        <Title style={styles.sectionTitle}>
          Previous Entries ({recordings.length})
        </Title>
        
        {recordings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyText}>
                No journal entries yet. Start by recording your thoughts!
              </Text>
              <Button 
                mode="outlined" 
                onPress={loadRecordings}
                style={styles.refreshButton}
                icon="refresh"
              >
                Refresh
              </Button>
            </Card.Content>
          </Card>
        ) : (
          recordings.map(entry => (
            <Card key={entry._id} style={styles.journalCard}>
              <Card.Content>
                <View style={styles.journalHeader}>
                  <View style={styles.journalInfo}>
                    <Text style={styles.journalDate}>
                      {formatDate(entry.createdAt)}
                    </Text>
                    {entry.duration && (
                      <Text style={styles.journalDuration}>
                        Duration: {formatDuration(entry.duration)}
                      </Text>
                    )}
                  </View>
                  {entry.sentiment && (
                    <View style={[
                      styles.sentimentBadge,
                      { backgroundColor: getSentimentBackgroundColor(entry.sentiment) }
                    ]}>
                      <Text 
                        style={[
                          styles.sentimentText,
                          { color: getSentimentColor(entry.sentiment) }
                        ]}
                      >
                        {entry.sentiment}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Audio Player Section */}
                {entry.audioUrl && (
                  <View style={styles.audioPlayerSection}>
                    <Text style={styles.audioLabel}>Your Recording:</Text>
                    <View style={styles.audioControls}>
                      <Button
                        mode="outlined"
                        onPress={() => playingId === entry._id ? stopAudio() : playAudio(entry.audioUrl, entry._id)}
                        icon={playingId === entry._id ? "stop" : "play"}
                        style={styles.playButton}
                        compact
                        disabled={transcribing}
                      >
                        {playingId === entry._id ? "Stop" : "Play"}
                      </Button>
                      <Text style={styles.audioDuration}>
                        {entry.duration ? formatDuration(entry.duration) : '--:--'}
                      </Text>
                    </View>
                    {/* Debug info */}
                    <Text style={styles.audioDebug} numberOfLines={1}>
                      URL: {entry.audioUrl}
                    </Text>
                    {playingId === entry._id && (
                      <ActivityIndicator size="small" color="#2196F3" style={styles.playingIndicator} />
                    )}
                  </View>
                )}

                {/* Transcription Section */}
                {entry.transcription && (
                  <View style={styles.transcriptionContainer}>
                    <Text style={styles.transcriptionLabel}>Transcription:</Text>
                    <Text style={styles.transcriptionText}>
                      {entry.transcription}
                    </Text>
                  </View>
                )}

                {/* Sentiment Analysis */}
                {entry.sentiment && (
                  <View style={styles.sentimentContainer}>
                    <Text style={styles.sentimentLabel}>
                      Mood: <Text style={[styles.sentimentValue, { color: getSentimentColor(entry.sentiment) }]}>
                        {entry.sentiment}
                      </Text>
                    </Text>
                  </View>
                )}

                <View style={styles.journalActions}>
                  <Button
                    mode="text"
                    onPress={() => deleteRecording(entry._id)}
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
      </ScrollView>
    </View>
  );
}

const getSentimentColor = (sentiment: string): string => {
  const colors = {
    positive: '#4CAF50',
    negative: '#F44336',
    neutral: '#FFC107',
  };
  return colors[sentiment as keyof typeof colors] || '#666';
};

const getSentimentBackgroundColor = (sentiment: string): string => {
  const colors = {
    positive: '#E8F5E8',
    negative: '#FFEBEE',
    neutral: '#FFF8E1',
  };
  return colors[sentiment as keyof typeof colors] || '#F5F5F5';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  recordingCard: {
    margin: 16,
    elevation: 4,
  },
  recordingContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  recordingTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  recordingDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  recordingControls: {
    width: '100%',
    alignItems: 'center',
  },
  recordButton: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stopButton: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 20,
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  transcribingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  recordingsList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  emptyCard: {
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
    marginBottom: 16,
  },
  refreshButton: {
    borderRadius: 20,
  },
  journalCard: {
    marginBottom: 16,
    elevation: 2,
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
    marginBottom: 4,
  },
  journalDuration: {
    fontSize: 12,
    color: '#666',
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
  // Audio Player Styles
  audioPlayerSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  audioLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playButton: {
    borderRadius: 20,
  },
  audioDuration: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  audioDebug: {
    fontSize: 10,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  playingIndicator: {
    marginTop: 4,
  },
  // Transcription Styles
  transcriptionContainer: {
    marginBottom: 12,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  // Sentiment Styles
  sentimentContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  sentimentLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  sentimentValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  // Journal Actions
  journalActions: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  // Debug Styles
  debugCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  debugSubtext: {
    fontSize: 10,
    color: '#856404',
    textAlign: 'center',
    marginTop: 2,
  },
});