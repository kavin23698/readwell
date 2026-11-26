// Screens 67 + 71 · Settings and Log out — confirm.
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { GlassCard } from '@/components/ds/GlassCard';
import { AppBar } from '@/components/kit/AppBar';
import { Dialog } from '@/components/kit/Dialog';
import { Body } from '@/components/kit/Layout';
import { Row } from '@/components/kit/Row';
import { Screen } from '@/components/kit/Screen';
import { Sheet } from '@/components/kit/Sheet';
import { Micro } from '@/components/kit/Typography';
import { useAuth } from '@/features/auth/AuthProvider';
import { notificationsAllowed } from '@/features/notifications/permissions';
import { LanguageSheet } from '@/features/onboarding/LanguagePicker';
import { languages } from '@/features/onboarding/languages';
import { ModeOption } from '@/features/onboarding/ModeOption';
import { useProfile } from '@/features/profile/ProfileProvider';
import { supabase } from '@/lib/supabase';
import { formatTime } from '@/lib/time';

export default function Settings() {
  const { session } = useAuth();
  const { profile, update } = useProfile();
  const [confirm, setConfirm] = useState(false);
  const [modeSheet, setModeSheet] = useState(false);
  const [langSheet, setLangSheet] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      notificationsAllowed().then(setAllowed);
    }, []),
  );

  if (!profile) return <Screen />;
  const unit = profile.goal_type === 'pages' ? 'pages' : 'min';
  const onCount = [profile.notif_daily, profile.notif_streak, profile.notif_challenge].filter(Boolean).length;
  const lang = languages.find((l) => l.code === profile.translation_language)?.name ?? profile.translation_language;

  return (
    <Screen>
      <AppBar title="Settings" />
      <Body gap={10}>
        <Micro>Account</Micro>
        <GlassCard padding={{ vertical: 2, horizontal: 6 }} gap={0}>
          <Row icon="user" label="Edit profile" sub={`${profile.display_name} · ${session?.user.email ?? ''}`} last onPress={() => router.push('/settings/profile')} />
        </GlassCard>

        <Micro>Reading</Micro>
        <GlassCard padding={{ vertical: 2, horizontal: 6 }} gap={0}>
          <Row icon="target" label="Daily goal & reminder" value={`${profile.daily_goal} ${unit} · ${formatTime(profile.reminder_time)}`} onPress={() => router.push('/settings/goal')} />
          <Row icon="book-open" label="Default reading mode" value={profile.reading_mode === 'slide' ? 'Slide' : 'Scroll'} onPress={() => setModeSheet(true)} />
          <Row icon="languages" label="Translation language" value={lang} last onPress={() => setLangSheet(true)} />
        </GlassCard>

        <Micro>Notifications & about</Micro>
        <GlassCard padding={{ vertical: 2, horizontal: 6 }} gap={0}>
          <Row
            icon="bell"
            label="Notifications"
            value={allowed === false ? 'Off' : `${onCount} of 3 on`}
            sub={allowed === false ? 'Notifications are off' : undefined}
            onPress={() => router.push('/settings/notifications')}
          />
          <Row icon="info" label="About Readwell" value={`v${Constants.expoConfig?.version ?? '1.0.0'}`} right={null} last />
        </GlassCard>

        <GlassCard padding={{ vertical: 2, horizontal: 6 }} gap={0}>
          <Row icon="log-out" label="Log out" right={null} last onPress={() => setConfirm(true)} />
        </GlassCard>
      </Body>

      <Sheet visible={modeSheet} onClose={() => setModeSheet(false)} title="Default reading mode">
        <View accessibilityRole="radiogroup" style={{ gap: 12 }}>
          <ModeOption
            icon="book-open"
            title="Slide"
            body="Swipe to turn pages, like a paperback"
            on={profile.reading_mode === 'slide'}
            onPress={() => {
              update({ reading_mode: 'slide' });
              setModeSheet(false);
            }}
          />
          <ModeOption
            icon="scroll-text"
            title="Scroll"
            body="One continuous page, top to bottom"
            on={profile.reading_mode === 'scroll'}
            onPress={() => {
              update({ reading_mode: 'scroll' });
              setModeSheet(false);
            }}
          />
        </View>
      </Sheet>

      <LanguageSheet visible={langSheet} onClose={() => setLangSheet(false)} value={profile.translation_language} onChange={(translation_language) => update({ translation_language })} />

      <Dialog
        visible={confirm}
        icon="log-out"
        title="Log out of Readwell?"
        body="Your progress, notes and challenges are saved to your account. Book files are removed from this phone and download again when you log back in."
        ok="Log out"
        onCancel={() => setConfirm(false)}
        onOk={async () => {
          setConfirm(false);
          await supabase.auth.signOut();
        }}
      />
    </Screen>
  );
}
