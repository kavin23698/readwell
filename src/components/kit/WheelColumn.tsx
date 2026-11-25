// One snapping column of the time wheel (screen 8): selected row large and dark, neighbours faded.
import { useEffect, useRef } from 'react';
import { ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { colors, font } from '@/theme';

const ROW = 46;
const VISIBLE = 5;

export function WheelColumn({
  items,
  index,
  onChange,
  width = 64,
  label,
}: {
  items: string[];
  index: number;
  onChange: (i: number) => void;
  width?: number;
  label: string;
}) {
  const ref = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    ref.current?.scrollTo({ y: index * ROW, animated: false });
    // Only on mount and when the value is changed from outside (e.g. a preset chip).
  }, [index]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW)));
    if (i !== index) onChange(i);
  };

  return (
    <View style={{ height: ROW * VISIBLE, width }} accessible accessibilityRole="adjustable" accessibilityLabel={`${label}: ${items[index]}`}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(items.length - 1, index + 1));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(0, index - 1));
      }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        onMomentumScrollEnd={onEnd}
        onScrollEndDrag={(e) => {
          if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) onEnd(e);
        }}
        contentContainerStyle={{ paddingVertical: ROW * 2 }}
        nestedScrollEnabled>
        {items.map((it, i) => {
          const d = Math.abs(i - index);
          return (
            <View key={it + i} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                style={[
                  font(d === 0 ? 800 : 600, d === 0 ? 34 : 20, 1.1),
                  { color: d === 0 ? colors.rwInk : colors.slate700, opacity: d === 0 ? 1 : d === 1 ? 0.55 : 0.3 },
                ]}>
                {it}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const WHEEL_ROW = ROW;
export const WHEEL_HEIGHT = ROW * VISIBLE;
