// DS BarChart (components/data/BarChart.jsx): y-axis ticks + rounded 3D bars, optional goal line.
import { Text, View } from 'react-native';
import { bars, colors, font, shadow } from '@/theme';

export type Bar = { label: string; value: number };

export function BarChart({
  data,
  max,
  ticks,
  unit = '',
  height = 110,
  colorsList = bars as readonly string[],
  goal,
}: {
  data: Bar[];
  max: number;
  ticks: number[];
  unit?: string;
  height?: number;
  colorsList?: readonly string[];
  /** Draws the dashed GOAL line at this value. */
  goal?: number;
}) {
  const label = font(500, 12, 1.2);
  return (
    <View style={{ flexDirection: 'row', gap: 8 }} accessible accessibilityLabel={data.map((d) => `${d.label} ${Math.round(d.value)}${unit}`).join(', ')}>
      <View style={{ height, justifyContent: 'space-between', flexDirection: 'column-reverse' }}>
        {ticks.map((t) => (
          <Text key={t} style={[label, { color: colors.textStrong, lineHeight: 12, marginVertical: -6 }]}>
            {t}
            {t ? unit : ''}
          </Text>
        ))}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {data.map((d, i) => (
            <View key={d.label + i} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
              <View style={{ height, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                <View
                  style={{
                    width: '78%',
                    maxWidth: 26,
                    height: `${Math.max(0, Math.min(100, (d.value / max) * 100))}%`,
                    borderRadius: 7,
                    backgroundColor: colorsList[i % colorsList.length],
                    boxShadow: d.value > 0 ? shadow.bar : undefined,
                  }}
                />
              </View>
              <Text style={[label, { color: colors.textStrong }]}>{d.label}</Text>
            </View>
          ))}
        </View>
        {goal != null ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: height * (1 - goal / max) }}>
            <View style={{ borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.navy700 }} />
            <Text style={[font(800, 10, 1), { color: colors.navy700, position: 'absolute', right: 0, top: -14 }]}>GOAL</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
