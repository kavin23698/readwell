// Screens 17–19 · Home: empty, loading and active states.
import { router } from 'expo-router';
import { Body } from '@/components/kit/Layout';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { Screen } from '@/components/kit/Screen';
import { ContinueCard, HomeHeader, ImportFirstCard, RatioCard } from '@/features/home/HomeCards';
import { HomeSkeleton } from '@/features/home/HomeSkeleton';
import { useBookCount, useContinueBook } from '@/features/home/useHomeData';
import { useProfile } from '@/features/profile/ProfileProvider';
import { useDailyStats } from '@/features/stats/stats';

export default function Home() {
  const { profile } = useProfile();
  const stats = useDailyStats();
  const book = useContinueBook();
  const bookCount = useBookCount();
  const loading = !profile || stats === undefined || book === undefined || bookCount === undefined;

  return (
    <Screen noBottomInset>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <>
          <HomeHeader name={profile.display_name} />
          <OfflineBanner />
          <Body gap={12}>
            {book ? <ContinueCard book={book} onOpen={() => router.navigate('/library')} /> : null}
            {stats ? <RatioCard stats={stats} profile={profile} /> : null}
            {bookCount === 0 ? <ImportFirstCard /> : null}
          </Body>
        </>
      )}
    </Screen>
  );
}
