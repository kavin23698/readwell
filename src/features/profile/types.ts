import type { ProfileRow } from '@/db/schema';

export type Profile = ProfileRow;
export type GoalType = ProfileRow['goal_type'];
export type ReadingMode = ProfileRow['reading_mode'];

/** What onboarding collects. */
export type OnboardingChoices = Pick<Profile, 'goal_type' | 'daily_goal' | 'reminder_time' | 'reading_mode' | 'translation_language'>;

export const defaultChoices: OnboardingChoices = {
  goal_type: 'minutes',
  daily_goal: 15,
  reminder_time: '20:30',
  reading_mode: 'slide',
  translation_language: 'hi',
};
