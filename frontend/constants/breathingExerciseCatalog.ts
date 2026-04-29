import { COLORS } from './Colors';
import type {
  BreathingDepartment,
  BreathingExercise,
  BreathingDepartmentId,
} from '../types/breathing';


export const DEPARTMENTS: BreathingDepartment[] = [
  {
    id: 'mood',
    title: 'Mood regulation',
    focus:
      'Managing immediate emotional distress, reframing negative thoughts, and building behavioral momentum.',
  },
  {
    id: 'sleep',
    title: 'Sleep disorders',
    focus:
      'Quieting the racing mind, releasing physical tension, and regulating the circadian rhythm.',
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    focus:
      'Cultivating present-moment awareness, breaking autopilot, and working skillfully with difficult emotions.',
  },
  {
    id: 'relationships',
    title: 'Relationship issues',
    focus:
      'Self-regulation during conflict, effective communication, boundary setting, and repair.',
  },
  {
    id: 'dhikr',
    title: 'Dhikr',
    focus:
      'Breathing patterns paired with Islamic remembrance — calm body and heart together.',
  },
];

export function getDepartment(id: BreathingDepartmentId): BreathingDepartment {
  const d = DEPARTMENTS.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown department ${id}`);
  return d;
}

export const BREATHING_EXERCISES: BreathingExercise[] = [
  // --- Dept 1: Mood ---
  {
    id: 'mr-sensory-54321',
    kind: 'guided',
    departmentId: 'mood',
    category: 'Grounding',
    name: '5-4-3-2-1 Sensory Grounding',
    primaryGoal:
      'Snap the brain out of a stress response by focusing on the present environment.',
    instructions:
      'Acknowledge 5 things you see, 4 you can touch, 3 you hear, 2 you can smell, 1 you can taste.',
    duration: '3-5 min',
    suggestedTimerMinutes: { min: 3, max: 5 },
  },
  {
    id: 'mr-box-breathing',
    kind: 'timedBreath',
    departmentId: 'mood',
    category: 'Grounding',
    name: 'Box Breathing (Square Breathing)',
    primaryGoal: 'Regulate the nervous system and slow down a racing heart.',
    instructions:
      'Inhale for 4, hold for 4, exhale for 4, hold for 4. Repeat.',
    duration: '1-5 min',
    phases: [
      { duration: 4, label: 'INHALE', instruction: 'Breathe in slowly through your nose' },
      { duration: 4, label: 'HOLD', instruction: 'Hold your breath comfortably', animateAsBreath: false },
      { duration: 4, label: 'EXHALE', instruction: 'Exhale slowly through your mouth' },
      { duration: 4, label: 'HOLD', instruction: 'Hold before next breath', animateAsBreath: false },
    ],
    cycles: 8,
    color: COLORS.primary,
  },
  {
    id: 'mr-three-good-things',
    kind: 'guided',
    departmentId: 'mood',
    category: 'Cognitive',
    name: 'Three Good Things',
    primaryGoal: 'Train the brain to scan for positives, counteracting negativity bias.',
    instructions:
      'Before bed, write down three things that went well today and why they happened.',
    duration: '5 min',
    suggestedTimerMinutes: 5,
  },
  {
    id: 'mr-thought-defusion',
    kind: 'guided',
    departmentId: 'mood',
    category: 'Cognitive',
    name: 'Thought Defusion (Leaves on a Stream)',
    primaryGoal:
      'Create distance from negative thoughts, seeing them as passing events.',
    instructions:
      'Visualize thoughts on leaves floating down a stream. Observe them without engaging or grabbing.',
    duration: '5-10 min',
    suggestedTimerMinutes: { min: 5, max: 10 },
  },
  {
    id: 'mr-five-minute-rule',
    kind: 'guided',
    departmentId: 'mood',
    category: 'Behavioral',
    name: 'The 5-Minute Rule',
    primaryGoal:
      'Overcome paralysis by lowering the barrier to entry for a task.',
    instructions:
      'Commit to doing one small, avoided task for just five minutes. Permission to stop after.',
    duration: '5 min+',
    suggestedTimerMinutes: 5,
  },
  {
    id: 'mr-sensory-pleasure',
    kind: 'guided',
    departmentId: 'mood',
    category: 'Behavioral',
    name: 'Sensory Pleasure Inventory',
    primaryGoal:
      'Gently re-engage with the world through the senses when feeling numb.',
    instructions:
      'Pick a sense (touch, taste, smell) and do one small thing to engage it (for example, light a candle).',
    duration: '2-5 min',
    suggestedTimerMinutes: { min: 2, max: 5 },
  },
  {
    id: 'mr-name-it-tame-it',
    kind: 'guided',
    departmentId: 'mood',
    category: 'Emotional',
    name: 'Name It to Tame It',
    primaryGoal: 'Reduce the intensity of an emotion by accurately labeling it.',
    instructions:
      'When feeling a strong emotion, pause and give it a specific name — not just \"angry\" but, for example, \"disrespected\".',
    duration: '1 min',
    suggestedTimerMinutes: 1,
  },
  {
    id: 'mr-self-compassion-break',
    kind: 'guided',
    departmentId: 'mood',
    category: 'Emotional',
    name: 'Self-Compassion Break',
    primaryGoal: 'Treat yourself with the same kindness offered to a friend.',
    instructions:
      'Place your hand on your heart. Acknowledge suffering, remember common humanity, offer yourself kindness.',
    duration: '3-5 min',
    suggestedTimerMinutes: { min: 3, max: 5 },
  },

  // --- Dept 2: Sleep ---
  {
    id: 'sleep-cognitive-shuffle',
    kind: 'guided',
    departmentId: 'sleep',
    category: 'Racing mind',
    name: 'The Cognitive Shuffle',
    primaryGoal: 'Interrupt rumination by forcing a random, boring mental task.',
    instructions:
      'Pick a word. For each letter, think of as many words as you can starting with that letter, picturing each one.',
    duration: '5-15 min',
    suggestedTimerMinutes: { min: 5, max: 15 },
  },
  {
    id: 'sleep-worry-time-transfer',
    kind: 'guided',
    departmentId: 'sleep',
    category: 'Racing mind',
    name: 'The Worry Time Transfer',
    primaryGoal: 'Train the brain that the bed is not for problem-solving.',
    instructions:
      'Designate \"Worry Time\" during the day. At night, if worries arise, mentally file them for that time.',
    duration: '2 min',
    suggestedTimerMinutes: 2,
  },
  {
    id: 'sleep-three-minute-breathing-space',
    kind: 'timedBreath',
    departmentId: 'sleep',
    category: 'Racing mind',
    name: '3-Minute Breathing Space (Bedtime)',
    primaryGoal: 'Transition from \"doing mode\" to \"being mode\" at the bedside.',
    instructions:
      'Minute 1: Acknowledge thoughts and feelings. Minute 2: Gather focus on breath. Minute 3: Expand awareness to the whole body.',
    duration: '3 min',
    phases: [
      {
        duration: 60,
        label: 'MINUTE 1',
        instruction: 'Acknowledge thoughts and feelings as they are.',
        animateAsBreath: false,
      },
      {
        duration: 60,
        label: 'MINUTE 2',
        instruction: 'Gather attention on the breath.',
        animateAsBreath: false,
      },
      {
        duration: 60,
        label: 'MINUTE 3',
        instruction: 'Expand awareness to the whole body.',
        animateAsBreath: false,
      },
    ],
    cycles: 1,
    color: '#4CAF50',
  },
  {
    id: 'sleep-pmr',
    kind: 'guided',
    departmentId: 'sleep',
    category: 'Physical tension',
    name: 'Progressive Muscle Relaxation (PMR)',
    primaryGoal: 'Release physical stress by contrasting tension and release in muscle groups.',
    instructions:
      'Systematically tense a muscle group for 5 seconds, then release for 10–15 seconds. Move through the body (feet to face).',
    duration: '10-15 min',
    suggestedTimerMinutes: { min: 10, max: 15 },
  },
  {
    id: 'sleep-body-scan',
    kind: 'guided',
    departmentId: 'sleep',
    category: 'Physical tension',
    name: 'Body Scan for Sleep',
    primaryGoal:
      'Anchor the mind in physical sensation while systematically relaxing the body.',
    instructions:
      'Slowly move attention through the body from feet to head, noticing sensations and inviting relaxation with each exhale.',
    duration: '10-20 min',
    suggestedTimerMinutes: { min: 10, max: 20 },
  },
  {
    id: 'sleep-fifteen-minute-rule',
    kind: 'guided',
    departmentId: 'sleep',
    category: 'Sleep hygiene',
    name: 'The 15-Minute Rule (Stimulus Control)',
    primaryGoal: 'Break the association between the bed and wakefulness or frustration.',
    instructions:
      'If not asleep after about 15 minutes, get up, do a boring activity in dim light, and only return to bed when sleepy.',
    duration: 'Ongoing',
  },
  {
    id: 'sleep-wind-down-ritual',
    kind: 'guided',
    departmentId: 'sleep',
    category: 'Sleep hygiene',
    name: 'The Wind-Down Ritual',
    primaryGoal:
      'Create a predictable routine that signals to the brain that sleep is coming.',
    instructions:
      'A 30–60 minute pre-sleep routine: dim lights, no screens, quiet activity, hygiene, relaxation exercise.',
    duration: '30-60 min',
    suggestedTimerMinutes: { min: 30, max: 60 },
  },
  {
    id: 'sleep-morning-light',
    kind: 'guided',
    departmentId: 'sleep',
    category: 'Circadian rhythm',
    name: 'Morning Light Exposure',
    primaryGoal: 'Regulate the circadian rhythm by signaling the brain to start the day.',
    instructions:
      'Within 30–60 minutes of waking, get 10–15 minutes of natural light in your eyes (no sunglasses).',
    duration: '10-15 min',
    suggestedTimerMinutes: { min: 10, max: 15 },
  },

  // --- Dept 3: Mindfulness ---
  {
    id: 'mind-anchor-breathing',
    kind: 'timedBreath',
    departmentId: 'mindfulness',
    category: 'Foundational',
    name: 'Anchor Breathing',
    primaryGoal:
      'Build attention by focusing on the breath and returning when the mind wanders.',
    instructions:
      'Sit comfortably. Focus on the physical sensation of the breath. When the mind wanders, gently bring it back.',
    duration: '3-15 min',
    phases: [
      { duration: 4, label: 'INHALE', instruction: 'Feel the inhale gently' },
      { duration: 4, label: 'EXHALE', instruction: 'Feel the exhale gently' },
    ],
    cycles: 24,
    color: '#2196F3',
  },
  {
    id: 'mind-body-scan',
    kind: 'guided',
    departmentId: 'mindfulness',
    category: 'Foundational',
    name: 'Body Scan Meditation',
    primaryGoal:
      'Develop body awareness and be present with physical sensations without judgment.',
    instructions:
      'Systematically move attention through the body from feet to head, observing sensations.',
    duration: '10-20 min',
    suggestedTimerMinutes: { min: 10, max: 20 },
  },
  {
    id: 'mind-mindful-listening',
    kind: 'guided',
    departmentId: 'mindfulness',
    category: 'Foundational',
    name: 'Mindful Listening',
    primaryGoal:
      'Train open, receptive awareness using sound as an anchor.',
    instructions:
      'Sit and simply receive sounds near and far, without labeling or judging them.',
    duration: '5-10 min',
    suggestedTimerMinutes: { min: 5, max: 10 },
  },
  {
    id: 'mind-mindful-walking',
    kind: 'guided',
    departmentId: 'mindfulness',
    category: 'Informal',
    name: 'Mindful Walking',
    primaryGoal:
      'Bring mindfulness into movement and daily life.',
    instructions:
      'Bring full attention to walking: feet contacting the ground, movement of the body.',
    duration: '5-15 min',
    suggestedTimerMinutes: { min: 5, max: 15 },
  },
  {
    id: 'mind-mindful-eating',
    kind: 'guided',
    departmentId: 'mindfulness',
    category: 'Informal',
    name: 'Mindful Eating (The Raisin)',
    primaryGoal:
      'Slow down and truly experience the senses — break autopilot eating.',
    instructions:
      'Use all senses to explore a small piece of food — look, touch, smell, place, taste — and swallow slowly.',
    duration: '5 min',
    suggestedTimerMinutes: 5,
  },
  {
    id: 'mind-stop-mindfulness',
    kind: 'guided',
    departmentId: 'mindfulness',
    category: 'Informal',
    name: 'The STOP Mindfulness Bell',
    primaryGoal: 'Insert short moments of mindfulness into a busy day.',
    instructions:
      'Several times a day: Stop, Take a breath, Observe, Proceed.',
    duration: '1 min',
    suggestedTimerMinutes: 1,
  },
  {
    id: 'mind-rain',
    kind: 'guided',
    departmentId: 'mindfulness',
    category: 'Difficult emotions',
    name: 'RAIN Acronym',
    primaryGoal:
      'Use mindfulness in a structured way with difficult emotions.',
    instructions:
      'Recognize, Allow, Investigate (with kindness), Nurture.',
    duration: '5-10 min',
    suggestedTimerMinutes: { min: 5, max: 10 },
  },
  {
    id: 'mind-urge-surfing',
    kind: 'guided',
    departmentId: 'mindfulness',
    category: 'Difficult emotions',
    name: 'Urge Surfing',
    primaryGoal:
      'Ride strong cravings or impulses without acting on them.',
    instructions:
      'Observe physical sensations of an urge — notice how it changes, crests, and subsides like a wave.',
    duration: '3-10 min',
    suggestedTimerMinutes: { min: 3, max: 10 },
  },

  // --- Dept 4: Relationships ---
  {
    id: 'rel-physiological-sigh',
    kind: 'timedBreath',
    departmentId: 'relationships',
    category: 'Self-regulation',
    name: 'The Physiological Sigh',
    primaryGoal:
      'Rapidly down-regulate the nervous system during conflict.',
    instructions:
      'Take a deep breath in; take a second short sip of air; then exhale slowly and completely.',
    duration: '30 sec',
    phases: [
      { duration: 4, label: 'INHALE', instruction: 'Take a deep breath in through your nose' },
      { duration: 1, label: 'SIP', instruction: 'Second short sip of air', animateAsBreath: false },
      { duration: 8, label: 'EXHALE', instruction: 'Exhale slowly and completely through the mouth' },
    ],
    cycles: 10,
    color: '#059669',
  },
  {
    id: 'rel-stopp-pause',
    kind: 'guided',
    departmentId: 'relationships',
    category: 'Self-regulation',
    name: 'The Pause Button (STOPP)',
    primaryGoal:
      'Create space between a trigger and a reaction.',
    instructions:
      'Stop, Take a breath, Observe thoughts and feelings, Pull back to a wider perspective, Practice what works.',
    duration: '2-3 min',
    suggestedTimerMinutes: { min: 2, max: 3 },
  },
  {
    id: 'rel-grounding-before-speaking',
    kind: 'guided',
    departmentId: 'relationships',
    category: 'Self-regulation',
    name: 'Grounding Before Speaking',
    primaryGoal:
      'Shift from emotional flooding to a calmer state before responding.',
    instructions:
      'Place feet flat on the floor and feel the ground; press fingertips together. Take a breath, then speak.',
    duration: '1 min',
    suggestedTimerMinutes: 1,
  },
  {
    id: 'rel-i-feel-statements',
    kind: 'guided',
    departmentId: 'relationships',
    category: 'Communication',
    name: '\"I Feel\" Statements',
    primaryGoal: 'Express a difficult emotion without blaming the other person.',
    instructions:
      'Use: \"When [situation], I feel [emotion], because [impact]. What I need is [request].\"',
    duration: 'Varies',
  },
  {
    id: 'rel-reflective-listening',
    kind: 'guided',
    departmentId: 'relationships',
    category: 'Communication',
    name: 'Reflective Listening (Playback)',
    primaryGoal:
      'Help the other person feel heard and understood.',
    instructions:
      '"Let me make sure I understand. What I\'m hearing you say is …" Stop and let them confirm or correct.',
    duration: 'Varies',
  },
  {
    id: 'rel-gratitude-pivot',
    kind: 'guided',
    departmentId: 'relationships',
    category: 'Communication',
    name: 'The Gratitude Pivot',
    primaryGoal:
      'Counter negativity bias by scanning for positives in a relationship.',
    instructions:
      'Write one specific thing the person did recently that you appreciated — reflect on why it mattered.',
    duration: '3 min',
    suggestedTimerMinutes: 3,
  },
  {
    id: 'rel-boundary-script',
    kind: 'guided',
    departmentId: 'relationships',
    category: 'Boundaries',
    name: 'The Boundary Script',
    primaryGoal:
      'Prepare a kind but firm \"no\" or limit.',
    instructions:
      'Write: 1) The boundary 2) The reason (optional) 3) The alternative (optional). Practice out loud.',
    duration: '10 min',
    suggestedTimerMinutes: 10,
  },
  {
    id: 'rel-loving-kindness-difficult',
    kind: 'guided',
    departmentId: 'relationships',
    category: 'Boundaries',
    name: 'Loving-Kindness for Difficult People',
    primaryGoal:
      'Ease resentment without condoning harmful behavior.',
    instructions:
      'In a quiet space, direct phrases toward the person: \"May you be safe, happy, healthy, live with ease.\"',
    duration: '5-10 min',
    suggestedTimerMinutes: { min: 5, max: 10 },
  },
  {
    id: 'rel-structured-apology',
    kind: 'guided',
    departmentId: 'relationships',
    category: 'Repair',
    name: 'The Structured Apology',
    primaryGoal: 'Go beyond a quick apology toward genuine repair.',
    instructions:
      'Include regret, specific acknowledgment, empathy or impact statement, and a statement of repair or change.',
    duration: 'Varies',
  },
  {
    id: 'rel-post-conflict-checkin',
    kind: 'guided',
    departmentId: 'relationships',
    category: 'Repair',
    name: 'Post-Conflict Check-In',
    primaryGoal:
      'Reconnect after a disagreement has cooled down.',
    instructions:
      'At a calm time, ask how you are both feeling about the earlier conversation — whether anything is left to address.',
    duration: '5-15 min',
    suggestedTimerMinutes: { min: 5, max: 15 },
  },

  // --- Dept 5: Dhikr ---
  {
    id: 'dhikr-allahu',
    kind: 'timedBreath',
    departmentId: 'dhikr',
    category: 'Dhikr',
    name: '4/6 Dhikr (Allah-Hu)',
    primaryGoal:
      'Pair slow breath with remembrance — inhale Allah, exhale Hu.',
    instructions:
      'Inhale saying \"Allah\"; exhale saying \"Hu\" — combine regulation with remembrance.',
    duration: 'Flexible',
    phases: [
      {
        duration: 4,
        label: 'INHALE',
        instruction: 'Inhale slowly, say Allah in your heart',
        dhikrText: 'Allah',
      },
      {
        duration: 6,
        label: 'EXHALE',
        instruction: 'Exhale slowly, say Hu in your heart',
        dhikrText: 'Hu',
      },
    ],
    cycles: 10,
    color: '#7C3AED',
  },
  {
    id: 'dhikr-tasbeeh',
    kind: 'timedBreath',
    departmentId: 'dhikr',
    category: 'Dhikr',
    name: 'Tasbeeh Slow (SubhanAllah)',
    primaryGoal:
      'Slow the breath and heart rate across many gentle exhalations.',
    instructions:
      'Exhale with SubhanAllah on each breath; 33 rounds naturally slow pace.',
    duration: 'Flexible',
    phases: [
      { duration: 4, label: 'INHALE', instruction: 'Inhale deeply and slowly' },
      {
        duration: 6,
        label: 'EXHALE',
        instruction: 'Exhale slowly, say SubhanAllah',
        dhikrText: 'SubhanAllah',
      },
    ],
    cycles: 33,
    color: '#059669',
  },
  {
    id: 'dhikr-ya-salaam',
    kind: 'timedBreath',
    departmentId: 'dhikr',
    category: 'Dhikr',
    name: 'Ya Salaam (Anxiety Relief)',
    primaryGoal:
      'Repeat Ya Salaam (The Source of Peace) with 4s inhale, 6s exhale.',
    instructions:
      'For anxiety — breathe slowly with Ya Salaam on the exhale.',
    duration: 'Flexible',
    phases: [
      { duration: 4, label: 'INHALE', instruction: 'Inhale slowly' },
      {
        duration: 6,
        label: 'EXHALE',
        instruction: 'Exhale slowly, say Ya Salaam',
        dhikrText: 'Ya Salaam',
      },
    ],
    cycles: 10,
    color: COLORS.text,
  },
  {
    id: 'dhikr-ya-haleem',
    kind: 'timedBreath',
    departmentId: 'dhikr',
    category: 'Dhikr',
    name: 'Ya Haleem (Anger Regulation)',
    primaryGoal:
      'Repeat Ya Haleem (The Most Forbearing) for calming anger.',
    instructions:
      '4s inhale, 6s exhale — say Ya Haleem on the exhale.',
    duration: 'Flexible',
    phases: [
      { duration: 4, label: 'INHALE', instruction: 'Inhale slowly' },
      {
        duration: 6,
        label: 'EXHALE',
        instruction: 'Exhale slowly, say Ya Haleem',
        dhikrText: 'Ya Haleem',
      },
    ],
    cycles: 10,
    color: '#7C3AED',
  },
];
