import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../../../../components/ui/Card';
import Loading from '../../../../components/ui/Loading';
import { COLORS } from '../../../../constants/Colors';
import { LAYOUT, RADIUS, SPACING } from '../../../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

type BreathingTechnique = 'box' | '478' | 'relaxing' | 'triangle' | 'dhikrAllahHu' | 'tasbeehSlow' | 'yaSalaam' | 'yaHaleem';
type BackgroundSound = 'ocean' | 'rain' | 'forest' | 'white-noise' | 'none';
type TechniqueCategory = 'all' | 'stress' | 'sleep' | 'focus' | 'dhikr';

interface TechniqueConfig {
  name: string;
  description: string;
  category: TechniqueCategory;
  phases: { duration: number; label: string; instruction: string; dhikrText?: string }[];
  cycles: number;
  color: string;
}

interface SoundOption {
  key: BackgroundSound;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  file?: any;
}

const { width, height } = Dimensions.get('window');

export default function BreathScreen() {
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique>('box');
  const [selectedSound, setSelectedSound] = useState<BackgroundSound>('ocean');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [soundLoading, setSoundLoading] = useState<boolean>(false);
  const [showSoundMenu, setShowSoundMenu] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState<boolean>(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;
  const audioPermissionRef = useRef<boolean>(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMounted = useRef(true);

  // Sound options with bundled files
  const soundOptions: SoundOption[] = [
    {
      key: 'ocean',
      label: 'Ocean Waves',
      icon: 'water',
      file: require('../../../../assets/sounds/ocean-waves.mp3'),
    },
    {
      key: 'rain',
      label: 'Natural Rain',
      icon: 'rainy',
      file: require('../../../../assets/sounds/natural-rain.mp3'),
    },
    {
      key: 'forest',
      label: 'Forest Birds',
      icon: 'leaf',
      file: require('../../../../assets/sounds/birds-in-the-forest-birds-in-spring.mp3'),
    },
    {
      key: 'white-noise',
      label: 'White Noise',
      icon: 'volume-high',
      file: require('../../../../assets/sounds/white-noise-soft.mp3'),
    },
    {
      key: 'none',
      label: 'No Sound',
      icon: 'volume-mute',
    },
  ];

  const techniques: Record<BreathingTechnique, TechniqueConfig> = {
    box: {
      name: 'Box Breathing',
      description: 'Calm your nervous system with equal duration breaths. Perfect for stress reduction.',
      category: 'stress',
      phases: [
        { duration: 4, label: 'INHALE', instruction: 'Breathe in slowly through your nose' },
        { duration: 4, label: 'HOLD', instruction: 'Hold your breath comfortably' },
        { duration: 4, label: 'EXHALE', instruction: 'Exhale slowly through your mouth' },
        { duration: 4, label: 'HOLD', instruction: 'Hold before next breath' },
      ],
      cycles: 5,
      color: COLORS.primary,
    },
    '478': {
      name: '4-7-8 Breathing',
      description: 'Promote relaxation and sleep with this calming technique. Great for anxiety relief.',
      category: 'sleep',
      phases: [
        { duration: 4, label: 'INHALE', instruction: 'Inhale quietly through your nose' },
        { duration: 7, label: 'HOLD', instruction: 'Hold your breath' },
        { duration: 8, label: 'EXHALE', instruction: 'Exhale completely through your mouth' },
      ],
      cycles: 4,
      color: '#4CAF50',
    },
    relaxing: {
      name: 'Relaxing Breath',
      description: 'Gentle breathing for stress relief and mindfulness practice.',
      category: 'stress',
      phases: [
        { duration: 5, label: 'INHALE', instruction: 'Inhale deeply and slowly' },
        { duration: 2, label: 'HOLD', instruction: 'Pause briefly' },
        { duration: 6, label: 'EXHALE', instruction: 'Exhale slowly and completely' },
      ],
      cycles: 6,
      color: '#2196F3',
    },
    triangle: {
      name: 'Triangle Breathing',
      description: 'Energizing breathing pattern to increase focus and alertness.',
      category: 'focus',
      phases: [
        { duration: 3, label: 'INHALE', instruction: 'Quick, energizing inhale' },
        { duration: 1, label: 'HOLD', instruction: 'Brief pause' },
        { duration: 3, label: 'EXHALE', instruction: 'Controlled exhale' },
      ],
      cycles: 8,
      color: '#FF9800',
    },
    dhikrAllahHu: {
      name: '4/6 Dhikr (Allah-Hu)',
      description: 'Inhale saying "Allah", exhale saying "Hu". Combines breathing regulation with remembrance.',
      category: 'dhikr',
      phases: [
        { duration: 4, label: 'INHALE', instruction: 'Inhale slowly, say "Allah" in your heart', dhikrText: 'Allah' },
        { duration: 6, label: 'EXHALE', instruction: 'Exhale slowly, say "Hu" in your heart', dhikrText: 'Hu' },
      ],
      cycles: 10,
      color: '#7C3AED',
    },
    tasbeehSlow: {
      name: 'Tasbeeh Slow (SubhanAllah)',
      description: 'Exhale with "SubhanAllah" on each breath. 33 rounds naturally slows heart rate.',
      category: 'dhikr',
      phases: [
        { duration: 4, label: 'INHALE', instruction: 'Inhale deeply and slowly' },
        { duration: 6, label: 'EXHALE', instruction: 'Exhale slowly, say "SubhanAllah"', dhikrText: 'SubhanAllah' },
      ],
      cycles: 33,
      color: '#059669',
    },
    yaSalaam: {
      name: 'Ya Salaam (Anxiety Relief)',
      description: 'Repeat "Ya Salaam" (The Source of Peace) with 4s inhale, 6s exhale. For anxiety and restlessness.',
      category: 'dhikr',
      phases: [
        { duration: 4, label: 'INHALE', instruction: 'Inhale slowly' },
        { duration: 6, label: 'EXHALE', instruction: 'Exhale slowly, say "Ya Salaam"', dhikrText: 'Ya Salaam' },
      ],
      cycles: 10,
      color: COLORS.text,
    },
    yaHaleem: {
      name: 'Ya Haleem (Anger Regulation)',
      description: 'Repeat "Ya Haleem" (The Most Forbearing) with 4s inhale, 6s exhale. For calming anger.',
      category: 'dhikr',
      phases: [
        { duration: 4, label: 'INHALE', instruction: 'Inhale slowly' },
        { duration: 6, label: 'EXHALE', instruction: 'Exhale slowly, say "Ya Haleem"', dhikrText: 'Ya Haleem' },
      ],
      cycles: 10,
      color: '#7C3AED',
    },
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TechniqueCategory>('all');

  const FILTER_TABS: { key: TechniqueCategory; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'stress', label: 'Stress Relief' },
    { key: 'sleep', label: 'Sleep' },
    { key: 'focus', label: 'Focus' },
    { key: 'dhikr', label: 'Dhikr' },
  ];

  const filteredTechniques = useMemo(() => {
    const entries = Object.entries(techniques) as [BreathingTechnique, TechniqueConfig][];
    const byCategory =
      categoryFilter === 'all'
        ? entries
        : entries.filter(([, t]) => t.category === categoryFilter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(
      ([, t]) =>
        t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [techniques, categoryFilter, searchQuery]);

  const currentTechnique = techniques[selectedTechnique];
  const currentSoundOption = soundOptions.find(opt => opt.key === selectedSound);

  // Mount/Unmount setup
  useEffect(() => {
    isMounted.current = true;
    
    const requestPermissions = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        audioPermissionRef.current = status === 'granted';
        if (status === 'granted') {
          console.log('✅ Audio permissions granted');
        }
      } catch (error) {
        console.error('❌ Error requesting audio permissions:', error);
      }
    };
    
    requestPermissions();

    return () => {
      isMounted.current = false;
      cleanupSound();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handlePhaseComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  // 🔥 FIXED: Cleanup function
  const cleanupSound = async () => {
    try {
      if (soundRef.current) {
        console.log('🧹 Cleaning up sound...');
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setSound(null);
      setIsSoundPlaying(false);
    } catch (error) {
      console.error('❌ Error in cleanupSound:', error);
    }
  };

  // 🔥 FIXED: Play background sound - SIMPLIFIED
  const playBackgroundSound = async (): Promise<void> => {
    if (selectedSound === 'none') {
      console.log('🔇 Sound disabled by user');
      return;
    }

    const soundOption = soundOptions.find(opt => opt.key === selectedSound);
    if (!soundOption || !soundOption.file) {
      console.log('⚠️ No sound file found for:', selectedSound);
      return;
    }

    try {
      setSoundLoading(true);
      console.log('🎵 Loading sound:', soundOption.label);

      // Clean up any existing sound first
      await cleanupSound();

      // Configure audio mode for background playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 🔥 SIMPLIFIED: Load and play the SELECTED sound file without callback
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundOption.file,
        { 
          shouldPlay: true, 
          isLooping: true,
          volume: 0.4,
        }
      );
      
      soundRef.current = newSound;
      setSound(newSound);
      setIsSoundPlaying(true);
      console.log('✅ Background sound started:', soundOption.label);
      
    } catch (error) {
      console.error('❌ Error playing background sound:', error);
      if (isMounted.current) {
        Alert.alert('Sound Error', 'Could not play background sound. Please check if the sound files exist.');
      }
    } finally {
      if (isMounted.current) {
        setSoundLoading(false);
      }
    }
  };

  // 🔥 FIXED: Stop background sound
  const stopBackgroundSound = async (): Promise<void> => {
    try {
      await cleanupSound();
      console.log('✅ Background sound stopped');
    } catch (error) {
      console.error('❌ Error stopping sound:', error);
    }
  };

  const changeBackgroundSound = async (newSound: BackgroundSound): Promise<void> => {
    if (!isMounted.current) return;
    
    setSelectedSound(newSound);
    setShowSoundMenu(false);
    
    // If session is active, restart sound with new selection
    if (isActive) {
      await stopBackgroundSound();
      if (newSound !== 'none') {
        await playBackgroundSound();
      }
    }
  };

  const handlePhaseComplete = (): void => {
    if (!isMounted.current) return;
    
    const nextPhase = (currentPhase + 1) % currentTechnique.phases.length;
    
    if (nextPhase === 0) {
      const newCycleCount = cycleCount + 1;
      setCycleCount(newCycleCount);
      
      if (newCycleCount >= currentTechnique.cycles) {
        completeSession();
        return;
      }
    }

    setCurrentPhase(nextPhase);
    setTimeLeft(currentTechnique.phases[nextPhase].duration);
    animateBreath(nextPhase);
  };

  const animateBreath = (phaseIndex: number): void => {
    const phase = currentTechnique.phases[phaseIndex];
    
    // Reset animations
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.8);

    if (phase.label.includes('INHALE')) {
      // Inhale animation - expand and brighten
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: phase.duration * 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: phase.duration * 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (phase.label.includes('EXHALE')) {
      // Exhale animation - contract and fade
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.7,
          duration: phase.duration * 1000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: phase.duration * 1000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hold animation - subtle pulse
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const startBreathing = async (): Promise<void> => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    try {
      // Check permissions
      if (!audioPermissionRef.current) {
        const { status } = await Audio.requestPermissionsAsync();
        audioPermissionRef.current = status === 'granted';
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Audio permission is required for background sounds.');
          setIsLoading(false);
          return;
        }
      }

      setIsActive(true);
      setCurrentPhase(0);
      setCycleCount(0);
      setTimeLeft(currentTechnique.phases[0].duration);
      animateBreath(0);
      
      await playBackgroundSound();
    } catch (error) {
      console.error('Error starting breathing session:', error);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to start breathing session');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const stopBreathing = async (): Promise<void> => {
    if (!isMounted.current) return;
    
    setIsActive(false);
    setCurrentPhase(0);
    setTimeLeft(0);
    setCycleCount(0);
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.8);
    
    await stopBackgroundSound();
  };

  const completeSession = async (): Promise<void> => {
    if (!isMounted.current) return;
    
    await stopBreathing();
    // Show completion message
    Alert.alert(
      'Session Complete!',
      `You've completed ${currentTechnique.cycles} cycles of ${currentTechnique.name}. Great job!`,
      [{ text: 'OK' }]
    );
  };

  const handleTechniqueChange = (technique: BreathingTechnique): void => {
    if (!isMounted.current) return;
    
    if (isActive) {
      Alert.alert(
        'Change Technique',
        'This will end your current session. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Change', 
            style: 'destructive',
            onPress: async () => {
              await stopBreathing();
              setSelectedTechnique(technique);
            }
          },
        ]
      );
    } else {
      setSelectedTechnique(technique);
    }
  };

  const currentPhaseData = currentTechnique.phases[currentPhase];
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return <Loading fullScreen text="Preparing your session..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: (insets?.bottom ?? 0) + 80 }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: (insets?.top ?? 0) + SPACING.xxl }]}>
        <Text style={styles.title}>Breathing Exercises</Text>
        <Text style={styles.subtitle}>Find calm and focus through mindful breathing</Text>
      </View>

      {!isActive ? (
        <>
          {/* Search bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search techniques..."
                placeholderTextColor={COLORS.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.filterIconButton} activeOpacity={0.7}>
                <Ionicons name="options-outline" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs} contentContainerStyle={styles.filterTabsContent}>
              {FILTER_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterPill, categoryFilter === tab.key && styles.filterPillActive]}
                  onPress={() => setCategoryFilter(tab.key)}
                >
                  <Text style={[styles.filterPillText, categoryFilter === tab.key && styles.filterPillTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Technique list — list-based cards */}
          <View style={styles.listSection}>
            {filteredTechniques.map(([key, technique]) => (
              <TouchableOpacity
                key={key}
                style={[styles.listCard, selectedTechnique === key && styles.listCardSelected]}
                onPress={() => handleTechniqueChange(key as BreathingTechnique)}
                activeOpacity={0.7}
              >
                <View style={[styles.listCardIconWrap, { backgroundColor: technique.color + '30' }]}>
                  <Ionicons name="leaf" size={28} color={technique.color} />
                </View>
                <View style={styles.listCardContent}>
                  <Text style={styles.listCardTitle}>{technique.name}</Text>
                  <View style={styles.listCardMeta}>
                    <Ionicons name="repeat-outline" size={14} color={COLORS.textLight} />
                    <Text style={styles.listCardMetaText}>
                      {technique.cycles} cycles • {technique.phases.length} phases
                    </Text>
                  </View>
                  <Text style={styles.listCardType} numberOfLines={1}>
                    {FILTER_TABS.find(t => t.key === technique.category)?.label ?? 'Breathing'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.listCardAction}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleTechniqueChange(key as BreathingTechnique);
                  }}
                >
                  <Text style={styles.listCardActionText}>Start</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.text} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Technique — Hero card with soft gradient */}
          <View style={styles.detailsSection}>
            <LinearGradient
              colors={[COLORS.primaryLight + '40', COLORS.surface]}
              style={styles.detailsCardGradient}
            >
              <View style={styles.detailsHeader}>
                <View style={[styles.techniqueColor, { backgroundColor: currentTechnique.color }]} />
                <View style={styles.detailsTitle}>
                  <Text style={styles.currentTechniqueName}>{currentTechnique.name}</Text>
                  <Text style={styles.currentTechniqueDesc}>{currentTechnique.description}</Text>
                </View>
              </View>

            <View style={styles.phaseList}>
              {currentTechnique.phases.map((phase, index) => (
                <View key={index} style={styles.phaseItem}>
                  <View style={styles.phaseIndicator}>
                    <Text style={styles.phaseNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.phaseContent}>
                    <Text style={styles.phaseLabel}>{phase.label}</Text>
                    <Text style={styles.phaseDuration}>{phase.duration}s</Text>
                  </View>
                  <Text style={styles.phaseInstruction}>{phase.instruction}</Text>
                </View>
              ))}
            </View>

              <View style={styles.sessionInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="repeat" size={20} color={COLORS.textLight} />
                  <Text style={styles.infoText}>{currentTechnique.cycles} cycles</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time" size={20} color={COLORS.textLight} />
                  <Text style={styles.infoText}>
                    {currentTechnique.phases.reduce((sum, phase) => sum + phase.duration, 0) * currentTechnique.cycles}s total
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Sound Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Background Sound</Text>
            <View style={styles.soundOptions}>
              {soundOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.soundOption,
                    selectedSound === option.key && styles.soundOptionSelected,
                  ]}
                  onPress={() => changeBackgroundSound(option.key)}
                >
                  <View style={styles.soundIcon}>
                    <Ionicons 
                      name={option.icon} 
                      size={24} 
                      color={selectedSound === option.key ? COLORS.primary : COLORS.text} 
                    />
                  </View>
                  <Text style={[
                    styles.soundLabel,
                    selectedSound === option.key && styles.soundLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.soundNote}>
              {selectedSound === 'none' 
                ? 'Session will be silent' 
                : `${currentSoundOption?.label} will play during your session`}
            </Text>
          </View>

          {/* Start Button */}
          <View style={styles.startButtonWrap}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: currentTechnique.color }]}
            onPress={startBreathing}
            disabled={soundLoading}
          >
            {soundLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Start Breathing Session</Text>
              </>
            )}
          </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Active Session View */
        <View style={styles.activeContainer}>
          {/* Breathing Animation */}
          <View style={styles.animationContainer}>
            <Animated.View 
              style={[
                styles.breathingCircle,
                { 
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                  backgroundColor: currentTechnique.color,
                }
              ]}
            >
              <Text style={styles.phaseLabelActive}>{currentPhaseData.label}</Text>
              <Text style={styles.timeLeft}>{timeLeft}s</Text>
              <Text style={styles.cycleInfo}>
                Cycle {cycleCount + 1} of {currentTechnique.cycles}
              </Text>
            </Animated.View>

            {/* Phase Indicators */}
            <View style={styles.phaseIndicators}>
              {currentTechnique.phases.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.phaseDot,
                    index === currentPhase && styles.phaseDotActive,
                    { backgroundColor: currentTechnique.color }
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Instructions */}
          <Card style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>{currentPhaseData.instruction}</Text>
            <Text style={styles.nextPhase}>
              Next: {currentTechnique.phases[(currentPhase + 1) % currentTechnique.phases.length]?.label}
            </Text>
          </Card>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Sound Control */}
            <TouchableOpacity
              style={[styles.soundControl, selectedSound !== 'none' && { backgroundColor: COLORS.primaryLight + '30' }]}
              onPress={() => setShowSoundMenu(!showSoundMenu)}
            >
              <Ionicons 
                name={currentSoundOption?.icon || 'volume-mute'} 
                size={24} 
                color={selectedSound === 'none' ? COLORS.textLight : currentTechnique.color} 
              />
              {selectedSound !== 'none' && isSoundPlaying && (
                <View style={styles.soundPlayingIndicator} />
              )}
            </TouchableOpacity>

            {/* Stop Button */}
            <TouchableOpacity
              style={styles.stopButton}
              onPress={completeSession}
            >
              <Ionicons name="stop-circle" size={24} color={COLORS.error} />
              <Text style={styles.stopButtonText}>End Session</Text>
            </TouchableOpacity>
          </View>

          {/* Sound Menu */}
          {showSoundMenu && (
            <Card style={styles.soundMenu}>
              <Text style={styles.soundMenuTitle}>Change Sound</Text>
              {soundOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.soundMenuItem,
                    selectedSound === option.key && styles.soundMenuItemSelected,
                  ]}
                  onPress={() => changeBackgroundSound(option.key)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={selectedSound === option.key ? currentTechnique.color : COLORS.text} 
                  />
                  <Text style={[
                    styles.soundMenuLabel,
                    selectedSound === option.key && { color: currentTechnique.color },
                  ]}>
                    {option.label}
                  </Text>
                  {selectedSound === option.key && (
                    <Ionicons name="checkmark" size={16} color={currentTechnique.color} />
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${((cycleCount * currentTechnique.phases.length + currentPhase) / 
                             (currentTechnique.cycles * currentTechnique.phases.length)) * 100}%`,
                    backgroundColor: currentTechnique.color,
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {cycleCount + 1}/{currentTechnique.cycles} cycles
            </Text>
          </View>

          {/* Sound Status */}
          {selectedSound !== 'none' && (
            <View style={styles.soundStatus}>
              <Ionicons 
                name={isSoundPlaying ? 'volume-high' : 'volume-mute'} 
                size={16} 
                color={isSoundPlaying ? COLORS.success : COLORS.textLight} 
              />
              <Text style={[styles.soundStatusText, { color: isSoundPlaying ? COLORS.success : COLORS.textLight }]}>
                {isSoundPlaying ? `${currentSoundOption?.label} playing` : 'Sound loading...'}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    marginTop: LAYOUT.sectionSpacingVertical,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  searchSection: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    marginTop: SPACING.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 0,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabs: {
    marginTop: SPACING.md,
  },
  filterTabsContent: {
    paddingRight: LAYOUT.screenPaddingHorizontal,
  },
  filterPill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  filterPillTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  listSection: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    marginTop: LAYOUT.sectionSpacingVertical,
    paddingBottom: SPACING.md,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: LAYOUT.cardPadding,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  listCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '35',
  },
  listCardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  listCardContent: {
    flex: 1,
    minWidth: 0,
  },
  listCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  listCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  listCardMetaText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  listCardType: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  listCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginLeft: SPACING.sm,
  },
  listCardActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 4,
  },
  detailsSection: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    marginTop: LAYOUT.sectionSpacingVertical,
  },
  detailsCardGradient: {
    padding: LAYOUT.cardPadding,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  techniqueColor: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  detailsTitle: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  currentTechniqueName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  currentTechniqueDesc: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  phaseList: {
    marginBottom: SPACING.xl,
  },
  phaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  phaseIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  phaseNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  phaseContent: {
    flex: 1,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  phaseDuration: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  phaseInstruction: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'right',
    maxWidth: '45%',
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.lg,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  soundOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  soundOption: {
    width: '30%',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: LAYOUT.gridGap,
  },
  soundOptionSelected: {
    backgroundColor: COLORS.primaryLight + '30',
    borderColor: COLORS.primary,
  },
  soundIcon: {
    marginBottom: SPACING.xs,
  },
  soundLabel: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  soundLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  soundNote: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  startButtonWrap: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    marginTop: LAYOUT.sectionSpacingVertical,
    marginBottom: 40,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg + 2,
    borderRadius: RADIUS.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  activeContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingTop: SPACING.lg,
    minHeight: height * 0.75,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.38,
  },
  breathingCircle: {
    width: width * 0.58,
    height: width * 0.58,
    borderRadius: (width * 0.58) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    marginTop: SPACING.xl,
  },
  phaseLabelActive: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  timeLeft: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cycleInfo: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 8,
  },
  phaseIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  phaseDotActive: {
    transform: [{ scale: 1.4 }],
  },
  instructionCard: {
    marginTop: SPACING.xxl,
    padding: LAYOUT.cardPadding,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  nextPhase: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xxl,
    paddingHorizontal: 0,
  },
  soundControl: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceVariant,
    position: 'relative',
  },
  soundPlayingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  stopButtonText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  soundMenu: {
    position: 'absolute',
    top: 150,
    right: 20,
    padding: 12,
    elevation: 5,
    zIndex: 1000,
    minWidth: 200,
  },
  soundMenuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  soundMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  soundMenuItemSelected: {
    backgroundColor: COLORS.primaryLight + '40',
  },
  soundMenuLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  progressContainer: {
    marginTop: SPACING.xxl,
    paddingHorizontal: 0,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 8,
  },
  soundStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 8,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 16,
  },
  soundStatusText: {
    fontSize: 12,
    marginLeft: 4,
  },
});