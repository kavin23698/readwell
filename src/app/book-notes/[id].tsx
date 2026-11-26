// Screen 50 · Book's notes & highlights, in reading order.
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { AppBar } from '@/components/kit/AppBar';
import { Empty } from '@/components/kit/Empty';
import { Screen } from '@/components/kit/Screen';
import { Seg } from '@/components/kit/Seg';
import { Meta } from '@/components/kit/Typography';
import { useBook } from '@/features/library/useLibrary';
import { NoteCard } from '@/features/notes/NoteCard';
import { matches, openItem, readingOrder, useBookNoteItems, type NoteFilter } from '@/features/notes/useNotes';

const NEW_MS = 10 * 60 * 1000;

export default function BookNotes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useBook(id);
  const items = useBookNoteItems(id);
  const [filter, setFilter] = useState<NoteFilter>('all');
  const shown = useMemo(() => (items ?? []).filter((i) => matches(i, filter, '')).sort(readingOrder), [items, filter]);
  const count = items?.length ?? 0;

  return (
    <Screen>
      <AppBar title="Notes & highlights" sub={book ? `${book.title} · ${count} ${count === 1 ? 'item' : 'items'}` : undefined} />
      {items && count === 0 ? (
        <Empty icon="notebook-pen" title="No notes yet" body="Long-press any passage while reading this book to highlight it or add a note." />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(i) => i.key}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
          ListHeaderComponent={
            <>
              <Seg<NoteFilter>
                sm
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'highlights', label: 'Highlights' },
                  { value: 'notes', label: 'Notes' },
                ]}
              />
              <Meta style={{ marginTop: 10 }}>In reading order</Meta>
            </>
          }
          renderItem={({ item }) => (
            <NoteCard item={item} showChapter isNew={Date.now() - new Date(item.updatedAt).getTime() < NEW_MS} onPress={() => openItem(item)} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
