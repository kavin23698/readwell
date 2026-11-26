// Screen 61 · Profile: name, journey (Day N of 254), streaks, lifetime stats, Want to read.
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { Initials } from '@/components/kit/Initials';
import { Body } from '@/components/kit/Layout';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { PageTitle } from '@/components/kit/PageTitle';
import { Prog } from '@/components/kit/Prog';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { Meta } from '@/components/kit/Typography';
import { useProfile } from '@/features/profile/ProfileProvider';
import { formatDuration, useLifetime } from '@/features/stats/lifetime';
import { JOURNEY_DAYS, useDailyStats } from '@/features/stats/stats';
import { useWantToRead } from '@/features/wantToRead/wantToRead';
import { colors, font } from '@/theme';

const since = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Profile() {
  const { profile } = useProfile();
  const goal = profile ? { goal_type: profile.goal_type, daily_goal: profile.daily_goal } : null;
  const stats = useDailyStats();
  const life = useLifetime(goal);
  const want = useWantToRead();
  const wantActive = (want ?? []).filter((w) => !w.added_to_library);
  const day = stats?.journeyDay ?? 1;

  return (
    <Screen noBottomInset>
      <PageTitle title="Profile" right={<IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />} />
      <OfflineBanner />
      <Body gap={12}>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => router.push('/settings/profile')} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Initials name={profile?.display_name} size={60} />
          <View style={{ flex: 1 }}>
            <Text style={[font(800, 20, 1.2), { color: colors.rwInk }]}>{profile?.display_name || 'Reader'}</Text>
            {profile ? <Meta>Reading since {since.format(new Date(profile.created_at))}</Meta> : null}
          </View>
        </Pressable>

        <GlassCard padding={14} gap={10}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="sprout" size={18} color={colors.sage700} />
            <Text style={[font(800, 15, 1.2), { flex: 1, color: colors.rwInk }]}>
              Day {day} of {JOURNEY_DAYS}
            </Text>
            <Meta>{Math.round((day / JOURNEY_DAYS) * 100)}%</Meta>
          </View>
          <Prog pct={(day / JOURNEY_DAYS) * 100} h={8} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(
              [
                ['flame', `${stats?.currentStreak ?? 0} ${stats?.currentStreak === 1 ? 'day' : 'days'}`, 'Current streak'],
                ['medal', `${stats?.longestStreak ?? 0} ${stats?.longestStreak === 1 ? 'day' : 'days'}`, 'Longest streak'],
              ] as const
            ).map(([ic, v, l]) => (
              <View key={l} style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)' }}>
                <Icon name={ic} size={18} color={colors.peri700} />
                <View>
                  <Text style={[font(800, 14, 1.2), { color: colors.rwInk }]}>{v}</Text>
                  <Meta style={{ fontSize: 11 }}>{l}</Meta>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard
          padding={14}
          title="Lifetime"
          action={
            <Button variant="secondary" size="sm" onPress={() => router.push('/stats')}>
              See all stats
            </Button>
          }>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
            {[
              [String(life?.booksFinished ?? 0), 'Books finished'],
              [(life?.pages ?? 0).toLocaleString('en-IN'), 'Pages read'],
              [formatDuration(life?.seconds ?? 0), 'Reading time'],
              [`${life?.avgRatio ?? 0}%`, 'Avg daily ratio'],
              [String(life?.highlights ?? 0), 'Highlights'],
              [String(life?.notes ?? 0), 'Notes'],
            ].map(([v, l]) => (
              <View key={l} style={{ width: '33.33%' }}>
                <Text style={[font(800, 17, 1.2), { color: colors.rwInk }]}>{v}</Text>
                <Meta style={{ fontSize: 11 }}>{l}</Meta>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard
          padding={{ vertical: 12, horizontal: 12 }}
          title={`Want to read · ${wantActive.length}`}
          action={
            <Button variant="secondary" size="sm" onPress={() => router.push('/want-to-read')}>
              {wantActive.length ? 'See all' : 'Add'}
            </Button>
          }>
          {wantActive[0] ? (
            <Pressable onPress={() => router.push('/want-to-read')} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Tile icon="bookmark" size={40} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[font(800, 15, 1.25), { color: colors.rwInk }]}>
                  {wantActive[0].title}
                </Text>
                {wantActive[0].author ? <Meta>{wantActive[0].author}</Meta> : null}
              </View>
              <Icon name="chevron-right" size={18} color={colors.slate800} />
            </Pressable>
          ) : (
            <Meta>Save books you hear about so you remember to find them later.</Meta>
          )}
        </GlassCard>
      </Body>
    </Screen>
  );
}
