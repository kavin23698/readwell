// Reader entry: makes sure the book file is on this phone (downloading it with progress on a new
// device), then opens it. The reading view itself arrives with the Reader feature.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { AppBar } from '@/components/kit/AppBar';
import { Empty } from '@/components/kit/Empty';
import { Prog } from '@/components/kit/Prog';
import { Screen } from '@/components/kit/Screen';
import { Meta, P } from '@/components/kit/Typography';
import { nowIso, patch } from '@/db';
import { deleteBook } from '@/features/library/bookActions';
import { ensureLocalFile, NotUploadedError } from '@/features/library/uploader';
import { useBook } from '@/features/library/useLibrary';

type Phase = { kind: 'loading'; fraction: number | null } | { kind: 'ready' } | { kind: 'error'; offline: boolean; notUploaded: boolean };

export default function ReaderEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useBook(id);
  const [phase, setPhase] = useState<Phase>({ kind: 'loading', fraction: null });
  const [attempt, setAttempt] = useState(0);
  const bookId = book?.id;

  useEffect(() => {
    if (!book) return;
    let cancelled = false;
    setPhase({ kind: 'loading', fraction: null });
    ensureLocalFile(book, (f) => !cancelled && setPhase({ kind: 'loading', fraction: f }))
      .then(async () => {
        if (cancelled) return;
        await patch('books', book.id, { last_opened_at: nowIso() });
        setPhase({ kind: 'ready' });
      })
      .catch((e) => {
        if (cancelled) return;
        setPhase({ kind: 'error', offline: e instanceof Error && e.message === 'offline', notUploaded: e instanceof NotUploadedError });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, attempt]);

  if (!book) return <Screen />;

  if (phase.kind === 'loading') {
    return (
      <Screen>
        <AppBar title={book.title} />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30, gap: 12 }}>
          <P style={{ textAlign: 'center' }}>{phase.fraction == null ? 'Opening…' : 'Downloading your book…'}</P>
          {phase.fraction != null ? (
            <>
              <Prog pct={phase.fraction * 100} h={8} />
              <Meta style={{ textAlign: 'center' }}>{Math.round(phase.fraction * 100)}%</Meta>
            </>
          ) : null}
        </View>
      </Screen>
    );
  }

  // 47 · Book failed to open
  if (phase.kind === 'error') {
    return (
      <Screen>
        <AppBar title={book.title} />
        <Empty
          icon="file-x"
          title={phase.offline ? 'Connect to download this book' : "This book couldn't be opened"}
          body={
            phase.offline
              ? 'This book is in your account but not on this phone yet. Connect to the internet once to download it. Your position and notes are safe.'
              : phase.notUploaded
                ? "The file hasn't reached the cloud yet from the phone you imported it on. Open Readwell there while online, then try again. Your position and notes are safe."
                : 'The file may have been moved, renamed or deleted — or it’s damaged. Your position and notes are safe.'
          }>
          <Button fullWidth size="lg" icon="refresh-cw" onPress={() => setAttempt((a) => a + 1)}>
            Try again
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onPress={async () => {
              await deleteBook(book);
              router.replace('/library');
            }}>
            Remove from Library
          </Button>
        </Empty>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppBar title={book.title} />
      <Empty icon="book-open" title="Ready to read" body="The book is on this phone. The reading view arrives with the next feature (Reader)." />
    </Screen>
  );
}
