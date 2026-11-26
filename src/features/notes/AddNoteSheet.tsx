// Screen 45 · Add note: the passage (in its highlight colour), a note field (max 1000), Save note.
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Field } from '@/components/kit/Field';
import { Sheet } from '@/components/kit/Sheet';
import { Meta } from '@/components/kit/Typography';
import { colors, font } from '@/theme';

export const NOTE_MAX = 1000;

export function AddNoteSheet({
  visible,
  title = 'Add note',
  quote,
  color,
  meta,
  initial = '',
  onClose,
  onSave,
}: {
  visible: boolean;
  title?: string;
  quote?: string | null;
  color?: string | null;
  meta?: string;
  initial?: string;
  onClose: () => void;
  onSave: (body: string) => Promise<void> | void;
}) {
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (visible) setBody(initial);
  }, [visible, initial]);

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {quote ? (
        <View style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.5)' }}>
          <Text numberOfLines={5} style={[font(500, 14, 1.55), { fontStyle: 'italic', color: colors.rwInk }]}>
            <Text style={{ backgroundColor: color ?? 'transparent' }}>{quote}</Text>
          </Text>
        </View>
      ) : null}
      <Field
        multiline
        height={130}
        value={body}
        onChangeText={(t) => setBody(t.slice(0, NOTE_MAX))}
        placeholder="What do you want to remember?"
        autoFocus
        maxLength={NOTE_MAX}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Meta>{meta ?? ''}</Meta>
        <Meta>
          {body.length} / {NOTE_MAX}
        </Meta>
      </View>
      <Button
        fullWidth
        size="lg"
        disabled={!body.trim() || busy}
        onPress={async () => {
          setBusy(true);
          await onSave(body.trim());
          setBusy(false);
        }}>
        Save note
      </Button>
    </Sheet>
  );
}
