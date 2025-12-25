import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/Colors';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'preparing' | 'recording' | 'stopping'>('idle');
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const isCleaningUpRef = useRef<boolean>(false);

  const cleanupRecording = async (rec: Audio.Recording | null) => {
    if (!rec || isCleaningUpRef.current) return;
    
    try {
      isCleaningUpRef.current = true;
      console.log('🧹 Cleaning up recording...');
      
      const status = await rec.getStatusAsync();
      if (status.canRecord) {
        await rec.stopAndUnloadAsync();
      }
      console.log('✅ Recording cleaned up');
    } catch (error) {
      console.error('⚠️ Cleanup error (non-critical):', error);
    } finally {
      isCleaningUpRef.current = false;
    }
  };

  const prepareRecording = async (): Promise<Audio.Recording | null> => {
    try {
      setRecordingStatus('preparing');
      
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant audio recording permissions in settings');
        setRecordingStatus('idle');
        return null;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('🎙️ Preparing recording...');
      
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        }
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );
      
      console.log('✅ Recording prepared');
      return newRecording;
      
    } catch (error) {
      console.error('❌ Failed to prepare recording:', error);
      Alert.alert('Recording Error', 'Could not prepare recording device');
      setRecordingStatus('idle');
      return null;
    }
  };

  const startRecording = async () => {
    // Prevent multiple simultaneous starts
    if (recordingStatus !== 'idle') {
      console.log('⚠️ Recording already in progress or stopping');
      return;
    }

    try {
      console.log('▶️ Starting recording...');
      
      // Clean up any existing recording first
      if (recording) {
        await cleanupRecording(recording);
        setRecording(null);
      }

      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Prepare new recording
      const newRecording = await prepareRecording();
      if (!newRecording) return;

      // Start recording
      await newRecording.startAsync();
      
      console.log('🎤 Recording started');
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingStatus('recording');
      setDuration(0);
      startTimeRef.current = Date.now();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000) as ReturnType<typeof setInterval>;
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
      setRecordingStatus('idle');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    // Prevent multiple stop calls
    if (!recording || recordingStatus !== 'recording') {
      console.log('⚠️ No active recording to stop');
      return;
    }

    try {
      setRecordingStatus('stopping');
      console.log('⏹️ Stopping recording...');
      
      // Clear timer first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Calculate actual duration
      const actualDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      console.log(`⏱️ Recording duration: ${actualDuration} seconds`);
      
      // Stop recording
      await recording.stopAndUnloadAsync();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      // Get the recording URI
      const uri = recording.getURI();
      console.log('✅ Recording stopped, URI:', uri);
      
      // Reset state
      const savedRecording = recording;
      setRecording(null);
      setIsRecording(false);
      setRecordingStatus('idle');
      setDuration(0);
      
      if (uri) {
        // Call the callback with both URI and duration
        onRecordingComplete(uri, actualDuration);
      } else {
        Alert.alert('Error', 'Recording file not found');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to stop recording:', error);
      
      // Force cleanup
      try {
        if (recording) {
          await recording.stopAndUnloadAsync();
        }
      } catch (cleanupError) {
        console.error('Force cleanup failed:', cleanupError);
      }
      
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      
      // Reset state
      setRecording(null);
      setIsRecording(false);
      setRecordingStatus('idle');
      setDuration(0);
    } finally {
      // Ensure timer is cleared
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePressIn = () => {
    console.log('🖐️ Press in - starting recording');
    startRecording();
  };

  const handlePressOut = () => {
    console.log('👆 Press out - stopping recording');
    if (isRecording && recordingStatus === 'recording') {
      stopRecording();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordingButton,
          recordingStatus === 'preparing' && styles.preparingButton,
          recordingStatus === 'stopping' && styles.stoppingButton
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={recordingStatus === 'preparing' || recordingStatus === 'stopping'}
      >
        <Ionicons 
          name={getRecordingIcon(recordingStatus)}
          size={32} 
          color={getRecordingColor(recordingStatus)} 
        />
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Text style={styles.instruction}>
          {getInstructionText(recordingStatus)}
        </Text>
        
        {isRecording && (
          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.durationText}>
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}
        
        {recordingStatus === 'preparing' && (
          <Text style={styles.statusText}>Preparing microphone...</Text>
        )}
        
        {recordingStatus === 'stopping' && (
          <Text style={styles.statusText}>Processing recording...</Text>
        )}
      </View>
    </View>
  );
}

// Helper functions
const getRecordingIcon = (status: string) => {
  switch (status) {
    case 'preparing': return 'hourglass-outline';
    case 'recording': return 'mic';
    case 'stopping': return 'stop-circle-outline';
    default: return 'mic-outline';
  }
};

const getRecordingColor = (status: string) => {
  switch (status) {
    case 'preparing': return COLORS.warning || '#FFA500';
    case 'recording': return COLORS.error || '#FF0000';
    case 'stopping': return COLORS.textLight || '#999';
    default: return COLORS.primary || '#007AFF';
  }
};

const getInstructionText = (status: string) => {
  switch (status) {
    case 'preparing': return 'Preparing...';
    case 'recording': return 'Release to stop recording';
    case 'stopping': return 'Processing...';
    default: return 'Hold to record';
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordingButton: {
    backgroundColor: '#FEE2E2',
  },
  preparingButton: {
    backgroundColor: '#FFF3CD',
  },
  stoppingButton: {
    backgroundColor: '#E5E7EB',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 16,
    minHeight: 60,
  },
  instruction: {
    fontSize: 14,
    color: COLORS.textLight || '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textLight || '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  durationText: {
    fontSize: 14,
    color: COLORS.text || '#000',
    fontWeight: '600',
    marginLeft: 4,
  },
});