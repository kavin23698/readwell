// Note / highlight card from the designs (rw-f-notes-challenges.jsx NoteCard).
import { Pressable, Text, View } from 'react-native';
import { GlassCard } from '@/components/ds/GlassCard';
import { Icon, type IconName } from '@/components/ds/Icon';
import { Meta } from '@/components/kit/Typography';
import { formatClock, formatDayMonth, localDate } from '@/lib/dates';
import { colors, font } from '@/theme';
import type { NoteItem } from './useNotes';

const kindLabel: Record<NoteItem['kind'], { icon: IconName; label: string } | null> = {
  highlight: null,
  note: null,
  meaning: { icon: 'book-a', label: 'Meaning' },
  translation: { icon: 'languages', label: 'Translation' },
};

export function when(iso: string) {
  const d = new Date(iso);
  if (localDate(d) === localDate()) return `Today, ${formatClock(d)}`;
  return formatDayMonth(d);
}

export function NoteCard({ item, showChapter, isNew, onPress }: { item: NoteItem; showChapter?: boolean; isNew?: boolean; onPress: () => void }) {
  const k = kindLabel[item.kind];
  const meta = [showChapter && item.chapter ? item.chapter : null, item.page ? `p. ${item.page}` : null, when(item.updatedAt)].filter(Boolean).join(' · ');
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <GlassCard padding={14} gap={8}>
        {k ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={k.icon} size={14} color={colors.teal700} />
            <Text style={[font(800, 11, 1.2), { color: colors.teal700, letterSpacing: 0.6, textTransform: 'uppercase' }]}>{k.label}</Text>
          </View>
        ) : null}
        {item.quote ? (
          <Text numberOfLines={4} style={[font(500, 14, 1.55), { fontStyle: 'italic', color: colors.rwInk }]}>
            <Text style={{ backgroundColor: item.color ?? 'transparent' }}>{item.quote}</Text>
          </Text>
        ) : null}
        {item.body ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {item.type === 'highlight' || item.kind === 'note' ? <Icon name="sticky-note" size={15} color={colors.teal700} style={{ marginTop: 3 }} /> : null}
            <Text numberOfLines={5} style={[font(600, 14, 1.5), { color: colors.rwInk, flex: 1 }]}>
              {item.body}
            </Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Meta style={{ flex: 1 }}>{meta}</Meta>
          {isNew ? (
            <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 99, backgroundColor: colors.teal600 }}>
              <Text style={[font(800, 10, 1.1), { color: '#fff' }]}>NEW</Text>
            </View>
          ) : null}
        </View>
      </GlassCard>
    </Pressable>
  );
}
