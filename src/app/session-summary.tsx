// Screen 46 · Reading session summary.
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { Actions, Body } from '@/components/kit/Layout';
import { Ring } from '@/components/kit/Ring';
import { Screen } from '@/components/kit/Screen';
import { H, Micro } from '@/components/kit/Typography';
import { useProfile } from '@/features/profile/ProfileProvider';
import { JOURNEY_DAYS, useDailyStats } from '@/features/stats/stats';
import { colors, font, gradients, linear } from '@/theme';

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        borderRadius: 20,
        backgroundImage: linear(['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
      }}>
      <Text style={[font(800, 32, 1.1), { color: colors.textOnDark }]}>{v}</Text>
      <Text style={[font(600, 13, 1.3), { color: colors.textOnDarkMuted, marginTop: 6 }]}>{l}</Text>
    </View>
  );
}

export default function SessionSummary() {
  const params = useLocalSearchParams<{ bookId: string; title: string; seconds: string; pages: string; before: string }>();
  const { profile } = useProfile();
  const stats = useDailyStats();
  const minutes = Math.max(1, Math.round(Number(params.seconds ?? 0) / 60));
  const pages = Number(params.pages ?? 0);
  const before = Math.round(Number(params.before ?? 0));
  const pct = stats ? Math.round(stats.todayPct) : 0;
  const first = (profile?.display_name ?? '').trim().split(/\s+/)[0];
  const minutesGoal = profile?.goal_type !== 'pages';
  const done = stats ? (minutesGoal ? Math.floor(stats.today.seconds / 60) : stats.today.pages) : 0;
  const unit = minutesGoal ? 'minutes' : 'pages';

  return (
    <Screen bg={linear(gradients.dark)} dark>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 6 }}>
        <IconButton icon="x" label="Close" onPress={() => router.back()} />
      </View>
      <Body gap={18} style={{ alignItems: 'center' }}>
        <Micro c={colors.teal100}>Session complete · {params.title}</Micro>
        <H s={26} c={colors.textOnDark} style={{ textAlign: 'center' }}>
          Nice work{first ? `, ${first}` : ''}
        </H>
        <View style={{ flexDirection: 'row', gap: 12, alignSelf: 'stretch' }}>
          <Stat v={String(minutes)} l={minutes === 1 ? 'minute read' : 'minutes read'} />
          <Stat v={String(pages)} l={pages === 1 ? 'page read' : 'pages read'} />
        </View>
        <Ring pct={pct} size={150} stroke={14} color={colors.teal300} track="rgba(255,255,255,0.18)">
          <Text style={[font(800, 34, 1.1), { color: colors.textOnDark }]}>{pct}%</Text>
          <Text style={[font(600, 12, 1.3), { color: colors.textOnDarkMuted }]}>today&apos;s ratio</Text>
        </Ring>
        <Text style={[font(700, 14, 1.4), { color: colors.textOnDark, textAlign: 'center' }]}>
          {pct > before ? `Up from ${before}% · ` : ''}
          {done} of {profile?.daily_goal ?? 0} {unit}
        </Text>
        <Text style={[font(600, 13, 1.4), { color: colors.textOnDarkMuted, textAlign: 'center' }]}>
          {stats?.todayMet ? "Today's goal is done — that day counts toward your habit." : `${stats?.remaining ?? 0} more ${unit} to hit today's goal`}
        </Text>
        {stats ? (
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Icon name="flame" size={16} color={colors.textOnDark} />
              <Text style={[font(700, 13, 1.2), { color: colors.textOnDark }]}>
                {stats.currentStreak ? `${stats.currentStreak}-day streak` : 'Streak starts at 100%'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Icon name="sprout" size={16} color={colors.textOnDark} />
              <Text style={[font(700, 13, 1.2), { color: colors.textOnDark }]}>
                Day {stats.journeyDay} of {JOURNEY_DAYS}
              </Text>
            </View>
          </View>
        ) : null}
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={() => router.back()}>
          Done
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="ghost"
          color={colors.textOnDark}
          onPress={() => router.replace({ pathname: '/reader/[id]', params: { id: params.bookId } })}>
          Keep reading
        </Button>
      </Actions>
    </Screen>
  );
}
