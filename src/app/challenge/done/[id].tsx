// Screen 59 · Challenge completed (celebration). Shown once per completed challenge.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, Micro } from '@/components/kit/Typography';
import { challengeTitle, markCelebrated, unitOf, useChallenges } from '@/features/challenges/challenges';
import { useProfile } from '@/features/profile/ProfileProvider';
import { illustrations } from '@/illustrations';
import { daysBetween, localDate, parseLocalDate } from '@/lib/dates';
import { colors, font, gradients, linear } from '@/theme';

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 18,
        backgroundImage: linear(['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
      }}>
      <Text style={[font(800, 24, 1.1), { color: colors.textOnDark }]}>{v}</Text>
      <Text style={[font(600, 12, 1.3), { color: colors.textOnDarkMuted, marginTop: 4 }]}>{l}</Text>
    </View>
  );
}

const fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export default function ChallengeDone() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const list = useChallenges(profile ? { goal_type: profile.goal_type, daily_goal: profile.daily_goal } : null);
  const c = list?.find((x) => x.id === id);

  useEffect(() => {
    if (id) markCelebrated(id);
  }, [id]);

  if (!c) return <Screen bg={linear(gradients.dark)} dark />;

  const finishedOn = c.completed_at ? localDate(new Date(c.completed_at)) : localDate();
  const early = daysBetween(finishedOn, c.ends_on);
  const when = fmt.format(parseLocalDate(finishedOn));
  const headline =
    c.target_type === 'pages'
      ? `${c.target} pages. Done!`
      : c.target_type === 'minutes'
        ? `${c.target} minutes. Done!`
        : c.target_type === 'books'
          ? `${c.target} ${unitOf('books', c.target)}. Done!`
          : `${c.target} goal days. Done!`;

  return (
    <Screen bg={linear(gradients.dark)} dark>
      <Body gap={16} style={{ alignItems: 'center', paddingTop: 46 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="sparkles" size={22} color={colors.teal200} />
          <Tile img={illustrations.crown} icon="trophy" size={132} round dark />
          <Icon name="sparkles" size={22} color={colors.teal200} />
        </View>
        <Micro c={colors.teal100}>{c.period === 'week' ? 'Weekly' : 'Monthly'} challenge complete</Micro>
        <H s={30} c={colors.textOnDark} style={{ textAlign: 'center' }}>
          {headline}
        </H>
        <Text style={[font(500, 15, 1.5), { color: colors.slate50, textAlign: 'center' }]}>
          {early > 0 ? `You finished ${early === 1 ? 'a day' : `${early} days`} early — ${when}.` : `You finished on ${when}.`}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
          <Stat v={String(c.progress.value)} l={unitOf(c.target_type, c.progress.value)} />
          <Stat v={String(c.progress.daysRead)} l={c.progress.daysRead === 1 ? 'day' : 'days'} />
          <Stat v={String(c.progress.booksRead)} l={c.progress.booksRead === 1 ? 'book' : 'books'} />
        </View>
        <Text style={[font(600, 13, 1.4), { color: colors.textOnDarkMuted, textAlign: 'center' }]}>{challengeTitle(c)}</Text>
      </Body>
      <Actions>
        <Button fullWidth size="lg" icon="plus" onPress={() => router.replace('/challenge/new')}>
          Create next challenge
        </Button>
        <Button fullWidth size="lg" variant="ghost" color={colors.textOnDark} onPress={() => router.back()}>
          Done
        </Button>
      </Actions>
    </Screen>
  );
}
