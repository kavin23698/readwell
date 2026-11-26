// Screens 51 + 52 · Note detail / edit and Delete note — confirm.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { AppBar } from '@/components/kit/AppBar';
import { Dialog } from '@/components/kit/Dialog';
import { Field } from '@/components/kit/Field';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Meta } from '@/components/kit/Typography';
import { one, useLiveQuery } from '@/db';
import { NOTE_MAX } from '@/features/notes/AddNoteSheet';
import { when } from '@/features/notes/NoteCard';
import { deleteNote, updateNote } from '@/features/notes/notesData';
import { openAtItem } from '@/features/notes/useNotes';
import { colors, font } from '@/theme';

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useLiveQuery(
    ['notes', 'highlights', 'books'],
    async () => {
      const note = await one('notes', id);
      if (!note) return null;
      const [book, hl] = await Promise.all([one('books', note.book_id), note.highlight_id ? one('highlights', note.highlight_id) : Promise.resolve(null)]);
      return { note, book, hl: hl && !hl.deleted_at ? hl : null };
    },
    [id],
  );
  const [body, setBody] = useState('');
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (data?.note && !dirty) setBody(data.note.body);
  }, [data?.note, dirty]);

  if (data === undefined) return <Screen />;
  if (!data || data.note.deleted_at) {
    return (
      <Screen>
        <AppBar title="Note" />
        <Body style={{ justifyContent: 'center' }}>
          <Meta style={{ textAlign: 'center' }}>This note was deleted.</Meta>
        </Body>
      </Screen>
    );
  }

  const { note, book, hl } = data;
  const quote = hl?.text ?? note.quote;
  const color = hl?.color ?? null;
  const place = [note.chapter, note.page ? `p. ${note.page}` : null].filter(Boolean).join(', ');
  const kindTitle = note.kind === 'meaning' ? 'Meaning' : note.kind === 'translation' ? 'Translation' : 'Note';
  const edited = note.updated_at !== note.created_at;
  const location = hl?.location ?? note.location;

  return (
    <Screen>
      <AppBar title={kindTitle} sub={[book?.title, place].filter(Boolean).join(' · ')} right={<IconButton icon="trash-2" label="Delete note" onPress={() => setConfirm(true)} />} />
      <Body gap={14}>
        {quote ? (
          <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.4)' }}>
            <Text style={[font(500, 15, 1.6), { fontStyle: 'italic', color: colors.rwInk }]}>
              <Text style={{ backgroundColor: color ?? 'transparent' }}>{quote}</Text>
            </Text>
          </View>
        ) : null}
        <Field
          label={note.kind === 'note' ? 'Your note' : kindTitle}
          multiline
          height={170}
          value={body}
          maxLength={NOTE_MAX}
          onChangeText={(t) => {
            setBody(t);
            setDirty(true);
          }}
        />
        <Meta>
          Added {when(note.created_at)}
          {edited ? ` · Edited ${when(note.updated_at)}` : ''}
        </Meta>
        {location && book ? (
          <Button variant="secondary" icon="book-open" style={{ alignSelf: 'flex-start' }} onPress={() => openAtItem({ bookId: book.id, location })}>
            {note.page ? `Go to page ${note.page}` : 'Go to this passage'}
          </Button>
        ) : null}
      </Body>
      <Actions>
        <Button
          fullWidth
          size="lg"
          disabled={!dirty || !body.trim()}
          onPress={async () => {
            await updateNote(note.id, body.trim());
            setDirty(false);
            router.back();
          }}>
          Save changes
        </Button>
      </Actions>
      <Dialog
        visible={confirm}
        danger
        icon="trash-2"
        title="Delete this note?"
        body={hl ? `The note will be removed. The highlight${note.page ? ` on page ${note.page}` : ''} stays, so you can still find the passage.` : 'The note will be removed from all your devices.'}
        ok="Delete note"
        onCancel={() => setConfirm(false)}
        onOk={async () => {
          await deleteNote(note.id);
          setConfirm(false);
          router.back();
        }}
      />
    </Screen>
  );
}
