// Screen 20 · Daily performance: today's ratio, sessions, last 7 days vs goal.
import { Text, View } from 'react-native';
import { BarChart } from '@/components/ds/BarChart';
import { GlassCard } from '@/components/ds/GlassCard';
import { Icon } from '@/components/ds/Icon';
import { AppBar } from '@/components/kit/AppBar';
import { Cover } from '@/components/kit/Cover';
import { Body } from '@/components/kit/Layout';
import { Ring } from '@/components/kit/Ring';
import { Screen } from '@/components/kit/Screen';
import { Meta } from '@/components/kit/Typography';
import { goalText } from '@/features/home/HomeCards';
import { useProfile } from '@/features/profile/ProfileProvider';
import { useDailyStats, useTodaySessions } from '@/features/stats/stats';
import { formatClock, formatLongDate, formatWeekday, localDate } from '@/lib/dates';
import { colors, font } from '@/theme';

export default function Performance() {
  const { profile } = useProfile();
  const stats = useDailyStats();
  const sessions = useTodaySessions() ?? [];
  if (!profile || !stats) return <Screen />;

  const pct = Math.round(stats.todayPct);
  const minutesGoal = profile.goal_type === 'minutes';
  const amount = minutesGoal ? stats.today.seconds / 60 : stats.today.pages;
  const unit = minutesGoal ? 'minutes' : 'pages';
  const today = localDate();
  // Most recent missed day this week (before today, after the first day read), with the design's reassurance.
  const firstRead = stats.last7.findIndex((d) => d.pct > 0);
  const missed =
    firstRead < 0
      ? undefined
      : [...stats.last7.slice(firstRead + 1)].reverse().find((d) => d.date !== today && d.pct < 100);
  const readBefore = !!missed;

  return (
    <Screen>
      <AppBar title="Daily performance" sub={formatLongDate()} />
      <Body gap={12}>
        <GlassCard padding={16}>
          <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
            <Ring pct={pct} size={108} stroke={12}>
              <Text style={[font(800, 26, 1.1), { color: colors.rwInk }]}>{pct}%</Text>
              <Meta>of goal</Meta>
            </Ring>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[font(800, 18, 1.2), { color: colors.rwInk }]}>{goalText(amount, profile)}</Text>
              <Meta>
                {minutesGoal
                  ? `${stats.today.pages} pages · ${stats.today.sessions} session${stats.today.sessions === 1 ? '' : 's'}`
                  : `${Math.round(stats.today.seconds / 60)} min · ${stats.today.sessions} session${stats.today.sessions === 1 ? '' : 's'}`}
              </Meta>
              <Meta c={colors.sage700}>
                {stats.todayMet ? 'Goal reached today — nicely done.' : `${stats.remaining} more ${unit} to hit 100%`}
              </Meta>
            </View>
          </View>
        </GlassCard>

        <GlassCard padding={14} title="Sessions">
          {sessions.length === 0 ? (
            <Meta>No reading yet today. Open a book to start — the timer runs while you read.</Meta>
          ) : (
            sessions.map((s) => (
              <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Cover book={{ title: s.title ?? 'Book', author: s.author, cover_seed: s.cover_seed ?? 0, local_cover: s.local_cover }} w={30} r={5} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[font(700, 14, 1.3), { color: colors.rwInk }]}>
                    {s.title ?? 'Deleted book'}
                  </Text>
                  <Meta>{formatClock(new Date(s.started_at))}</Meta>
                </View>
                <Meta c={colors.rwInk}>
                  {Math.max(1, Math.round(s.seconds / 60))} min · {s.pages} page{s.pages === 1 ? '' : 's'}
                </Meta>
              </View>
            ))
          )}
        </GlassCard>

        <GlassCard padding={14} title="Last 7 days">
          <BarChart
            data={stats.last7.map((d) => ({ label: formatWeekday(d.date), value: Math.min(120, d.pct) }))}
            max={120}
            ticks={[0, 60, 120]}
            unit="%"
            height={110}
            goal={100}
          />
        </GlassCard>

        {missed && readBefore ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingHorizontal: 4 }}>
            <Icon name="sprout" size={18} color={colors.sage700} />
            <Meta c={colors.rwInk} style={{ flex: 1 }}>
              You missed {formatWeekday(missed.date)}. Missing one day doesn&apos;t break a habit — just read today.
            </Meta>
          </View>
        ) : null}
      </Body>
    </Screen>
  );
}
