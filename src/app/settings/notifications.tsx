// Screen 70 · Notification settings: one switch per type; system permission status.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { AppBar } from '@/components/kit/AppBar';
import { Banner } from '@/components/kit/Banner';
import { Body } from '@/components/kit/Layout';
import { Row } from '@/components/kit/Row';
import { Screen } from '@/components/kit/Screen';
import { Toggle } from '@/components/kit/Toggle';
import { Lnk, Meta } from '@/components/kit/Typography';
import { notificationsAllowed, requestNotificationPermission } from '@/features/notifications/permissions';
import { invalidateSchedule, STREAK_HOUR } from '@/features/notifications/scheduler';
import { useProfile } from '@/features/profile/ProfileProvider';
import { formatTime } from '@/lib/time';

export default function NotificationSettings() {
  const { profile, update } = useProfile();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      notificationsAllowed().then(setAllowed);
    }, []),
  );

  if (!profile) return <Screen />;

  async function turnOn() {
    const granted = await requestNotificationPermission();
    if (!granted) await Linking.openSettings();
    invalidateSchedule();
    setAllowed(await notificationsAllowed());
  }

  return (
    <Screen>
      <AppBar title="Notifications" />
      <Body gap={12}>
        {allowed === false ? (
          <Banner
            icon="bell-off"
            action={
              <Button size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={turnOn}>
                Turn on notifications
              </Button>
            }>
            Notifications are off for Readwell, so none of these will arrive.
          </Banner>
        ) : null}
        <GlassCard padding={{ vertical: 2, horizontal: 8 }} gap={0}>
          <Row
            label="Daily reading reminder"
            sub={`Every day at ${formatTime(profile.reminder_time)}`}
            right={<Toggle label="Daily reading reminder" on={profile.notif_daily} onChange={(v) => update({ notif_daily: v })} />}
          />
          <Row
            label="Streak at risk"
            sub={`${formatTime(`${STREAK_HOUR}:00`)}, only if you haven’t reached today’s goal`}
            right={<Toggle label="Streak at risk" on={profile.notif_streak} onChange={(v) => update({ notif_streak: v })} />}
          />
          <Row
            label="Challenge ending soon"
            sub="2 days before the end, if you’re under 75%"
            last
            right={<Toggle label="Challenge ending soon" on={profile.notif_challenge} onChange={(v) => update({ notif_challenge: v })} />}
          />
        </GlassCard>
        <Meta style={{ paddingHorizontal: 4 }}>
          If notifications are blocked for Readwell in Android settings, these won&apos;t arrive.{' '}
          <Lnk onPress={() => Linking.openSettings()}>Open system settings</Lnk>
        </Meta>
      </Body>
    </Screen>
  );
}
