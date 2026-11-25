export type GoalType = 'minutes' | 'pages';
export type ReadingMode = 'slide' | 'scroll';

export type Profile = {
  user_id: string;
  display_name: string;
  goal_type: GoalType;
  daily_goal: number;
  reminder_time: string; // "HH:MM", 24h, device local time
  reading_mode: ReadingMode;
  translation_language: string; // ML Kit / BCP-47 code, e.g. "hi"
  onboarding_completed: boolean;
  notif_daily: boolean;
  notif_streak: boolean;
  notif_challenge: boolean;
  created_at: string;
  updated_at: string;
};

/** What onboarding collects. */
export type OnboardingChoices = Pick<Profile, 'goal_type' | 'daily_goal' | 'reminder_time' | 'reading_mode' | 'translation_language'>;

export const defaultChoices: OnboardingChoices = {
  goal_type: 'minutes',
  daily_goal: 15,
  reminder_time: '20:30',
  reading_mode: 'slide',
  translation_language: 'hi',
};
