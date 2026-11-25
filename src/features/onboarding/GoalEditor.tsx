// Daily goal editor (screens 6 and 69): Minutes/Pages toggle, big stepper, preset chips.
import { View } from 'react-native';
import { GlassCard } from '@/components/ds/GlassCard';
import { Chip } from '@/components/kit/Chip';
import { Seg } from '@/components/kit/Seg';
import { Stepper } from '@/components/kit/Stepper';
import type { GoalType } from '@/features/profile/types';

export const goalPresets: Record<GoalType, number[]> = { minutes: [10, 15, 25, 45], pages: [5, 10, 20, 40] };
export const goalDefaults: Record<GoalType, number> = { minutes: 15, pages: 10 };

/** Rough reading-speed conversion used for the hint (design: 25 min ≈ 20 pages). */
export function goalHint(type: GoalType, value: number) {
  return type === 'minutes'
    ? `${value} minutes is about ${Math.max(1, Math.round(value * 0.8))} pages for most readers.`
    : `${value} pages takes most readers about ${Math.max(1, Math.round(value * 1.25))} minutes.`;
}

export function GoalEditor({
  type,
  value,
  onChange,
  big = true,
}: {
  type: GoalType;
  value: number;
  onChange: (t: GoalType, v: number) => void;
  big?: boolean;
}) {
  const minutes = type === 'minutes';
  return (
    <>
      <Seg<GoalType>
        sm={!big}
        options={[
          { value: 'minutes', label: 'Minutes' },
          { value: 'pages', label: 'Pages' },
        ]}
        value={type}
        onChange={(t) => onChange(t, goalDefaults[t])}
      />
      <GlassCard padding={big ? 22 : 12}>
        <Stepper
          big={big}
          value={value}
          unit={minutes ? 'minutes a day' : 'pages a day'}
          step={5}
          min={minutes ? 5 : 1}
          max={minutes ? 240 : 300}
          onChange={(v) => onChange(type, v)}
        />
      </GlassCard>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {goalPresets[type].map((v) => (
          <Chip key={v} on={v === value} onPress={() => onChange(type, v)}>
            {`${v} ${minutes ? 'min' : 'pages'}`}
          </Chip>
        ))}
      </View>
    </>
  );
}
