// Screen 57 · Challenge created.
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { AppBar } from '@/components/kit/AppBar';
import { Actions, Body } from '@/components/kit/Layout';
import { Row } from '@/components/kit/Row';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, P } from '@/components/kit/Typography';
import { one, useLiveQuery } from '@/db';
import { challengeTitle, rangeLabel } from '@/features/challenges/challenges';
import { illustrations } from '@/illustrations';

export default function ChallengeCreated() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useLiveQuery(['challenges'], () => one('challenges', id), [id]);
  const toList = () => router.replace('/challenges');

  return (
    <Screen>
      <AppBar close onBack={toList} />
      <Body gap={14} style={{ alignItems: 'center', paddingTop: 16 }}>
        <Tile img={illustrations.crown} icon="trophy" size={110} round />
        <H s={26} style={{ marginTop: 8, textAlign: 'center' }}>
          Challenge started
        </H>
        <P style={{ textAlign: 'center' }}>We&apos;ll update your progress after every reading session.</P>
        {c ? (
          <GlassCard padding={{ vertical: 4, horizontal: 8 }} gap={0} style={{ alignSelf: 'stretch' }}>
            <Row icon="target" label={challengeTitle(c)} right={null} />
            <Row icon="calendar-range" label={rangeLabel(c)} right={null} last />
          </GlassCard>
        ) : null}
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={() => router.replace({ pathname: '/challenge/[id]', params: { id } })}>
          View challenge
        </Button>
        <Button fullWidth size="lg" variant="secondary" onPress={toList}>
          Back to Challenges
        </Button>
      </Actions>
    </Screen>
  );
}
