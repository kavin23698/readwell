// Screens 28–30 · Importing → Import success / Import error.
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { Icon } from '@/components/ds/Icon';
import { AppBar } from '@/components/kit/AppBar';
import { Cover } from '@/components/kit/Cover';
import { Actions, Body } from '@/components/kit/Layout';
import { Prog } from '@/components/kit/Prog';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, Meta, P } from '@/components/kit/Typography';
import { clearImport, useImportState, type ImportItem } from '@/features/library/importStore';
import { startImportFlow } from '@/features/library/startImportFlow';
import { colors, font, gradients, linear } from '@/theme';

function ImpRow({ item }: { item: ImportItem }) {
  const done = item.state === 'done';
  const failed = item.state === 'error';
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      {item.outcome?.ok ? (
        <Cover book={{ title: item.outcome.title, author: item.outcome.author, cover_seed: item.outcome.coverSeed, local_cover: item.outcome.cover }} w={40} r={6} />
      ) : (
        <Tile icon={failed ? 'file-x' : 'file-text'} size={40} danger={failed} />
      )}
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text numberOfLines={1} style={[font(700, 13, 1.3), { color: colors.rwInk, flex: 1 }]}>
            {item.name}
          </Text>
          <Meta>{item.size}</Meta>
        </View>
        <Prog
          pct={item.pct}
          h={6}
          color={done ? linear(gradients.positive, 90) : failed ? linear(['#9a4652', colors.danger], 90) : undefined}
        />
        <Meta c={done ? colors.sage700 : failed ? colors.danger : colors.rwSec}>{item.status}</Meta>
      </View>
    </View>
  );
}

function ErrFile({ item }: { item: ImportItem }) {
  const o = item.outcome;
  if (!o || o.ok) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)' }}>
      <Tile icon="file-x" size={40} danger />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[font(700, 13, 1.3), { color: colors.rwInk }]}>
          {item.name}
        </Text>
        <Text style={[font(800, 13, 1.3), { color: colors.danger, marginTop: 2 }]}>{o.why}</Text>
        <Text style={[font(500, 12, 1.4), { color: colors.rwBody, marginTop: 2 }]}>{o.body}</Text>
      </View>
    </View>
  );
}

export default function ImportScreen() {
  const { items, running } = useImportState();
  const close = () => {
    if (!running) clearImport();
    router.canGoBack() ? router.back() : router.replace('/library');
  };

  if (!items.length) return <Redirect href="/library" />;

  // 28 · in progress
  if (running) {
    return (
      <Screen>
        <AppBar title={`Importing ${items.length} ${items.length === 1 ? 'book' : 'books'}`} close onBack={close} />
        <Body gap={14}>
          <GlassCard padding={16}>
            {items.map((i) => (
              <ImpRow key={i.key} item={i} />
            ))}
          </GlassCard>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingHorizontal: 4 }}>
            <Icon name="info" size={18} color={colors.slate800} />
            <Meta c={colors.rwInk} style={{ flex: 1 }}>
              You can leave this screen — importing continues in the background.
            </Meta>
          </View>
        </Body>
      </Screen>
    );
  }

  const added = items.filter((i) => i.outcome?.ok);
  const failed = items.filter((i) => i.outcome && !i.outcome.ok);

  // 30 · errors
  if (failed.length) {
    const addedNames = added.map((a) => (a.outcome?.ok ? a.outcome.title : a.name));
    return (
      <Screen>
        <AppBar title="Import" close onBack={close} />
        <Body gap={12}>
          <Tile icon="triangle-alert" size={64} danger />
          <H s={23}>
            {failed.length === 1 && items.length === 1
              ? "This file couldn't be imported"
              : `${failed.length} ${failed.length === 1 ? "file couldn't" : "files couldn't"} be imported`}
          </H>
          <P>
            {addedNames.length
              ? `${addedNames.join(', ')} ${addedNames.length === 1 ? 'was' : 'were'} added. Here's what went wrong with the rest.`
              : "Here's what went wrong."}
          </P>
          <GlassCard padding={{ vertical: 2, horizontal: 14 }} gap={0}>
            {failed.map((i) => (
              <ErrFile key={i.key} item={i} />
            ))}
          </GlassCard>
        </Body>
        <Actions>
          <Button
            fullWidth
            size="lg"
            icon="folder-open"
            onPress={() => {
              clearImport();
              router.back();
              startImportFlow();
            }}>
            Choose another file
          </Button>
          <Button fullWidth size="lg" variant="ghost" onPress={close}>
            Done
          </Button>
        </Actions>
      </Screen>
    );
  }

  // 29 · success
  const first = added[0]?.outcome;
  return (
    <Screen>
      <AppBar close onBack={close} />
      <Body gap={14} style={{ alignItems: 'center', paddingTop: 16 }}>
        <Tile icon="circle-check" size={96} />
        <H s={26} style={{ marginTop: 6, textAlign: 'center' }}>
          {added.length === 1 ? '1 book added' : `${added.length} books added`}
        </H>
        <P style={{ textAlign: 'center' }}>
          {added.length === 1 ? "It's on your shelf at 0%, ready when you are." : "They're on your shelf at 0%, ready when you are."}
        </P>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
          {added.slice(0, 3).map((a) =>
            a.outcome?.ok ? (
              <View key={a.key} style={{ width: 90, alignItems: 'center', gap: 6 }}>
                <Cover book={{ title: a.outcome.title, author: a.outcome.author, cover_seed: a.outcome.coverSeed, local_cover: a.outcome.cover }} w={90} />
                {a.outcome.author ? (
                  <Meta numberOfLines={1} style={{ fontSize: 11 }}>
                    {a.outcome.author}
                  </Meta>
                ) : null}
              </View>
            ) : null,
          )}
        </View>
      </Body>
      <Actions>
        {first?.ok ? (
          <Button
            fullWidth
            size="lg"
            icon="book-open"
            onPress={() => {
              clearImport();
              router.replace({ pathname: '/book/[id]', params: { id: first.bookId } });
            }}>
            {`Start reading ${first.title.length > 22 ? first.title.slice(0, 21) + '…' : first.title}`}
          </Button>
        ) : null}
        <Button fullWidth size="lg" variant="secondary" onPress={close}>
          Go to Library
        </Button>
      </Actions>
    </Screen>
  );
}
