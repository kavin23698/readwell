// Screens 55 + 56 · New challenge: step 1 weekly/monthly, step 2 goal type & target.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { Icon, type IconName } from '@/components/ds/Icon';
import { AppBar } from '@/components/kit/AppBar';
import { Field } from '@/components/kit/Field';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Stepper } from '@/components/kit/Stepper';
import { Tile } from '@/components/kit/Tile';
import { H, Meta, Micro } from '@/components/kit/Typography';
import { useAuth } from '@/features/auth/AuthProvider';
import { challengeTitle, createChallenge, dayMonth, defaultTargets, periodBounds, rangeLabel, targetTypes, unitOf, type Period, type TargetType } from '@/features/challenges/challenges';
import { colors, font, gradients, linear, shadow } from '@/theme';

function BigOpt({ icon, title, body, on, onPress }: { icon: IconName; title: string; body: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        padding: 18,
        borderRadius: 22,
        flexDirection: 'row',
        gap: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: on ? colors.teal600 : 'rgba(255,255,255,0.3)',
        backgroundImage: on ? linear(['rgba(255,255,255,0.62)', 'rgba(255,255,255,0.36)']) : linear(['rgba(255,255,255,0.26)', 'rgba(255,255,255,0.12)']),
        boxShadow: shadow.card,
      }}>
      <Tile icon={icon} size={56} />
      <View style={{ flex: 1 }}>
        <Text style={[font(800, 18, 1.2), { color: colors.rwInk }]}>{title}</Text>
        <Meta style={{ marginTop: 4 }}>{body}</Meta>
      </View>
      {on ? (
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.teal600, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={16} strokeWidth={3} color="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
}

const steps: Record<TargetType, number> = { books: 1, pages: 10, minutes: 15, goal_days: 1 };

export default function NewChallenge() {
  const { session } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [period, setPeriod] = useState<Period>('week');
  const [type, setType] = useState<TargetType>('pages');
  const [target, setTarget] = useState(defaultTargets.week.pages);
  const [busy, setBusy] = useState(false);
  const bounds = periodBounds(period);
  const maxDays = period === 'week' ? 7 : 31;

  if (step === 1) {
    return (
      <Screen>
        <AppBar title="New challenge" sub="Step 1 of 2" close />
        <Body gap={14}>
          <H s={24}>How long should it run?</H>
          <BigOpt icon="calendar-range" title="Weekly" body="This week, Monday to Sunday" on={period === 'week'} onPress={() => setPeriod('week')} />
          <BigOpt icon="calendar-days" title="Monthly" body="The whole calendar month" on={period === 'month'} onPress={() => setPeriod('month')} />
        </Body>
        <Actions>
          <Button
            fullWidth
            size="lg"
            onPress={() => {
              setTarget(defaultTargets[period][type]);
              setStep(2);
            }}>
            Continue
          </Button>
        </Actions>
      </Screen>
    );
  }

  const c = { period, target_type: type, target };
  return (
    <Screen>
      <AppBar title="New challenge" sub={`Step 2 of 2 · ${period === 'week' ? 'Weekly' : 'Monthly'}`} onBack={() => setStep(1)} />
      <Body gap={12}>
        <Micro>Goal type</Micro>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {targetTypes.map((t) => {
            const on = t.value === type;
            return (
              <Pressable
                key={t.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setType(t.value);
                  setTarget(defaultTargets[period][t.value]);
                }}
                style={{
                  width: '48.5%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  height: 46,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.55)',
                  backgroundImage: on ? linear(gradients.primary) : linear(['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.28)']),
                  boxShadow: on ? shadow.pill : shadow.raised,
                }}>
                <Icon name={t.icon} size={17} color={on ? '#fff' : colors.rwInk} />
                <Text style={[font(700, 13, 1.2), { color: on ? '#fff' : colors.rwInk }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {type === 'goal_days' ? <Meta>Days you reach your daily reading goal.</Meta> : null}
        <GlassCard padding={12}>
          <Stepper
            value={target}
            unit={unitOf(type, target)}
            step={steps[type]}
            min={1}
            max={type === 'goal_days' ? maxDays : 9999}
            onChange={setTarget}
          />
          <Text style={[font(800, 14, 1.3), { color: colors.teal800, textAlign: 'center' }]}>“{challengeTitle(c)}”</Text>
        </GlassCard>
        <View pointerEvents="none">
          <Field
            label="Dates"
            value={`${rangeLabel({ period, ...bounds })} · starts ${dayMonth(bounds.starts_on)}`}
            icon="calendar"
            editable={false}
            hint={period === 'week' ? 'Weekly challenges follow the calendar week, Monday to Sunday.' : 'Monthly challenges follow the calendar month.'}
          />
        </View>
      </Body>
      <Actions>
        <Button
          fullWidth
          size="lg"
          disabled={busy || !session}
          onPress={async () => {
            if (!session) return;
            setBusy(true);
            const id = await createChallenge(session.user.id, period, type, target);
            router.replace({ pathname: '/challenge/created/[id]', params: { id } });
          }}>
          Start challenge
        </Button>
      </Actions>
    </Screen>
  );
}
