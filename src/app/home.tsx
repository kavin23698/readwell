// Temporary signed-in screen — replaced by Home (screens 17–19) in a later feature.
import { useEffect, useState } from 'react';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, Meta, P } from '@/components/kit/Typography';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function SignedIn() {
  const { session } = useAuth();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('display_name')
      .maybeSingle()
      .then(({ data }) => setName(data?.display_name ?? null));
  }, []);

  return (
    <Screen>
      <Body style={{ justifyContent: 'center', gap: 16 }}>
        <Tile icon="circle-check" size={96} />
        <H s={26}>You&apos;re signed in{name ? `, ${name}` : ''}</H>
        <GlassCard padding={16} gap={6}>
          <Meta>Account</Meta>
          <P>{session?.user.email}</P>
        </GlassCard>
        <P>Close the app completely and reopen it — you should still be signed in.</P>
      </Body>
      <Actions>
        <Button fullWidth size="lg" variant="secondary" icon="log-out" onPress={() => supabase.auth.signOut()}>
          Log out
        </Button>
      </Actions>
    </Screen>
  );
}
