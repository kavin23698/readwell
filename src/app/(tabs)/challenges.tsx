// Screen 53 · Challenges — empty. Creating challenges arrives with the Challenges feature.
import { Button } from '@/components/ds/Button';
import { Empty } from '@/components/kit/Empty';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { PageTitle } from '@/components/kit/PageTitle';
import { Screen } from '@/components/kit/Screen';
import { illustrations } from '@/illustrations';

export default function Challenges() {
  return (
    <Screen noBottomInset>
      <PageTitle title="Challenges" />
      <OfflineBanner />
      <Empty
        img={illustrations.crown}
        icon="trophy"
        title="No challenges yet"
        body="Set a weekly or monthly target. Readwell tracks it automatically from your reading sessions.">
        <Button icon="plus">Create challenge</Button>
      </Empty>
    </Screen>
  );
}
