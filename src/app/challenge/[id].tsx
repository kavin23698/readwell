// Screens 58 + 60 · Challenge detail and delete (abandon) — confirm.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BarChart } from '@/components/ds/BarChart';
import { GlassCard } from '@/components/ds/GlassCard';
import { AppBar } from '@/components/kit/AppBar';
import { Chip } from '@/components/kit/Chip';
import { Cover } from '@/components/kit/Cover';
import { Dialog } from '@/components/kit/Dialog';
import { Body } from '@/components/kit/Layout';
import { Prog } from '@/components/kit/Prog';
import { Screen } from '@/components/kit/Screen';
import { Meta } from '@/components/kit/Typography';
import { statusLabel } from '@/features/challenges/ChallengeCard';
import { challengeTitle, daysLeft, deleteChallenge, rangeLabel, unitOf, useChallenges } from '@/features/challenges/challenges';
import { useProfile } from '@/features/profile/ProfileProvider';
import { colors, font, gradients, linear } from '@/theme';

function niceMax(v: number) {
  if (v <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / step) * step;
}

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const list = useChallenges(profile ? { goal_type: profile.goal_type, daily_goal: profile.daily_goal } : null);
  const c = list?.find((x) => x.id === id);
  const [confirm, setConfirm] = useState(false);

  if (!list) return <Screen />;
  if (!c) {
    return (
      <Screen>
        <AppBar title="Challenge" />
        <Body style={{ justifyContent: 'center' }}>
          <Meta style={{ textAlign: 'center' }}>This challenge was deleted.</Meta>
        </Body>
      </Screen>
    );
  }

  const unit = unitOf(c.target_type, c.target);
  const left = Math.max(0, c.target - c.progress.value);
  const days = daysLeft(c);
  const perDay = c.status === 'active' && left > 0 && days > 0 ? Math.ceil(left / days) : 0;
  const max = niceMax(Math.max(...c.progress.breakdown.map((b) => b.value), 1));
  const done = c.status === 'completed';

  return (
    <Screen>
      <AppBar title={c.period === 'week' ? 'Weekly challenge' : 'Monthly challenge'} sub={rangeLabel(c)} />
      <Body gap={12}>
        <GlassCard padding={16} gap={10}>
          <Text style={[font(800, 18, 1.25), { color: colors.rwInk }]}>{challengeTitle(c)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={[font(800, 40, 1.1), { color: colors.rwInk }]}>{c.progress.value}</Text>
            <Text style={[font(700, 15, 1.1), { color: colors.rwSec }]}>
              / {c.target} {unit}
            </Text>
            <View style={{ flex: 1 }} />
            <Chip>{statusLabel(c)}</Chip>
          </View>
          <Prog pct={c.progress.pct} h={12} color={done ? linear(gradients.positive, 90) : undefined} />
          <Meta c={colors.rwInk}>
            {done
              ? 'Target reached — nicely done.'
              : c.status === 'missed'
                ? `Ended at ${Math.round(c.progress.pct)}%. Your reading still counts toward your stats.`
                : `${Math.round(c.progress.pct)}% · ${left} ${unitOf(c.target_type, left)} to go${perDay ? ` — about ${perDay} a day` : ''}`}
          </Meta>
        </GlassCard>

        <GlassCard padding={14} title={c.period === 'week' ? 'Daily breakdown' : 'Weekly breakdown'}>
          <BarChart data={c.progress.breakdown} max={max} ticks={[0, max / 2, max]} unit="" height={90} />
        </GlassCard>

        {c.progress.byBook.length && c.target_type !== 'goal_days' && c.target_type !== 'books' ? (
          <GlassCard padding={{ vertical: 4, horizontal: 8 }} gap={0}>
            {c.progress.byBook.map((b, i) => (
              <View
                key={b.bookId}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: i === c.progress.byBook.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.3)' }}>
                <Cover book={{ title: b.title, cover_seed: b.coverSeed, local_cover: b.localCover }} w={30} r={5} />
                <Text numberOfLines={1} style={[font(700, 14, 1.2), { flex: 1, color: colors.rwInk }]}>
                  {b.title}
                </Text>
                <Meta c={colors.rwInk}>
                  {b.amount} {c.target_type === 'minutes' ? 'min' : unitOf('pages', b.amount)}
                </Meta>
              </View>
            ))}
          </GlassCard>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => setConfirm(true)} style={{ alignSelf: 'center', padding: 10 }}>
          <Text style={[font(700, 14, 1.2), { color: colors.danger }]}>{c.status === 'active' ? 'Abandon challenge' : 'Delete challenge'}</Text>
        </Pressable>
      </Body>
      <Dialog
        visible={confirm}
        danger
        icon="flag"
        title={c.status === 'active' ? 'Abandon this challenge?' : 'Delete this challenge?'}
        body={`You've done ${c.progress.value} of ${c.target} ${unit}. Your reading still counts toward your stats — only the challenge is removed.`}
        cancel={c.status === 'active' ? 'Keep going' : 'Cancel'}
        ok={c.status === 'active' ? 'Abandon' : 'Delete'}
        onCancel={() => setConfirm(false)}
        onOk={async () => {
          await deleteChallenge(c.id);
          setConfirm(false);
          router.back();
        }}
      />
    </Screen>
  );
}
