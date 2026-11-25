// Screen 49 · Notes — empty. The notes list arrives with the Notes feature.
import { Empty } from '@/components/kit/Empty';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { PageTitle } from '@/components/kit/PageTitle';
import { Screen } from '@/components/kit/Screen';

export default function Notes() {
  return (
    <Screen noBottomInset>
      <PageTitle title="Notes" />
      <OfflineBanner />
      <Empty
        icon="notebook-pen"
        title="No notes yet"
        body="Long-press any passage while reading to highlight it or add a note. Everything you save shows up here."
      />
    </Screen>
  );
}
