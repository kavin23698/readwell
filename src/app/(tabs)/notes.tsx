// Screens 48 + 49 · Notes: all notes and highlights grouped by book (newest first), search, filter.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, Text, View } from 'react-native';
import { Icon } from '@/components/ds/Icon';
import { SearchField } from '@/components/ds/SearchField';
import { Chip } from '@/components/kit/Chip';
import { Cover } from '@/components/kit/Cover';
import { Empty } from '@/components/kit/Empty';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { PageTitle } from '@/components/kit/PageTitle';
import { Screen } from '@/components/kit/Screen';
import { Meta } from '@/components/kit/Typography';
import { NoteCard } from '@/features/notes/NoteCard';
import { matches, openItem, useAllNoteItems, type NoteFilter, type NoteItem } from '@/features/notes/useNotes';
import { colors, font } from '@/theme';

export default function Notes() {
  const items = useAllNoteItems();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<NoteFilter>('all');

  const sections = useMemo(() => {
    const shown = (items ?? []).filter((i) => matches(i, filter, query)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const byBook = new Map<string, { book: NoteItem; data: NoteItem[]; total: number }>();
    for (const i of shown) {
      const g = byBook.get(i.bookId) ?? { book: i, data: [], total: 0 };
      g.data.push(i);
      byBook.set(i.bookId, g);
    }
    for (const g of byBook.values()) g.total = (items ?? []).filter((i) => i.bookId === g.book.bookId).length;
    return [...byBook.values()];
  }, [items, query, filter]);

  if (items && items.length === 0) {
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

  return (
    <Screen noBottomInset>
      <PageTitle title="Notes" />
      <OfflineBanner />
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}>
        <SearchField placeholder="Search notes and highlights" value={query} onChangeText={setQuery} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip on={filter === 'all'} onPress={() => setFilter('all')}>
            All
          </Chip>
          <Chip on={filter === 'notes'} onPress={() => setFilter('notes')}>
            Notes
          </Chip>
          <Chip on={filter === 'highlights'} onPress={() => setFilter('highlights')}>
            Highlights
          </Chip>
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.key}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        ListEmptyComponent={items ? <Meta style={{ textAlign: 'center', marginTop: 30 }}>Nothing matches.</Meta> : undefined}
        renderSectionHeader={({ section }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${section.book.bookTitle}, ${section.total} items`}
            onPress={() => router.push({ pathname: '/book-notes/[id]', params: { id: section.book.bookId } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <Cover book={{ title: section.book.bookTitle, cover_seed: section.book.coverSeed, local_cover: section.book.localCover }} w={24} r={4} />
            <Text numberOfLines={1} style={[font(800, 15, 1.2), { flex: 1, color: colors.rwInk }]}>
              {section.book.bookTitle}
            </Text>
            <Meta>{section.total}</Meta>
            <Icon name="chevron-right" size={16} color={colors.slate800} />
          </Pressable>
        )}
        renderItem={({ item }) => <NoteCard item={item} onPress={() => openItem(item)} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
