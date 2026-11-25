// DS SearchField (components/forms/SearchField.jsx): glass pill input with search icon.
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { colors, font, gradients, linear, shadow } from '@/theme';
import { Icon } from './Icon';

export function SearchField({ placeholder = 'Search…', value, onChangeText }: { placeholder?: string; value: string; onChangeText: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 44,
        paddingHorizontal: 18,
        borderRadius: 999,
        backgroundImage: linear(gradients.search),
        borderWidth: 1,
        borderColor: focused ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)',
        boxShadow: shadow.raised,
      }}>
      <Icon name="search" size={19} strokeWidth={2.4} color={colors.slate800} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.slate600}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={[font(500, 14, 1.3), { flex: 1, color: colors.textStrong, paddingVertical: 0 }]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => onChangeText('')}>
          <Icon name="x" size={16} color={colors.slate800} />
        </Pressable>
      ) : null}
    </View>
  );
}
