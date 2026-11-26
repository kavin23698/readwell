// Screen 69 · Daily goal & reminder.
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { AppBar } from '@/components/kit/AppBar';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Sheet } from '@/components/kit/Sheet';
import { Toggle } from '@/components/kit/Toggle';
import { Meta } from '@/components/kit/Typography';
import { STREAK_HOUR } from '@/features/notifications/scheduler';
import { GoalEditor } from '@/features/onboarding/GoalEditor';
import { TimeWheel } from '@/features/onboarding/TimeWheel';
import { useProfile } from '@/features/profile/ProfileProvider';
import type { GoalType } from '@/features/profile/types';
import { formatTime } from '@/lib/time';
import { colors, font } from '@/theme';

export default function GoalSettings() {
  const { profile, update } = useProfile();
  const [goalType, setGoalType] = useState<GoalType>(profile?.goal_type ?? 'minutes');
  const [goal, setGoal] = useState(profile?.daily_goal ?? 15);
  const [time, setTime] = useState(profile?.reminder_time ?? '20:30');
  const [streak, setStreak] = useState(profile?.notif_streak ?? true);
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState(time);

  return (
    <Screen>
      <AppBar title="Daily goal & reminder" />
      <Body gap={12}>
        <GlassCard padding={14} title="Daily goal">
          <GoalEditor
            big={false}
            type={goalType}
            value={goal}
            onChange={(t, v) => {
              setGoalType(t);
              setGoal(v);
            }}
          />
        </GlassCard>
        <GlassCard padding={14} title="Reminder">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[font(800, 28, 1.1), { color: colors.rwInk }]}>{formatTime(time)}</Text>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => {
                setDraft(time);
                setPicking(true);
              }}>
              Change
            </Button>
          </View>
          <Meta>One gentle reminder a day at this time.</Meta>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[font(700, 14, 1.3), { color: colors.rwInk }]}>Streak-at-risk nudge</Text>
              <Meta>{formatTime(`${STREAK_HOUR}:00`)} if you haven&apos;t reached today&apos;s goal</Meta>
            </View>
            <Toggle on={streak} onChange={setStreak} label="Streak-at-risk nudge" />
          </View>
        </GlassCard>
      </Body>
      <Actions>
        <Button
          fullWidth
          size="lg"
          onPress={async () => {
            await update({ goal_type: goalType, daily_goal: goal, reminder_time: time, notif_streak: streak });
            router.back();
          }}>
          Save
        </Button>
      </Actions>
      <Sheet visible={picking} onClose={() => setPicking(false)} title="Reminder time">
        <TimeWheel value={draft} onChange={setDraft} />
        <Button
          fullWidth
          size="lg"
          onPress={() => {
            setTime(draft);
            setPicking(false);
          }}>
          Done
        </Button>
      </Sheet>
    </Screen>
  );
}
