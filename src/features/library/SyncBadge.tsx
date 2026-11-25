// Per-book cloud status: uploading (with %), synced, failed (tap to retry), or "in the cloud" when the
// file hasn't been downloaded to this phone yet.
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import type { BookRow } from '@/db/schema';
import { colors, font } from '@/theme';
import { fileExists } from './files';
import { onUploadProgress, retryUpload } from './uploader';

function Line({ icon, color, text, compact }: { icon: IconName; color: string; text: string; compact?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={compact ? 11 : 13} color={color} strokeWidth={2.4} />
      <Text numberOfLines={1} style={[font(700, compact ? 10 : 12, 1.2), { color, flexShrink: 1 }]}>
        {text}
      </Text>
    </View>
  );
}

export function SyncBadge({ book, compact }: { book: BookRow; compact?: boolean }) {
  const [fraction, setFraction] = useState<number | null>(null);
  useEffect(() => onUploadProgress((id, f) => id === book.id && setFraction(f)), [book.id]);

  if (!fileExists(book.local_path)) return <Line compact={compact} icon="cloud" color={colors.rwSec} text="In the cloud" />;
  if (book.upload_state === 'failed') {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Upload failed. Tap to retry" hitSlop={8} onPress={() => retryUpload(book.id)}>
        <Line compact={compact} icon="cloud-off" color={colors.danger} text={compact ? 'Failed · retry' : 'Upload failed · tap to retry'} />
      </Pressable>
    );
  }
  if (book.upload_state === 'pending') return <Line compact={compact} icon="cloud-upload" color={colors.teal800} text={compact ? 'Waiting' : 'Waiting to upload'} />;
  if (book.upload_state === 'uploading') {
    const pct = fraction != null ? ` ${Math.round(fraction * 100)}%` : '…';
    return <Line compact={compact} icon="cloud-upload" color={colors.teal800} text={`Uploading${pct}`} />;
  }
  return <Line compact={compact} icon="cloud" color={colors.sage700} text="Synced" />;
}
