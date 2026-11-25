// Kit Initials: round avatar with the user's initials.
import { Text, View } from 'react-native';
import { colors, font, shadow } from '@/theme';

export function initialsOf(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Initials({ name, size = 44 }: { name?: string | null; size?: number }) {
  return (
    <View
      accessibilityLabel={name ?? 'Profile'}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `radial-gradient(circle at 35% 30%, ${colors.teal300}, ${colors.teal700})`,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.6)',
        boxShadow: shadow.raised,
      }}>
      <Text style={[font(800, size * 0.36, 1.1), { color: '#fff' }]}>{initialsOf(name)}</Text>
    </View>
  );
}
