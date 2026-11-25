// Temporary signed-in screen — replaced by Home (screens 17–19) in the next feature.
// Includes a small sync test card for checking offline changes.
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { Actions, Body } from '@/components/kit/Layout';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, Meta, P } from '@/components/kit/Typography';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile } from '@/features/profile/ProfileProvider';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/sync/SyncProvider';
import { colors, font } from '@/theme';

export default function SignedIn() {
  const { session } = useAuth();
  const { profile, update } = useProfile();
  const { online, syncing, pending } = useSync();
  const unit = profile?.goal_type === 'pages' ? 'pages' : 'min';

  return (
    <Screen>
      <View style={{ height: 8 }} />
      <OfflineBanner />
      <Body style={{ justifyContent: 'center', gap: 16 }}>
        <Tile icon="circle-check" size={96} />
        <H s={26}>You&apos;re signed in{profile?.display_name ? `, ${profile.display_name}` : ''}</H>
        <GlassCard padding={16} gap={6}>
          <Meta>Account</Meta>
          <P>{session?.user.email}</P>
        </GlassCard>
        <GlassCard padding={16} gap={10} title="Sync test">
          <Text style={[font(800, 28, 1.1), { color: colors.rwInk }]}>
            Daily goal: {profile?.daily_goal ?? '–'} {unit}
          </Text>
          <Meta>
            {online ? 'Online' : 'Offline'} ·{' '}
            {syncing ? 'syncing…' : pending ? `${pending} change${pending === 1 ? '' : 's'} waiting to sync` : 'all changes synced'}
          </Meta>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button variant="secondary" icon="minus" onPress={() => profile && update({ daily_goal: Math.max(5, profile.daily_goal - 5) })}>
              5
            </Button>
            <Button icon="plus" onPress={() => profile && update({ daily_goal: Math.min(240, profile.daily_goal + 5) })}>
              5
            </Button>
          </View>
        </GlassCard>
      </Body>
      <Actions>
        <Button fullWidth size="lg" variant="secondary" icon="log-out" onPress={() => supabase.auth.signOut()}>
          Log out
        </Button>
      </Actions>
    </Screen>
  );
}
