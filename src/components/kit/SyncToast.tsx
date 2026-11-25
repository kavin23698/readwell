// Screen 74 · Sync failed — "Couldn't sync N changes" with Retry. Shown app-wide while online.
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ds/Button';
import { useSync } from '@/sync/SyncProvider';
import { Toast } from './Toast';

export function SyncToast() {
  const { problem, pending, online, retry, syncing } = useSync();
  const insets = useSafeAreaInsets();
  if (!problem || !online || syncing) return null;
  const label = pending > 0 ? `Couldn't sync ${pending} ${pending === 1 ? 'change' : 'changes'}` : "Couldn't sync with your account";
  return (
    <Toast
      icon="cloud-off"
      style={{ bottom: insets.bottom + 96 }}
      action={
        <Button size="sm" variant="secondary" onPress={retry}>
          Retry
        </Button>
      }>
      {label}
    </Toast>
  );
}
