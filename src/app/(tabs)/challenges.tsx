// Screens 53 + 54 (+75) · Challenges: empty, Active / Completed list, error state.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { PromoCard } from '@/components/ds/PromoCard';
import { Empty } from '@/components/kit/Empty';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { PageTitle } from '@/components/kit/PageTitle';
import { Screen } from '@/components/kit/Screen';
import { Seg } from '@/components/kit/Seg';
import { Meta } from '@/components/kit/Typography';
import { ChallengeCard } from '@/features/challenges/ChallengeCard';
import { needsCelebration, updateStatuses, useChallenges } from '@/features/challenges/challenges';
import { useProfile } from '@/features/profile/ProfileProvider';
import { illustrations } from '@/illustrations';

type Tab = 'active' | 'done';

export default function Challenges() {
  const { profile } = useProfile();
  const list = useChallenges(profile ? { goal_type: profile.goal_type, daily_goal: profile.daily_goal } : null);
  const [tab, setTab] = useState<Tab>('active');

  // Move challenges on (completed / missed) and celebrate a fresh completion once.
  useFocusEffect(
    useCallback(() => {
      if (!list) return;
      updateStatuses(list).then(async (ids) => {
        const all = [...ids, ...list.filter((c) => c.status === 'completed').map((c) => c.id)];
        for (const id of all) {
          if (await needsCelebration(id)) {
            router.push({ pathname: '/challenge/done/[id]', params: { id } });
            break;
          }
        }
      });
    }, [list]),
  );

  const active = useMemo(() => (list ?? []).filter((c) => c.status === 'active'), [list]);
  const done = useMemo(() => (list ?? []).filter((c) => c.status !== 'active'), [list]);
  const create = () => router.push('/challenge/new');

  if (list && list.length === 0) {
    return (
      <Screen noBottomInset>
        <PageTitle title="Challenges" />
        <OfflineBanner />
        <Empty
          img={illustrations.crown}
          icon="trophy"
          title="No challenges yet"
          body="Set a weekly or monthly target. Readwell tracks it automatically from your reading sessions.">
          <Button icon="plus" onPress={create}>
            Create challenge
          </Button>
        </Empty>
      </Screen>
    );
  }

  const shown = tab === 'active' ? active : done;
  return (
    <Screen noBottomInset>
      <PageTitle title="Challenges" right={<IconButton icon="plus" variant="accent" label="New challenge" onPress={create} />} />
      <OfflineBanner />
      <FlatList
        data={shown}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={
          <Seg<Tab>
            sm
            value={tab}
            onChange={setTab}
            options={[
              { value: 'active', label: `Active (${active.length})` },
              { value: 'done', label: `History (${done.length})` },
            ]}
          />
        }
        ListEmptyComponent={
          list ? (
            <Meta style={{ textAlign: 'center', marginTop: 20 }}>
              {tab === 'active' ? 'No active challenges right now.' : 'Finished and missed challenges show up here.'}
            </Meta>
          ) : undefined
        }
        renderItem={({ item }) => <ChallengeCard c={item} onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: item.id } })} />}
        ListFooterComponent={
          tab === 'active' ? (
            <View style={{ marginTop: 12 }}>
              <PromoCard
                image={illustrations.starMascot}
                icon="sparkles"
                title="Try a new challenge"
                body="Weekly or monthly — you set the target."
                action={
                  <Button size="sm" onPress={create}>
                    Create
                  </Button>
                }
              />
            </View>
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
