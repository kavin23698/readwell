// Reminder time wheel (screen 8): hour · minute (5-min steps) · AM/PM, plus preset chips.
import { Text, View } from 'react-native';
import { GlassCard } from '@/components/ds/GlassCard';
import { Chip } from '@/components/kit/Chip';
import { WHEEL_ROW, WheelColumn } from '@/components/kit/WheelColumn';
import { formatTime, to12, to24 } from '@/lib/time';
import { colors, font, shadow } from '@/theme';

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const ampm = ['AM', 'PM'];

const presets = [
  { value: '07:00', icon: 'sun' as const },
  { value: '13:00' },
  { value: '20:30', icon: 'moon' as const },
  { value: '22:00' },
];

export function TimeWheel({ value, onChange }: { value: string; onChange: (hhmm: string) => void }) {
  const t = to12(value);
  const minuteIndex = Math.round(t.minute / 5) % 12;
  const set = (patch: Partial<typeof t>) => onChange(to24({ ...t, minute: minuteIndex * 5, ...patch }));

  return (
    <>
      <GlassCard padding={16}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: WHEEL_ROW + 4,
              marginTop: -(WHEEL_ROW + 4) / 2,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.35)',
              boxShadow: shadow.inset,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <WheelColumn label="Hour" items={hours} index={t.hour - 1} onChange={(i) => set({ hour: i + 1 })} />
            <Text style={[font(800, 30, 1), { color: colors.rwInk }]}>:</Text>
            <WheelColumn label="Minute" items={minutes} index={minuteIndex} onChange={(i) => set({ minute: i * 5 })} />
            <WheelColumn label="AM or PM" items={ampm} index={t.pm ? 1 : 0} onChange={(i) => set({ pm: i === 1 })} width={70} />
          </View>
        </View>
      </GlassCard>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {presets.map((p) => (
          <Chip key={p.value} icon={p.icon} on={p.value === value} onPress={() => onChange(p.value)}>
            {formatTime(p.value)}
          </Chip>
        ))}
      </View>
    </>
  );
}
