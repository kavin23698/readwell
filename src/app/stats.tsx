// Screen 62 · Detailed stats: weekly / monthly reading time and pages vs the previous period,
// minutes per day (or week), last 7 days' goal ratio, books finished per month.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { BarChart } from '@/components/ds/BarChart';
import { GlassCard } from '@/components/ds/GlassCard';
import { StatCard } from '@/components/ds/StatCard';
import { AppBar } from '@/components/kit/AppBar';
import { Cover } from '@/components/kit/Cover';
import { Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Seg } from '@/components/kit/Seg';
import { Meta } from '@/components/kit/Typography';
import { formatDuration, usePeriodStats } from '@/features/stats/lifetime';
import { useDailyStats } from '@/features/stats/stats';
import { formatWeekday } from '@/lib/dates';
import { colors, font } from '@/theme';

function niceMax(v: number) {
  if (v <= 15) return 15;
  const step = v <= 60 ? 15 : v <= 240 ? 60 : 120;
  return Math.ceil(v / step) * step;
}

function delta(cur: number, prev: number, fmt: (n: number) => string, period: string) {
  const d = cur - prev;
  if (!prev && !cur) return undefined;
  return `${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))} vs last ${period}`;
}

export default function Stats() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const s = usePeriodStats(period);
  const daily = useDailyStats();
  const max = niceMax(Math.max(...(s?.bars ?? []).map((b) => b.value), 1));
  const word = period === 'week' ? 'week' : 'month';

  return (
    <Screen>
      <AppBar title="Your stats" />
      <Body gap={12}>
        <Seg
          sm
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: 'Weekly' },
            { value: 'month', label: 'Monthly' },
          ]}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard icon="clock-3" label="Reading time" value={formatDuration(s?.seconds ?? 0)} delta={s ? delta(s.seconds, s.prevSeconds, (n) => formatDuration(n), word) : undefined} tone="teal" />
          <StatCard icon="file-text" label="Pages read" value={String(s?.pages ?? 0)} delta={s ? delta(s.pages, s.prevPages, (n) => String(n), word) : undefined} tone="mist" />
        </View>
        <GlassCard padding={14} title={period === 'week' ? 'Minutes per day' : 'Minutes per week'}>
          <BarChart data={s?.bars ?? []} max={max} ticks={[0, max / 3, (2 * max) / 3, max].map(Math.round)} unit="m" height={90} />
        </GlassCard>
        <GlassCard padding={14} title="Daily goal · last 7 days">
          <BarChart
            data={(daily?.last7 ?? []).map((d) => ({ label: formatWeekday(d.date), value: Math.min(120, d.pct) }))}
            max={120}
            ticks={[0, 60, 120]}
            unit="%"
            height={90}
            goal={100}
          />
          <Meta>
            Week average: {daily ? Math.round(daily.last7.reduce((a, d) => a + Math.min(100, d.pct), 0) / 7) : 0}% of your daily goal
          </Meta>
        </GlassCard>
        <GlassCard padding={14} title="Books finished per month">
          <View style={{ gap: 12 }}>
            {(s?.finishedByMonth ?? []).map((m) => (
              <View key={m.month} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={[font(700, 13, 1.2), { width: 36, color: colors.rwInk }]}>{m.month}</Text>
                {m.books.length ? (
                  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                    {m.books.map((b) => (
                      <Cover key={b.id} book={b} w={30} r={4} />
                    ))}
                  </View>
                ) : (
                  <Meta>—</Meta>
                )}
              </View>
            ))}
          </View>
        </GlassCard>
      </Body>
    </Screen>
  );
}
