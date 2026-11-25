// Screen 24 · Library — empty. Import and the book grid arrive with the Library feature.
import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { Empty } from '@/components/kit/Empty';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { PageTitle } from '@/components/kit/PageTitle';
import { Screen } from '@/components/kit/Screen';
import { Meta } from '@/components/kit/Typography';

export default function Library() {
  return (
    <Screen noBottomInset>
      <PageTitle title="Library" right={<IconButton icon="plus" variant="accent" label="Import book" />} />
      <OfflineBanner />
      <Empty icon="library" title="Your shelf is empty" body="Import the e-books and documents already saved on your phone.">
        <Button icon="upload">Import book</Button>
        <Meta>EPUB · PDF · TXT</Meta>
      </Empty>
    </Screen>
  );
}
