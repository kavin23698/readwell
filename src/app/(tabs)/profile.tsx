// Profile tab — placeholder until the Profile & stats feature (screens 61–66). Log out lives here for now.
import { View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { Initials } from '@/components/kit/Initials';
import { Body } from '@/components/kit/Layout';
import { OfflineBanner } from '@/components/kit/OfflineBanner';
import { PageTitle } from '@/components/kit/PageTitle';
import { Screen } from '@/components/kit/Screen';
import { H, Meta } from '@/components/kit/Typography';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile } from '@/features/profile/ProfileProvider';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const { session } = useAuth();
  const { profile } = useProfile();
  return (
    <Screen noBottomInset>
      <PageTitle title="Profile" />
      <OfflineBanner />
      <Body gap={12}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Initials name={profile?.display_name} size={60} />
          <View style={{ flex: 1 }}>
            <H s={20}>{profile?.display_name}</H>
            <Meta>{session?.user.email}</Meta>
          </View>
        </View>
        <GlassCard padding={16}>
          <Meta>Stats, Want to read and Settings arrive in a later feature.</Meta>
          <Button variant="secondary" icon="log-out" onPress={() => supabase.auth.signOut()}>
            Log out
          </Button>
        </GlassCard>
      </Body>
    </Screen>
  );
}
