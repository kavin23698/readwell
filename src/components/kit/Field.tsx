// Kit Field: labelled glass text input with icon, trailing slot, inline error / hint.
import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import { colors, font, gradients, linear, shadow } from '@/theme';

export type FieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  icon?: IconName;
  error?: string | null;
  hint?: string;
  right?: ReactNode;
  /** Renders the password eye toggle. */
  password?: boolean;
  multiline?: boolean;
  height?: number;
};

export const Field = forwardRef<TextInputInstance, FieldProps>(function Field(
  { label, icon, error, hint, right, password, multiline, height, ...input },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)';
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[font(700, 13, 1.2), { color: colors.rwInk }]}>{label}</Text> : null}
      <View
        style={[
          styles.box,
          { borderColor, minHeight: height ?? 50, alignItems: multiline ? 'flex-start' : 'center' },
          multiline && { paddingVertical: 12 },
        ]}>
        {icon ? <Icon name={icon} size={18} color={colors.slate800} /> : null}
        <TextInput
          ref={ref}
          {...input}
          multiline={multiline}
          secureTextEntry={password ? hidden : input.secureTextEntry}
          placeholderTextColor={colors.slate600}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[
            styles.input,
            font(password && hidden && input.value ? 800 : 500, 15, 1.5),
            password && hidden && input.value ? { letterSpacing: 2 } : null,
            multiline && { textAlignVertical: 'top', minHeight: (height ?? 50) - 24 },
          ]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={12}
            onPress={() => setHidden((h) => !h)}>
            <Icon name={hidden ? 'eye-off' : 'eye'} size={18} color={colors.slate800} />
          </Pressable>
        ) : null}
        {right}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="circle-alert" size={14} color={colors.danger} style={{ marginTop: 1 }} />
          <Text style={[font(700, 12, 1.35), { color: colors.danger, flex: 1 }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[font(600, 12, 1.35), { color: colors.rwSec }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundImage: linear(gradients.field),
    boxShadow: shadow.raised,
  },
  input: { flex: 1, minWidth: 0, color: colors.rwInk, paddingVertical: 0 },
  errorRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
});
