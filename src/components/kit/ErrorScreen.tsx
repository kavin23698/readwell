// Screen 75 · Something went wrong — used as the Expo Router error boundary.
import type { ErrorBoundaryProps } from 'expo-router';
import { router } from 'expo-router';
import { Button } from '@/components/ds/Button';
import { formatClock, formatDayMonth } from '@/lib/dates';
import { Empty } from './Empty';
import { Screen } from './Screen';
import { Meta } from './Typography';

export function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const now = new Date();
  console.warn('[error boundary]', error?.message);
  return (
    <Screen>
      <Empty icon="circle-alert" title="Something went wrong" body="We couldn't load this screen. It's not you — please try again in a moment.">
        <Button icon="refresh-cw" onPress={retry}>
          Retry
        </Button>
        <Button variant="ghost" onPress={() => router.replace('/')}>
          Go to Home
        </Button>
        <Meta style={{ textAlign: 'center' }}>
          {error?.name && error.name !== 'Error' ? `${error.name} · ` : ''}
          {formatDayMonth(now)}, {formatClock(now)}
        </Meta>
      </Empty>
    </Screen>
  );
}
