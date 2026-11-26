// Challenge card from the designs (rw-f-notes-challenges.jsx ChCard) + Home mini card.
import { Pressable, Text, View } from 'react-native';
import { GlassCard } from '@/components/ds/GlassCard';
import { Chip } from '@/components/kit/Chip';
import { Cover } from '@/components/kit/Cover';
import { Prog } from '@/components/kit/Prog';
import { Tile } from '@/components/kit/Tile';
import { Meta } from '@/components/kit/Typography';
import { colors, font, gradients, linear } from '@/theme';
import { challengeTitle, dayMonth, daysLeft, unitOf, type ChallengeWithProgress } from './challenges';

export function statusLabel(c: ChallengeWithProgress) {
  if (c.status === 'completed') return `Completed ${c.completed_at ? dayMonth(c.completed_at.slice(0, 10)) : ''}`.trim();
  if (c.status === 'missed') return 'Missed';
  const d = daysLeft(c);
  return d === 1 ? 'Last day' : `${d} days left`;
}

export function ChallengeCard({ c, onPress }: { c: ChallengeWithProgress; onPress: () => void }) {
  const done = c.status === 'completed';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${challengeTitle(c)}. ${c.progress.value} of ${c.target}. ${statusLabel(c)}`} onPress={onPress}>
      <GlassCard padding={16} gap={10}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Chip>{c.period === 'week' ? 'Weekly' : 'Monthly'}</Chip>
          <View style={{ flex: 1 }} />
          <Meta c={c.status === 'missed' ? colors.danger : done ? colors.sage700 : colors.rwInk}>{statusLabel(c)}</Meta>
        </View>
        <Text style={[font(800, 17, 1.25), { color: colors.rwInk }]}>{challengeTitle(c)}</Text>
        <Prog pct={c.progress.pct} h={10} color={done ? linear(gradients.positive, 90) : undefined} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Meta c={colors.rwInk} style={{ flex: 1 }}>
            {c.progress.value} of {c.target} {unitOf(c.target_type, c.target)}
          </Meta>
          {c.progress.byBook.length ? (
            <View style={{ flexDirection: 'row' }}>
              {c.progress.byBook.slice(0, 3).map((b, i) => (
                <View key={b.bookId} style={{ marginLeft: i ? -8 : 0 }}>
                  <Cover book={{ title: b.title, cover_seed: b.coverSeed, local_cover: b.localCover }} w={22} r={3} />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </GlassCard>
    </Pressable>
  );
}

/** Home · active challenge summary (design ChallengeMini). */
export function ChallengeMini({ c, onPress }: { c: ChallengeWithProgress; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <GlassCard padding={14} gap={10}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Tile icon="trophy" size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[font(800, 15, 1.25), { color: colors.rwInk }]}>
              {challengeTitle(c)}
            </Text>
            <Meta>
              {c.progress.value} of {c.target} {unitOf(c.target_type, c.target)} · {statusLabel(c)}
            </Meta>
          </View>
          <Meta c={colors.rwInk}>{Math.round(c.progress.pct)}%</Meta>
        </View>
        <Prog pct={c.progress.pct} h={6} />
      </GlassCard>
    </Pressable>
  );
}
