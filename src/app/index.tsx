// Screen 2 · Welcome
import { View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Chip } from '@/components/kit/Chip';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, P } from '@/components/kit/Typography';
import { illustrations } from '@/illustrations';

export default function Welcome() {
  return (
    <Screen>
      <Body gap={16} style={{ paddingTop: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 6 }}>
          <Tile img={illustrations.plant} icon="sprout" size={196} round />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Chip icon="sprout">Your 254-day reading journey</Chip>
        </View>
        <H s={30} style={{ textAlign: 'center' }}>
          Read a little every day. Keep it for life.
        </H>
        <P s={15} style={{ textAlign: 'center' }}>
          Readwell turns the books already on your phone into a daily habit — one that sticks.
        </P>
      </Body>
      <Actions style={{ paddingTop: 18, paddingBottom: 18 }}>
        <Button fullWidth size="lg">
          Get started
        </Button>
        <Button fullWidth size="lg" variant="secondary">
          I already have an account
        </Button>
      </Actions>
    </Screen>
  );
}
