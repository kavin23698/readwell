// Screen 65 · Add to Want to read.
import { router } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/ds/Button';
import { AppBar } from '@/components/kit/AppBar';
import { Field } from '@/components/kit/Field';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Meta } from '@/components/kit/Typography';
import { useAuth } from '@/features/auth/AuthProvider';
import { addWant } from '@/features/wantToRead/wantToRead';

export default function AddWant() {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);

  async function save() {
    setTried(true);
    if (!title.trim() || !session) return;
    await addWant(session.user.id, { title: title.trim(), author: author.trim() || null, note: note.trim() || null });
    router.back();
  }

  return (
    <Screen>
      <AppBar title="Add to Want to read" close />
      <Body gap={14}>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Book title" autoFocus error={tried && !title.trim() ? 'Add a title.' : null} />
        <Field label="Author (optional)" value={author} onChangeText={setAuthor} placeholder="Who wrote it" />
        <Field label="Why this book? (optional)" value={note} onChangeText={setNote} placeholder="Recommended by…" multiline height={90} maxLength={300} />
        <Meta>When you have the file, tap “Got the file → Import”.</Meta>
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={save}>
          Save
        </Button>
      </Actions>
    </Screen>
  );
}
