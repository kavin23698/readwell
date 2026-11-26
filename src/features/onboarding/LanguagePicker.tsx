// "Translate selections into" field + language list sheet (screens 7 and Settings).
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ds/Icon';
import { Field } from '@/components/kit/Field';
import { Sheet } from '@/components/kit/Sheet';
import { colors, font } from '@/theme';
import { languageLabel, languages } from './languages';

export function LanguagePicker({ value, onChange, label = 'Translate selections into', hint }: { value: string; onChange: (code: string) => void; label?: string; hint?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${languageLabel(value)}`} onPress={() => setOpen(true)}>
        <View pointerEvents="none">
          <Field
            label={label}
            icon="languages"
            value={languageLabel(value)}
            editable={false}
            hint={hint}
            right={<Icon name="chevron-down" size={18} color={colors.slate800} />}
          />
        </View>
      </Pressable>
      <LanguageSheet visible={open} onClose={() => setOpen(false)} value={value} onChange={onChange} />
    </>
  );
}

export function LanguageSheet({ visible, onClose, value, onChange }: { visible: boolean; onClose: () => void; value: string; onChange: (code: string) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Translate into">
      <FlatList
        data={languages}
        keyExtractor={(l) => l.code}
        style={{ maxHeight: 420 }}
        renderItem={({ item }) => {
          const on = item.code === value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => {
                onChange(item.code);
                onClose();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 52,
                paddingHorizontal: 10,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.5)',
                gap: 12,
              }}>
              <View style={{ flex: 1 }}>
                <Text style={[font(700, 15, 1.3), { color: colors.rwInk }]}>{item.name}</Text>
                <Text style={[font(600, 13, 1.3), { color: colors.rwSec }]}>{item.native}</Text>
              </View>
              {on ? <Icon name="check" size={20} color={colors.teal700} strokeWidth={3} /> : null}
            </Pressable>
          );
        }}
      />
    </Sheet>
  );
}
