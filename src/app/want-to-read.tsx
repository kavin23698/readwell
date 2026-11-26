// Screens 63, 64, 66 · Want to read: list (reorder, mark added, import), empty state, remove confirm.
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { AppBar } from '@/components/kit/AppBar';
import { Dialog } from '@/components/kit/Dialog';
import { Empty } from '@/components/kit/Empty';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { Meta } from '@/components/kit/Typography';
import type { WantRow } from '@/db/schema';
import { startImportFlow } from '@/features/library/startImportFlow';
import { moveWant, removeWant, setAdded, useWantToRead } from '@/features/wantToRead/wantToRead';
import { colors, font } from '@/theme';

export default function WantToRead() {
  const list = useWantToRead();
  const [reorder, setReorder] = useState(false);
  const [removing, setRemoving] = useState<WantRow | null>(null);
  const active = (list ?? []).filter((w) => !w.added_to_library);
  const add = () => router.push('/want-to-read/add');

  if (list && list.length === 0) {
    return (
      <Screen>
        <AppBar title="Want to read" />
        <Empty icon="bookmark-plus" title="Nothing on your list" body="Heard about a good book? Save it here so you remember to find the file later.">
          <Button icon="plus" onPress={add}>
            Add a book
          </Button>
        </Empty>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppBar
        title="Want to read"
        sub={`${active.length} ${active.length === 1 ? 'book' : 'books'}`}
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {active.length > 1 ? (
              <IconButton icon={reorder ? 'check' : 'list'} label={reorder ? 'Done reordering' : 'Reorder'} onPress={() => setReorder((r) => !r)} />
            ) : null}
            <IconButton icon="plus" variant="accent" label="Add a book" onPress={add} />
          </View>
        }
      />
      <FlatList
        data={list ?? []}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const added = item.added_to_library;
          const ai = active.findIndex((x) => x.id === item.id);
          return (
            <GlassCard padding={{ vertical: 12, horizontal: 12 }} gap={8} style={added ? { opacity: 0.7 } : undefined}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <Tile icon={added ? 'circle-check' : 'bookmark'} size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[font(800, 15, 1.25), { color: colors.rwInk }]}>{item.title}</Text>
                  {item.author ? <Meta>{item.author}</Meta> : null}
                  {item.note ? <Text style={[font(600, 13, 1.4), { fontStyle: 'italic', color: colors.rwBody, marginTop: 4 }]}>“{item.note}”</Text> : null}
                </View>
                {reorder && !added ? (
                  <View style={{ gap: 6 }}>
                    <IconButton icon="chevron-left" size={36} label="Move up" style={{ transform: [{ rotate: '90deg' }], opacity: ai === 0 ? 0.4 : 1 }} onPress={() => list && moveWant(list, item.id, -1)} />
                    <IconButton icon="chevron-left" size={36} label="Move down" style={{ transform: [{ rotate: '-90deg' }], opacity: ai === active.length - 1 ? 0.4 : 1 }} onPress={() => list && moveWant(list, item.id, 1)} />
                  </View>
                ) : (
                  <IconButton icon="x" size={36} label={`Remove ${item.title}`} onPress={() => setRemoving(item)} />
                )}
              </View>
              {added ? (
                <Pressable accessibilityRole="button" onPress={() => setAdded(item.id, false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="circle-check" size={15} color={colors.sage700} />
                  <Text style={[font(700, 12, 1.3), { color: colors.sage700 }]}>Added to library · tap to undo</Text>
                </Pressable>
              ) : !reorder ? (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="upload"
                    style={{ alignSelf: 'flex-start' }}
                    onPress={async () => {
                      await setAdded(item.id, true);
                      startImportFlow();
                    }}>
                    Got the file → Import
                  </Button>
                  <Button variant="ghost" size="sm" icon="check" style={{ alignSelf: 'flex-start' }} onPress={() => setAdded(item.id, true)}>
                    Mark as added
                  </Button>
                </View>
              ) : null}
            </GlassCard>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
      <Dialog
        visible={!!removing}
        danger
        icon="trash-2"
        title={`Remove ${removing?.title ?? ''}?`}
        body="It will be removed from your Want to read list. You can add it again any time."
        ok="Remove"
        onCancel={() => setRemoving(null)}
        onOk={async () => {
          if (removing) await removeWant(removing.id);
          setRemoving(null);
        }}
      />
    </Screen>
  );
}
