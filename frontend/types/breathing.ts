export type BreathingDepartmentId =
  | 'mood'
  | 'sleep'
  | 'mindfulness'
  | 'relationships'
  | 'dhikr';

export interface BreathingDepartment {
  id: BreathingDepartmentId;
  title: string;
  focus: string;
}

/** One phase of a timed breathing pattern */
export interface BreathPhase {
  duration: number;
  label: string;
  instruction: string;
  dhikrText?: string;
  /** If false, use subtle pulse only (steps that are not full inhale/exhale) */
  animateAsBreath?: boolean;
}

export interface BreathingExerciseBase {
  id: string;
  departmentId: BreathingDepartmentId;
  category: string;
  name: string;
  primaryGoal: string;
  instructions: string;
  duration: string;
}

export interface TimedBreathExercise extends BreathingExerciseBase {
  kind: 'timedBreath';
  phases: BreathPhase[];
  cycles: number;
  color: string;
}

export interface GuidedExercise extends BreathingExerciseBase {
  kind: 'guided';
  suggestedTimerMinutes?: number | { min: number; max: number };
}

export type BreathingExercise = TimedBreathExercise | GuidedExercise;

export function isTimedBreath(
  exercise: BreathingExercise
): exercise is TimedBreathExercise {
  return exercise.kind === 'timedBreath';
}

export function isGuided(exercise: BreathingExercise): exercise is GuidedExercise {
  return exercise.kind === 'guided';
}

/** Seconds for optional guided countdown; `null` = open-ended practice. */
export function guidedTimerTotalSeconds(exercise: GuidedExercise): number | null {
  const s = exercise.suggestedTimerMinutes;
  if (s === undefined) return null;
  if (typeof s === 'number') return Math.round(Math.max(0.25, s) * 60);
  const midMin = ((s.min + s.max) / 2);
  return Math.round(Math.max(0.25, midMin) * 60);
}

export function estimatedTimedSessionSeconds(exercise: TimedBreathExercise): number {
  const phaseSum = exercise.phases.reduce((acc, p) => acc + p.duration, 0);
  return phaseSum * exercise.cycles;
}
