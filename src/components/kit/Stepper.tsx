// Kit Stepper: − value + with unit caption.
import { Text, View } from 'react-native';
import { IconButton } from '@/components/ds/IconButton';
import { colors, font } from '@/theme';
import { Meta } from './Typography';

export function Stepper({
  value,
  unit,
  big,
  onChange,
  step = 1,
  min = 1,
  max = 999,
}: {
  value: number;
  unit: string;
  big?: boolean;
  onChange?: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  const set = (v: number) => onChange?.(Math.max(min, Math.min(max, v)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: big ? 28 : 18 }}>
      <IconButton icon="minus" size={big ? 56 : 44} label="Decrease" onPress={() => set(value - step)} />
      <View style={{ alignItems: 'center', minWidth: big ? 110 : 80 }} accessible accessibilityLabel={`${value} ${unit}`}>
        <Text style={[font(800, big ? 64 : 36, 1.05), { color: colors.rwInk }]}>{value}</Text>
        <Meta style={{ marginTop: 4 }}>{unit}</Meta>
      </View>
      <IconButton icon="plus" variant="accent" size={big ? 56 : 44} label="Increase" onPress={() => set(value + step)} />
    </View>
  );
}
