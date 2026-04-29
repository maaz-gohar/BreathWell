import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../../../../components/ui/Card';
import Loading from '../../../../components/ui/Loading';
import { COLORS } from '../../../../constants/Colors';
import { LAYOUT, RADIUS, SPACING } from '../../../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BREATHING_EXERCISES,
  DEPARTMENTS,
  getDepartment,
} from '../../../../constants/breathingExerciseCatalog';
import type {
  BreathPhase,
  BreathingExercise,
  BreathingDepartmentId,
  TimedBreathExercise,
} from '../../../../types/breathing';
import {
  estimatedTimedSessionSeconds,
  guidedTimerTotalSeconds,
  isGuided,
  isTimedBreath,
} from '../../../../types/breathing';

type BackgroundSound = 'ocean' | 'rain' | 'forest' | 'white-noise' | 'none';
type DepartmentFilter = 'all' | BreathingDepartmentId;

const DEPT_TAB_LABEL: Record<DepartmentFilter, string> = {
  all: 'All',
  mood: 'Mood',
  sleep: 'Sleep',
  mindfulness: 'Mindfulness',
  relationships: 'Relations',
  dhikr: 'Dhikr',
};

/** mm:ss for guided countdown */
function formatCountdown(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Accent for list cards (timed patterns use their circle color). */
function exerciseAccent(ex: BreathingExercise): string {
  if (isTimedBreath(ex)) return ex.color;
  const map: Record<BreathingDepartmentId, string> = {
    mood: '#6366F1',
    sleep: '#0EA5E9',
    mindfulness: '#059669',
    relationships: '#DB2777',
    dhikr: '#7C3AED',
  };
  return map[ex.departmentId];
}

interface SoundOption {
  key: BackgroundSound;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  file?: any;
}

const { width, height } = Dimensions.get('window');

export default function BreathScreen() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('mr-box-breathing');
  const [selectedSound, setSelectedSound] = useState<BackgroundSound>('ocean');
  const [timedSessionActive, setTimedSessionActive] = useState<boolean>(false);
  const [guidedSessionActive, setGuidedSessionActive] = useState<boolean>(false);
  const [guidedTimeLeftSec, setGuidedTimeLeftSec] = useState<number | null>(null);
  const guidedCountdownInitialRef = useRef<number | null>(null);
  const guidedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTimedExerciseRef = useRef<TimedBreathExercise | null>(null);

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



  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>('all');

  const FILTER_DEP_TABS = useMemo(
    (): { key: DepartmentFilter; label: string }[] => [
      { key: 'all', label: DEPT_TAB_LABEL.all },
      ...DEPARTMENTS.map((d) => ({ key: d.id as BreathingDepartmentId, label: DEPT_TAB_LABEL[d.id as BreathingDepartmentId] })),
    ],
    []
  );

  const filteredExercises = useMemo(() => {
    const byDept =
      departmentFilter === 'all'
        ? BREATHING_EXERCISES
        : BREATHING_EXERCISES.filter((ex) => ex.departmentId === departmentFilter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byDept;
    return byDept.filter((ex) => {
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.primaryGoal.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.instructions.toLowerCase().includes(q)
      );
    });
  }, [departmentFilter, searchQuery]);

  useEffect(() => {
    if (filteredExercises.some((ex) => ex.id === selectedExerciseId)) return;
    const first = filteredExercises[0];
    if (first) setSelectedExerciseId(first.id);
  }, [filteredExercises, selectedExerciseId]);

  const selectedExercise = useMemo(() => {
    return BREATHING_EXERCISES.find((e) => e.id === selectedExerciseId) ?? BREATHING_EXERCISES[0];
  }, [selectedExerciseId]);

  const isSessionActive = timedSessionActive || guidedSessionActive;
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

  // Timer tick for timed breathing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (timedSessionActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timedSessionActive && timeLeft === 0) {
      handlePhaseComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timedSessionActive, timeLeft]);

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
    if (isSessionActive) {
      await stopBackgroundSound();
      if (newSound !== 'none') {
        await playBackgroundSound();
      }
    }
  };

  function shouldScaleInhaleExhale(phase: BreathPhase): boolean {
    if (phase.animateAsBreath === false) return false;
    return phase.label.includes('INHALE') || phase.label.includes('EXHALE');
  }

  const handlePhaseComplete = (): void => {
    if (!isMounted.current) return;
    const cfg = activeTimedExerciseRef.current;
    if (!cfg) return;

    const nextPhase = (currentPhase + 1) % cfg.phases.length;

    if (nextPhase === 0) {
      const newCycleCount = cycleCount + 1;
      setCycleCount(newCycleCount);

      if (newCycleCount >= cfg.cycles) {
        void completeTimedSession();
        return;
      }
    }

    setCurrentPhase(nextPhase);
    setTimeLeft(cfg.phases[nextPhase].duration);
    animateBreath(cfg.phases[nextPhase]);
  };

  const animateBreath = (phase: BreathPhase): void => {
    const useScale = shouldScaleInhaleExhale(phase);

    scaleAnim.setValue(1);
    opacityAnim.setValue(0.8);

    if (useScale && phase.label.includes('INHALE')) {
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
    } else if (useScale && phase.label.includes('EXHALE')) {
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
      const half = Math.min(phase.duration * 500, 3500);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: half,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: half,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const startTimedSession = async (): Promise<void> => {
    if (!isMounted.current || !isTimedBreath(selectedExercise)) return;

    setIsLoading(true);
    try {
      if (!audioPermissionRef.current) {
        const { status } = await Audio.requestPermissionsAsync();
        audioPermissionRef.current = status === 'granted';
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Audio permission is required for background sounds.'
          );
          setIsLoading(false);
          return;
        }
      }

      const cfg = selectedExercise;
      activeTimedExerciseRef.current = cfg;

      setTimedSessionActive(true);
      setCurrentPhase(0);
      setCycleCount(0);
      setTimeLeft(cfg.phases[0].duration);
      animateBreath(cfg.phases[0]);

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

  const startGuidedSession = async (): Promise<void> => {
    if (!isMounted.current || !isGuided(selectedExercise)) return;

    setIsLoading(true);
    try {
      if (!audioPermissionRef.current) {
        const { status } = await Audio.requestPermissionsAsync();
        audioPermissionRef.current = status === 'granted';
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Audio permission is required for background sounds.'
          );
          setIsLoading(false);
          return;
        }
      }

      const total = guidedTimerTotalSeconds(selectedExercise);
      guidedCountdownInitialRef.current = total;
      setGuidedTimeLeftSec(total);

      setGuidedSessionActive(true);
      await playBackgroundSound();

      if (total !== null && total > 0) {
        let remaining = total;
        guidedIntervalRef.current = setInterval(() => {
          remaining -= 1;
          setGuidedTimeLeftSec(remaining);
          if (remaining <= 0) {
            if (guidedIntervalRef.current) {
              clearInterval(guidedIntervalRef.current);
              guidedIntervalRef.current = null;
            }
            void completeGuidedFromTimer();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error starting guided session:', error);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to start session');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const resetTimedState = (): void => {
    setTimedSessionActive(false);
    setCurrentPhase(0);
    setTimeLeft(0);
    setCycleCount(0);
    activeTimedExerciseRef.current = null;
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.8);
  };

  const resetGuidedState = (): void => {
    if (guidedIntervalRef.current) {
      clearInterval(guidedIntervalRef.current);
      guidedIntervalRef.current = null;
    }
    setGuidedSessionActive(false);
    guidedCountdownInitialRef.current = null;
    setGuidedTimeLeftSec(null);
  };

  const stopAllSessions = async (): Promise<void> => {
    resetTimedState();
    resetGuidedState();
    await stopBackgroundSound();
  };

  const completeTimedSession = async (): Promise<void> => {
    if (!isMounted.current) return;
    const cfg = activeTimedExerciseRef.current;
    await stopAllSessions();
    if (cfg && isMounted.current) {
      Alert.alert(
        'Session complete',
        `You've completed ${cfg.cycles} cycle(s) of ${cfg.name}.`,
        [{ text: 'OK' }]
      );
    }
  };

  const completeGuidedFromTimer = async (): Promise<void> => {
    if (!isMounted.current) return;
    await stopAllSessions();
    if (isMounted.current) {
      Alert.alert('Time is up', 'Take a moment before you move on.', [{ text: 'OK' }]);
    }
  };

  const endGuidedSessionManual = async (): Promise<void> => {
    await stopAllSessions();
  };


  const stopAllSessionsRef = useRef(stopAllSessions);
  stopAllSessionsRef.current = stopAllSessions;

  useFocusEffect(
    useCallback(() => {
      return () => {
        void stopAllSessionsRef.current?.();
      };
    }, [])
  );

  const startBreathing = async (): Promise<void> => {
    if (isTimedBreath(selectedExercise)) {
      await startTimedSession();
    } else {
      await startGuidedSession();
    }
  };

  const stopBreathing = async (): Promise<void> => {
    if (!isMounted.current) return;
    await stopAllSessions();
  };

  const completeSession = (): void => {
    if (timedSessionActive && activeTimedExerciseRef.current) {
      void completeTimedSession();
    }
  };

  const handleExerciseSelect = (exerciseId: string): void => {
    if (!isMounted.current) return;

    if (isSessionActive) {
      Alert.alert(
        'Switch exercise',
        'This will end your current session. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            style: 'destructive',
            onPress: async () => {
              await stopAllSessions();
              setSelectedExerciseId(exerciseId);
            },
          },
        ]
      );
    } else {
      setSelectedExerciseId(exerciseId);
    }
  };

  const timedActive = timedSessionActive && activeTimedExerciseRef.current
    ? activeTimedExerciseRef.current
    : null;

  const timedPreview = isTimedBreath(selectedExercise) ? selectedExercise : null;

  const currentPhaseData =
    timedSessionActive && timedActive ? timedActive.phases[currentPhase] : null;

  const insets = useSafeAreaInsets();

  if (isLoading) {
    return <Loading fullScreen text="Preparing your session..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: (insets?.bottom ?? 0) + 80 }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: (insets?.top ?? 0) + SPACING.xxl }]}>
        <Text style={styles.title}>Breathing exercises</Text>
        <Text style={styles.subtitle}>
          {departmentFilter === 'all'
            ? 'Browse by department — breath timings and guided practices.'
            : getDepartment(departmentFilter).focus}
        </Text>
      </View>

      {!isSessionActive ? (
        <>
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, goal, or keywords…"
                placeholderTextColor={COLORS.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.filterIconButton} activeOpacity={0.7}>
                <Ionicons name="options-outline" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterTabs}
              contentContainerStyle={styles.filterTabsContent}
            >
              {FILTER_DEP_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.filterPill,
                    departmentFilter === tab.key && styles.filterPillActive,
                  ]}
                  onPress={() => setDepartmentFilter(tab.key)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      departmentFilter === tab.key && styles.filterPillTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.listSection}>
            {filteredExercises.map((ex) => {
              const accent = exerciseAccent(ex);
              const dept = getDepartment(ex.departmentId);
              const selected = selectedExerciseId === ex.id;
              return (
                <Pressable
                  key={ex.id}
                  style={({ pressed }) => [
                    styles.listCard,
                    selected && styles.listCardSelected,
                    pressed && styles.listCardPressed,
                  ]}
                  onPress={() => handleExerciseSelect(ex.id)}
                >
                  <View style={[styles.listCardIconWrap, { backgroundColor: accent + '35' }]}>
                    <Ionicons
                      name={isTimedBreath(ex) ? 'pulse' : 'book-outline'}
                      size={28}
                      color={accent}
                    />
                  </View>
                  <View style={styles.listCardContent}>
                    <Text style={styles.listCardTitle}>{ex.name}</Text>
                    <Text style={styles.listCardMetaText} numberOfLines={1}>
                      {dept.title} · {ex.category}
                    </Text>
                    <Text style={styles.listCardType} numberOfLines={2}>
                      {ex.primaryGoal}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={selected ? accent : COLORS.textLight}
                    style={styles.listCardChevron}
                  />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Background sound</Text>
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
                  <Text
                    style={[
                      styles.soundLabel,
                      selectedSound === option.key && styles.soundLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.soundNote}>
              {selectedSound === 'none'
                ? 'Session will be silent'
                : `${currentSoundOption?.label} will loop during your session`}
            </Text>
          </View>

          <View style={styles.startButtonWrap}>
            <TouchableOpacity
              style={[
                styles.startButton,
                { backgroundColor: exerciseAccent(selectedExercise) },
              ]}
              onPress={startBreathing}
              disabled={soundLoading}
            >
              {soundLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>
                    {isTimedBreath(selectedExercise)
                      ? 'Start breathing session'
                      : 'Start guided session'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.detailsSection}>
            <LinearGradient
              colors={[COLORS.primaryLight + '40', COLORS.surface]}
              style={styles.detailsCardGradient}
            >
              <View style={styles.detailsHeader}>
                <View
                  style={[
                    styles.techniqueColor,
                    { backgroundColor: exerciseAccent(selectedExercise) },
                  ]}
                />
                <View style={styles.detailsTitle}>
                  <Text style={styles.categoryBadge}>{selectedExercise.category}</Text>
                  <Text style={styles.currentTechniqueName}>{selectedExercise.name}</Text>
                  <Text style={styles.currentTechniqueDesc}>{selectedExercise.primaryGoal}</Text>
                  <Text style={styles.instructionsBody}>{selectedExercise.instructions}</Text>
                  <Text style={styles.durationLine}>Typical duration: {selectedExercise.duration}</Text>
                </View>
              </View>

              {timedPreview && (
                <>
                  <Text style={styles.phaseSectionTitle}>Breath pattern</Text>
                  <View style={styles.phaseList}>
                    {timedPreview.phases.map((phase, index) => (
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
                      <Text style={styles.infoText}>{timedPreview.cycles} cycles</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="time" size={20} color={COLORS.textLight} />
                      <Text style={styles.infoText}>
                        ~{estimatedTimedSessionSeconds(timedPreview)}s total
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </LinearGradient>
          </View>
        </>
      ) : timedSessionActive && timedActive && currentPhaseData ? (
        <View style={styles.activeContainer}>
          <View style={styles.animationContainer}>
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                  backgroundColor: timedActive.color,
                },
              ]}
            >
              <Text style={styles.phaseLabelActive}>{currentPhaseData.label}</Text>
              <Text style={styles.timeLeft}>{timeLeft}s</Text>
              <Text style={styles.cycleInfo}>
                Cycle {cycleCount + 1} of {timedActive.cycles}
              </Text>
            </Animated.View>

            <View style={styles.phaseIndicators}>
              {timedActive.phases.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.phaseDot,
                    index === currentPhase && styles.phaseDotActive,
                    { backgroundColor: timedActive.color },
                  ]}
                />
              ))}
            </View>
          </View>

          <Card style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>{currentPhaseData.instruction}</Text>
            {currentPhaseData.dhikrText ? (
              <Text style={styles.dhikrEmphasis}>{currentPhaseData.dhikrText}</Text>
            ) : null}
            <Text style={styles.nextPhase}>
              Next:{' '}
              {
                timedActive.phases[(currentPhase + 1) % timedActive.phases.length]
                  ?.label
              }
            </Text>
          </Card>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.soundControl,
                selectedSound !== 'none' && { backgroundColor: COLORS.primaryLight + '30' },
              ]}
              onPress={() => setShowSoundMenu(!showSoundMenu)}
            >
              <Ionicons
                name={currentSoundOption?.icon || 'volume-mute'}
                size={24}
                color={
                  selectedSound === 'none' ? COLORS.textLight : timedActive.color
                }
              />
              {selectedSound !== 'none' && isSoundPlaying && (
                <View style={styles.soundPlayingIndicator} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.stopButton} onPress={completeSession}>
              <Ionicons name="stop-circle" size={24} color={COLORS.error} />
              <Text style={styles.stopButtonText}>End session</Text>
            </TouchableOpacity>
          </View>

          {showSoundMenu && (
            <Card style={styles.soundMenu}>
              <Text style={styles.soundMenuTitle}>Change sound</Text>
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
                    color={
                      selectedSound === option.key ? timedActive.color : COLORS.text
                    }
                  />
                  <Text
                    style={[
                      styles.soundMenuLabel,
                      selectedSound === option.key && { color: timedActive.color },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedSound === option.key && (
                    <Ionicons name="checkmark" size={16} color={timedActive.color} />
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((cycleCount * timedActive.phases.length + currentPhase) /
                      (timedActive.cycles * timedActive.phases.length)) *
                      100}%`,
                    backgroundColor: timedActive.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {cycleCount + 1}/{timedActive.cycles} cycles
            </Text>
          </View>

          {selectedSound !== 'none' && (
            <View style={styles.soundStatus}>
              <Ionicons
                name={isSoundPlaying ? 'volume-high' : 'volume-mute'}
                size={16}
                color={isSoundPlaying ? COLORS.success : COLORS.textLight}
              />
              <Text
                style={[
                  styles.soundStatusText,
                  { color: isSoundPlaying ? COLORS.success : COLORS.textLight },
                ]}
              >
                {isSoundPlaying ? `${currentSoundOption?.label} playing` : 'Sound loading…'}
              </Text>
            </View>
          )}
        </View>
      ) : guidedSessionActive && isGuided(selectedExercise) ? (
        <View style={styles.activeContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.guidedSessionTitle}>{selectedExercise.name}</Text>
            <Text style={styles.guidedGoal}>{selectedExercise.primaryGoal}</Text>
            <Text style={styles.guidedInstructions}>{selectedExercise.instructions}</Text>
            {guidedTimeLeftSec !== null && guidedTimeLeftSec > 0 ? (
              <Text style={styles.guidedTimer}>
                {formatCountdown(guidedTimeLeftSec)} left
              </Text>
            ) : (
              <Text style={styles.guidedNoTimer}>
                Take your time — end the session when you are ready.
              </Text>
            )}
          </ScrollView>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.soundControl,
                selectedSound !== 'none' && { backgroundColor: COLORS.primaryLight + '30' },
              ]}
              onPress={() => setShowSoundMenu(!showSoundMenu)}
            >
              <Ionicons
                name={currentSoundOption?.icon || 'volume-mute'}
                size={24}
                color={
                  selectedSound === 'none'
                    ? COLORS.textLight
                    : exerciseAccent(selectedExercise)
                }
              />
              {selectedSound !== 'none' && isSoundPlaying && (
                <View style={styles.soundPlayingIndicator} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stopButton}
              onPress={() => void endGuidedSessionManual()}
            >
              <Ionicons name="stop-circle" size={24} color={COLORS.error} />
              <Text style={styles.stopButtonText}>End session</Text>
            </TouchableOpacity>
          </View>

          {showSoundMenu && (
            <Card style={styles.soundMenu}>
              <Text style={styles.soundMenuTitle}>Change sound</Text>
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
                    color={
                      selectedSound === option.key
                        ? exerciseAccent(selectedExercise)
                        : COLORS.text
                    }
                  />
                  <Text
                    style={[
                      styles.soundMenuLabel,
                      selectedSound === option.key && {
                        color: exerciseAccent(selectedExercise),
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedSound === option.key && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={exerciseAccent(selectedExercise)}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {selectedSound !== 'none' && (
            <View style={styles.soundStatus}>
              <Ionicons
                name={isSoundPlaying ? 'volume-high' : 'volume-mute'}
                size={16}
                color={isSoundPlaying ? COLORS.success : COLORS.textLight}
              />
              <Text
                style={[
                  styles.soundStatusText,
                  { color: isSoundPlaying ? COLORS.success : COLORS.textLight },
                ]}
              >
                {isSoundPlaying ? `${currentSoundOption?.label} playing` : 'Sound loading…'}
              </Text>
            </View>
          )}
        </View>
      ) : null}
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
  categoryBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  instructionsBody: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
    marginTop: SPACING.sm,
  },
  durationLine: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: SPACING.md,
    fontWeight: '500',
  },
  phaseSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  dhikrEmphasis: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  guidedSessionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  guidedGoal: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  guidedInstructions: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 26,
    marginBottom: SPACING.xl,
  },
  guidedTimer: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  guidedNoTimer: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  section: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
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
    marginTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: LAYOUT.cardPadding,
    marginBottom: SPACING.md,
    borderWidth: 0,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  listCardSelected: {
    backgroundColor: COLORS.primaryLight + '45',
    borderLeftColor: COLORS.primary,
  },
  listCardPressed: {
    opacity: 0.92,
  },
  listCardChevron: {
    marginLeft: SPACING.sm,
    flexShrink: 0,
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
  listCardMetaText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  listCardType: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  detailsSection: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    marginTop: SPACING.md,
  },
  detailsCardGradient: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
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
    marginBottom: SPACING.md,
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
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
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