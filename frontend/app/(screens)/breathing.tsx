import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Text, Title, Button, Card, SegmentedButtons, Switch, Menu } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { Audio } from 'expo-av';

type BreathingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Breathing'>;

interface Props {
  navigation: BreathingScreenNavigationProp;
}

type BreathingTechnique = 'box' | '478' | 'relaxing';
type BackgroundSound = 'ocean' | 'rain' | 'forest' | 'white-noise' | 'none';

interface TechniqueConfig {
  name: string;
  description: string;
  phases: { duration: number; label: string; instruction: string }[];
  cycles: number;
}

interface SoundOption {
  key: BackgroundSound;
  label: string;
  icon: string;
  file: any;
}

const { width } = Dimensions.get('window');

const BreathingScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique>('box');
  const [selectedSound, setSelectedSound] = useState<BackgroundSound>('ocean');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [soundLoading, setSoundLoading] = useState<boolean>(false);
  const [showSoundMenu, setShowSoundMenu] = useState<boolean>(false);
  
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Sound options with bundled files
  const soundOptions: SoundOption[] = [
    {
      key: 'ocean',
      label: 'Ocean Waves',
      icon: 'waves',
      file: require('../../assets/sounds/ocean-waves.mp3'),
    },
    {
      key: 'rain',
      label: 'Natural Rain',
      icon: 'weather-rainy',
      file: require('../../assets/sounds/natural-rain.mp3'),
    },
    {
      key: 'forest',
      label: 'Forest Birds',
      icon: 'bird',
      file: require('../../assets/sounds/birds-in-the-forest-birds-in-spring.mp3'),
    },
    {
      key: 'white-noise',
      label: 'White Noise',
      icon: 'volume-high',
      file: require('../../assets/sounds/white-noise-soft.mp3'),
    },
    {
      key: 'none',
      label: 'No Sound',
      icon: 'volume-off',
      file: null,
    },
  ];

  const techniques: Record<BreathingTechnique, TechniqueConfig> = {
    box: {
      name: 'Box Breathing',
      description: 'Calm your nervous system with equal duration breaths',
      phases: [
        { duration: 4, label: 'Breathe In', instruction: 'Inhale slowly through your nose' },
        { duration: 4, label: 'Hold', instruction: 'Hold your breath' },
        { duration: 4, label: 'Breathe Out', instruction: 'Exhale slowly through your mouth' },
        { duration: 4, label: 'Hold', instruction: 'Hold your breath' },
      ],
      cycles: 5,
    },
    '478': {
      name: '4-7-8 Breathing',
      description: 'Promote relaxation and sleep with this calming technique',
      phases: [
        { duration: 4, label: 'Breathe In', instruction: 'Inhale quietly through your nose' },
        { duration: 7, label: 'Hold', instruction: 'Hold your breath' },
        { duration: 8, label: 'Breathe Out', instruction: 'Exhale completely through your mouth' },
      ],
      cycles: 4,
    },
    relaxing: {
      name: 'Relaxing Breath',
      description: 'Gentle breathing for stress relief',
      phases: [
        { duration: 5, label: 'Breathe In', instruction: 'Inhale deeply and slowly' },
        { duration: 2, label: 'Hold', instruction: 'Pause briefly' },
        { duration: 6, label: 'Breathe Out', instruction: 'Exhale slowly and completely' },
      ],
      cycles: 6,
    },
  };

  const currentTechnique = techniques[selectedTechnique];
  const currentSoundOption = soundOptions.find(opt => opt.key === selectedSound);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handlePhaseComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const playBackgroundSound = async (): Promise<void> => {
    if (selectedSound === 'none') {
      console.log('🔇 Sound disabled by user');
      return;
    }

    const soundOption = soundOptions.find(opt => opt.key === selectedSound);
    if (!soundOption || !soundOption.file) {
      console.log('❌ No sound file found for:', selectedSound);
      return;
    }

    try {
      setSoundLoading(true);
      console.log('🎵 Loading bundled sound:', soundOption.label);

      // Configure audio mode for background playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load and play the bundled sound file
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundOption.file,
        { 
          shouldPlay: true, 
          isLooping: true,
          volume: 0.4, // Comfortable background volume
        },
        (status) => {
          if (status.isLoaded) {
            console.log('✅ Sound loaded successfully:', soundOption.label);
          }
          if (status.error) {
            console.error('❌ Sound playback error:', status.error);
          }
        }
      );
      
      setSound(newSound);
      console.log('🎵 Background sound started:', soundOption.label);
      
    } catch (error) {
      console.error('❌ Error playing background sound:', error);
    } finally {
      setSoundLoading(false);
    }
  };

  const stopBackgroundSound = async (): Promise<void> => {
    try {
      if (sound) {
        console.log('🔇 Stopping background sound...');
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        console.log('✅ Background sound stopped');
      }
    } catch (error) {
      console.error('❌ Error stopping sound:', error);
    }
  };

  const changeBackgroundSound = async (newSound: BackgroundSound): Promise<void> => {
    setSelectedSound(newSound);
    setShowSoundMenu(false);
    
    // If session is active, restart sound with new selection
    if (isActive && newSound !== 'none') {
      await stopBackgroundSound();
      await playBackgroundSound();
    } else if (isActive && newSound === 'none') {
      await stopBackgroundSound();
    }
  };

  const handlePhaseComplete = (): void => {
    const nextPhase = (currentPhase + 1) % currentTechnique.phases.length;
    
    if (nextPhase === 0) {
      // Completed one cycle
      const newCycleCount = cycleCount + 1;
      setCycleCount(newCycleCount);
      
      if (newCycleCount >= currentTechnique.cycles) {
        stopBreathing();
        return;
      }
    }

    setCurrentPhase(nextPhase);
    setTimeLeft(currentTechnique.phases[nextPhase].duration);
    animateBreath(nextPhase);
  };

  const animateBreath = (phaseIndex: number): void => {
    const phase = currentTechnique.phases[phaseIndex];
    
    if (phase.label.includes('In')) {
      // Inhale animation
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: phase.duration * 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (phase.label.includes('Out')) {
      // Exhale animation
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: phase.duration * 1000,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  };

  const startBreathing = async (): Promise<void> => {
    setIsActive(true);
    setCurrentPhase(0);
    setCycleCount(0);
    setTimeLeft(currentTechnique.phases[0].duration);
    animateBreath(0);
    
    // Start background sound if enabled
    await playBackgroundSound();
  };

  const stopBreathing = async (): Promise<void> => {
    setIsActive(false);
    setCurrentPhase(0);
    setTimeLeft(0);
    setCycleCount(0);
    scaleAnim.setValue(1);
    
    // Stop background sound
    await stopBackgroundSound();
  };

  const handleTechniqueChange = (value: BreathingTechnique): void => {
    if (isActive) {
      // If changing technique while active, stop current session first
      stopBreathing();
    }
    setSelectedTechnique(value);
  };

  const currentPhaseData = currentTechnique.phases[currentPhase];

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Breathing Exercises</Title>
      <Text style={styles.subtitle}>Find your calm with guided breathing</Text>

      {!isActive ? (
        <>
          <Card style={styles.techniqueCard}>
            <Card.Content>
              <SegmentedButtons
                value={selectedTechnique}
                onValueChange={handleTechniqueChange}
                buttons={[
                  { value: 'box', label: 'Box' },
                  { value: '478', label: '4-7-8' },
                  { value: 'relaxing', label: 'Relax' },
                ]}
                style={styles.segmentedButtons}
              />
              
              <Title style={styles.techniqueName}>{currentTechnique.name}</Title>
              <Text style={styles.techniqueDescription}>
                {currentTechnique.description}
              </Text>
              
              <View style={styles.techniqueDetails}>
                <Text style={styles.detailText}>
                  Duration: {currentTechnique.cycles} cycles
                </Text>
                <Text style={styles.detailText}>
                  Phases: {currentTechnique.phases.map(p => p.duration + 's').join(' - ')}
                </Text>
              </View>

              {/* Background Sound Selection */}
              <View style={styles.soundSection}>
                <Text style={styles.soundSectionLabel}>Background Sound</Text>
                <Menu
                  visible={showSoundMenu}
                  onDismiss={() => setShowSoundMenu(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setShowSoundMenu(true)}
                      icon={currentSoundOption?.icon || 'volume-high'}
                      style={styles.soundMenuButton}
                    >
                      {currentSoundOption?.label || 'Select Sound'}
                    </Button>
                  }
                >
                  {soundOptions.map((option) => (
                    <Menu.Item
                      key={option.key}
                      leadingIcon={option.icon}
                      onPress={() => changeBackgroundSound(option.key)}
                      title={option.label}
                      style={[
                        styles.soundMenuItem,
                        selectedSound === option.key && styles.soundMenuItemSelected
                      ]}
                    />
                  ))}
                </Menu>
                <Text style={styles.soundDescription}>
                  {selectedSound === 'none' 
                    ? 'Session will be silent' 
                    : `Gentle ${currentSoundOption?.label.toLowerCase()} will play during your session`
                  }
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={startBreathing}
            style={styles.startButton}
            icon="play"
            disabled={soundLoading}
            loading={soundLoading}
          >
            {soundLoading ? 'Loading...' : 'Start Breathing Exercise'}
          </Button>
        </>
      ) : (
        <View style={styles.activeContainer}>
          <Animated.View 
            style={[
              styles.breathingCircle,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Text style={styles.phaseLabel}>{currentPhaseData.label}</Text>
            <Text style={styles.timeLeft}>{timeLeft}s</Text>
          </Animated.View>

          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              {currentPhaseData.instruction}
            </Text>
            <Text style={styles.cycleText}>
              Cycle {cycleCount + 1} of {currentTechnique.cycles}
            </Text>
          </View>

          <View style={styles.controls}>
            {/* Sound Selection during active session */}
            <Menu
              visible={showSoundMenu}
              onDismiss={() => setShowSoundMenu(false)}
              anchor={
                <Button
                  mode={selectedSound === 'none' ? "outlined" : "contained"}
                  onPress={() => setShowSoundMenu(true)}
                  icon={currentSoundOption?.icon || 'volume-high'}
                  compact
                  style={styles.activeSoundButton}
                >
                  {currentSoundOption?.label || 'Sound'}
                </Button>
              }
            >
              {soundOptions.map((option) => (
                <Menu.Item
                  key={option.key}
                  leadingIcon={option.icon}
                  onPress={() => changeBackgroundSound(option.key)}
                  title={option.label}
                />
              ))}
            </Menu>

            <Button
              mode="outlined"
              onPress={stopBreathing}
              style={styles.stopButton}
              icon="stop"
            >
              Complete Session
            </Button>
          </View>

          <View style={styles.progressContainer}>
            {currentTechnique.phases.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentPhase && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* Sound status indicator */}
          {selectedSound !== 'none' && (
            <View style={styles.soundStatus}>
              <Text style={styles.soundStatusText}>
                {sound ? '🎵 Sound playing' : '🔇 Loading sound...'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  techniqueCard: {
    marginBottom: 24,
    elevation: 4,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  techniqueName: {
    fontSize: 20,
    marginBottom: 8,
  },
  techniqueDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  techniqueDetails: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
  },
  soundSection: {
    backgroundColor: '#F3E5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  soundSectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginBottom: 8,
  },
  soundMenuButton: {
    marginBottom: 8,
  },
  soundMenuItem: {
    paddingVertical: 8,
  },
  soundMenuItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  soundDescription: {
    fontSize: 12,
    color: '#7B1FA2',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  startButton: {
    paddingVertical: 8,
  },
  activeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCircle: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  phaseLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  timeLeft: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  instructions: {
    alignItems: 'center',
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  cycleText: {
    fontSize: 14,
    color: '#666',
  },
  controls: {
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  activeSoundButton: {
    minWidth: 120,
  },
  stopButton: {
    borderColor: '#F44336',
    minWidth: 160,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#BDBDBD',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#2196F3',
  },
  soundStatus: {
    padding: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    marginTop: 10,
  },
  soundStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
  },
});

export default BreathingScreen;