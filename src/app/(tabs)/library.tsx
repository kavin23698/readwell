// Screens 24 + 25 · Library (empty / with books): search, Reading · Finished · All, grid or list.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { SearchField } from '@/components/ds/SearchField';
import { Chip } from '@/components/kit/Chip';
import { Cover } from '@/components/kit/Cover';
import { Empty } from '@/components/kit/Empty';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { PageTitle } from '@/components/kit/PageTitle';
import { Prog } from '@/components/kit/Prog';
import { Screen } from '@/components/kit/Screen';
import { Meta } from '@/components/kit/Typography';
import { SyncBadge } from '@/features/library/SyncBadge';
import { startImportFlow } from '@/features/library/startImportFlow';
import { useLibraryBooks, type LibraryBook } from '@/features/library/useLibrary';
import { colors, font, gradients, linear, shadow } from '@/theme';

type Filter = 'reading' | 'finished' | 'all';
const isFinished = (b: LibraryBook) => !!b.finished_at || (b.percent ?? 0) >= 98;

function progressLabel(b: LibraryBook) {
  if (isFinished(b)) return 'Finished';
  const pct = Math.round(b.percent ?? 0);
  if (!b.last_opened_at) return 'Not started';
  return b.page ? `p. ${b.page} · ${pct}%` : `${pct}%`;
}

function GridItem({ b, width }: { b: LibraryBook; width: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${b.title}${b.author ? ` by ${b.author}` : ''}, ${progressLabel(b)}`}
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}
      style={{ width, gap: 6 }}>
      <Cover book={b} w={width} h={Math.round(width * 1.42)} />
      <Text numberOfLines={2} style={[font(800, 12, 1.25), { color: colors.rwInk, height: 30 }]}>
        {b.title}
      </Text>
      <Prog pct={isFinished(b) ? 100 : (b.percent ?? 0)} h={4} />
      <Meta style={{ fontSize: 11 }}>{progressLabel(b)}</Meta>
      <SyncBadge book={b} compact />
    </Pressable>
  );
}

function ListItem({ b }: { b: LibraryBook }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}
      style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)' }}>
      <Cover book={b} w={44} r={6} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text numberOfLines={1} style={[font(800, 14, 1.3), { color: colors.rwInk }]}>
          {b.title}
        </Text>
        {b.author ? <Meta numberOfLines={1}>{b.author}</Meta> : null}
        <Prog pct={isFinished(b) ? 100 : (b.percent ?? 0)} h={4} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Meta style={{ fontSize: 11 }}>{progressLabel(b)}</Meta>
          <SyncBadge book={b} compact />
        </View>
      </View>
    </Pressable>
  );
}

function ViewToggle({ grid, onChange }: { grid: boolean; onChange: (g: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, padding: 3, borderRadius: 12, backgroundColor: 'rgba(20,36,52,0.12)', boxShadow: shadow.inset }}>
      {(['layout-grid', 'list'] as const).map((ic, i) => {
        const on = (i === 0) === grid;
        return (
          <Pressable
            key={ic}
            accessibilityRole="button"
            accessibilityLabel={i === 0 ? 'Grid view' : 'List view'}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(i === 0)}
            style={{
              width: 34,
              height: 30,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: on ? linear(gradients.segActive) : undefined,
              boxShadow: on ? shadow.raised : undefined,
            }}>
            <Icon name={ic} size={16} color={colors.navy800} />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Library() {
  const books = useLibraryBooks();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [grid, setGrid] = useState(true);
  const [width, setWidth] = useState(0);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (books ?? []).filter((b) => {
      if (filter === 'reading' && isFinished(b)) return false;
      if (filter === 'finished' && !isFinished(b)) return false;
      return !q || b.title.toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q);
    });
  }, [books, query, filter]);

  const addButton = <IconButton icon="plus" variant="accent" label="Import book" onPress={startImportFlow} />;

  if (books && books.length === 0) {
    return (
      <Screen noBottomInset>
        <PageTitle title="Library" right={addButton} />
        <OfflineBanner />
        <Empty icon="library" title="Your shelf is empty" body="Import the e-books and documents already saved on your phone.">
          <Button icon="upload" onPress={startImportFlow}>
            Import book
          </Button>
          <Meta>EPUB · PDF · TXT</Meta>
        </Empty>
      </Screen>
    );
  }

  const cols = 3;
  const gap = 12;
  const itemW = width ? Math.floor((width - gap * (cols - 1)) / cols) : 0;

  return (
    <Screen noBottomInset>
      <PageTitle title="Library" right={addButton} />
      <OfflineBanner />
      <View style={{ paddingHorizontal: 20, gap: 12, marginBottom: 14 }}>
        <SearchField placeholder="Search title or author" value={query} onChangeText={setQuery} />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Chip on={filter === 'reading'} onPress={() => setFilter('reading')}>
            Reading
          </Chip>
          <Chip on={filter === 'finished'} onPress={() => setFilter('finished')}>
            Finished
          </Chip>
          <Chip on={filter === 'all'} onPress={() => setFilter('all')}>
            All
          </Chip>
          <View style={{ flex: 1 }} />
          <ViewToggle grid={grid} onChange={setGrid} />
        </View>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 20 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {shown.length === 0 && books ? (
          <Meta style={{ textAlign: 'center', marginTop: 30 }}>No books match.</Meta>
        ) : grid ? (
          itemW > 0 ? (
            <FlatList
              key="grid"
              data={shown}
              keyExtractor={(b) => b.id}
              numColumns={cols}
              columnWrapperStyle={{ gap }}
              contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
              renderItem={({ item }) => <GridItem b={item} width={itemW} />}
              showsVerticalScrollIndicator={false}
            />
          ) : null
        ) : (
          <FlatList
            key="list"
            data={shown}
            keyExtractor={(b) => b.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => <ListItem b={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
