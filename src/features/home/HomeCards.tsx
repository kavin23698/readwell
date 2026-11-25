// Home cards from rw-c-home-library.jsx: header, Continue reading, daily ratio, import-first-book.
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { Icon } from '@/components/ds/Icon';
import { Cover } from '@/components/kit/Cover';
import { Initials } from '@/components/kit/Initials';
import { Prog } from '@/components/kit/Prog';
import { Ring } from '@/components/kit/Ring';
import { Tile } from '@/components/kit/Tile';
import { H, Meta, Micro, P } from '@/components/kit/Typography';
import type { ProfileRow } from '@/db/schema';
import { formatLongDate, greeting, relativeTime } from '@/lib/dates';
import { JOURNEY_DAYS, type DailyStats } from '@/features/stats/stats';
import { colors, font } from '@/theme';
import type { ContinueBook } from './useHomeData';

export function HomeHeader({ name }: { name?: string | null }) {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4, paddingHorizontal: 20, paddingBottom: 14 }}>
      <View style={{ flex: 1 }}>
        <Meta>{formatLongDate()}</Meta>
        <Text numberOfLines={1} style={[font(800, 20, 1.2), { color: colors.rwInk }]}>
          {greeting()}
          {first ? `, ${first}` : ''}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.navigate('/profile')}>
        <Initials name={name} />
      </Pressable>
    </View>
  );
}

export function JourneyLine({ day }: { day: number }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <Meta c={colors.rwInk}>
          Day {day} of {JOURNEY_DAYS}
        </Meta>
        <Meta>{Math.round((day / JOURNEY_DAYS) * 100)}%</Meta>
      </View>
      <Prog pct={(day / JOURNEY_DAYS) * 100} h={6} />
    </View>
  );
}

export function goalText(amount: number, p: Pick<ProfileRow, 'goal_type' | 'daily_goal'>) {
  const unit = p.goal_type === 'pages' ? 'pages' : 'minutes';
  return `${Math.floor(amount)} of ${p.daily_goal} ${unit}`;
}

export function RatioCard({ stats, profile }: { stats: DailyStats; profile: ProfileRow }) {
  const pct = Math.round(stats.todayPct);
  const amount = profile.goal_type === 'pages' ? stats.today.pages : stats.today.seconds / 60;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Today ${pct}% of your goal. Open daily performance`} onPress={() => router.push('/performance')}>
      <GlassCard padding={14}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Ring pct={pct} size={96} stroke={11}>
            <Text style={[font(800, 22, 1.1), { color: colors.rwInk }]}>{pct}%</Text>
            <Meta>today</Meta>
          </Ring>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={[font(800, 16, 1.25), { color: colors.rwInk }]}>{goalText(amount, profile)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="flame" size={16} color={colors.peri700} />
              <Text style={[font(700, 13, 1.2), { color: colors.rwInk }]}>
                {stats.currentStreak ? `${stats.currentStreak}-day streak` : 'Start your streak today'}
              </Text>
            </View>
            <JourneyLine day={stats.journeyDay} />
          </View>
          <Icon name="chevron-right" size={18} color={colors.slate800} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

export function ContinueCard({ book, onOpen }: { book: ContinueBook; onOpen: () => void }) {
  const pct = Math.round(book.percent ?? 0);
  return (
    <GlassCard padding={14}>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Cover book={book} w={76} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Micro>Continue reading</Micro>
          <Text numberOfLines={2} style={[font(800, 19, 1.2), { color: colors.rwInk }]}>
            {book.title}
          </Text>
          {book.chapter ? <Meta numberOfLines={1}>{book.chapter}</Meta> : book.author ? <Meta numberOfLines={1}>{book.author}</Meta> : null}
          <View style={{ flex: 1 }} />
          <Prog pct={pct} h={6} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Meta c={colors.rwInk}>
              {book.page && book.total_pages ? `Page ${book.page} of ${book.total_pages}` : book.page ? `Page ${book.page}` : ' '}
            </Meta>
            <Meta c={colors.rwInk}>{pct}%</Meta>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="clock-3" size={14} color={colors.rwSec} />
          <Meta>Last read {book.last_opened_at ? relativeTime(book.last_opened_at).toLowerCase() : ''}</Meta>
        </View>
        <Button icon="book-open" onPress={onOpen}>
          Continue
        </Button>
      </View>
    </GlassCard>
  );
}

export function ImportFirstCard() {
  return (
    <GlassCard padding={22}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Tile icon="book-plus" size={84} />
        <H s={20} style={{ marginTop: 6, textAlign: 'center' }}>
          Import your first book
        </H>
        <P style={{ textAlign: 'center' }}>Add a book from your phone. Your progress starts the moment you open it.</P>
        <View style={{ marginTop: 6, alignSelf: 'stretch' }}>
          <Button fullWidth icon="upload" onPress={() => router.navigate('/library')}>
            Import book
          </Button>
        </View>
        <Meta>EPUB · PDF · TXT</Meta>
      </View>
    </GlassCard>
  );
}
