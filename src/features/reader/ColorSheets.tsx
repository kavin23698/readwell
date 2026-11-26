// Screens 37 + 38 · Highlight colour presets (with recent + Custom) and the custom colour picker.
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import ColorPicker, { HueSlider, Panel1 } from 'reanimated-color-picker';
import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { Field } from '@/components/kit/Field';
import { Sheet } from '@/components/kit/Sheet';
import { Micro } from '@/components/kit/Typography';
import { colors, font, shadow } from '@/theme';
import { presets, recentColors } from './colors';
import { Swatch } from './Swatch';

export function HighlightColorSheet({
  visible,
  onClose,
  onPick,
  onCustom,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (hex: string) => void;
  onCustom: () => void;
}) {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    if (visible) recentColors().then(setRecent);
  }, [visible]);
  return (
    <Sheet visible={visible} onClose={onClose} title="Highlight colour" noScrim>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {presets.map((p) => (
          <Swatch key={p.key} color={p.color} label={`${p.key} highlight`} onPress={() => onPick(p.color)} />
        ))}
      </View>
      <Micro>Recent</Micro>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        {recent.length ? (
          recent.map((c) => <Swatch key={c} color={c} size={36} label={`Recent colour ${c}`} onPress={() => onPick(c)} />)
        ) : (
          <Text style={[font(600, 12, 1.3), { color: colors.rwSec, flex: 1 }]}>Custom colours you use appear here.</Text>
        )}
        {recent.length ? <View style={{ flex: 1 }} /> : null}
        <View
          style={{
            flexShrink: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 4,
            paddingLeft: 4,
            paddingRight: 14,
            borderRadius: 99,
            backgroundColor: 'rgba(255,255,255,0.5)',
            boxShadow: `0 0 0 2px ${colors.teal600}`,
          }}>
          <Swatch rainbow size={36} label="Custom colour" onPress={onCustom}>
            <Icon name="plus" size={16} color={colors.ink} />
          </Swatch>
          <Text onPress={onCustom} style={[font(800, 14, 1.1), { color: colors.rwInk }]}>
            Custom
          </Text>
        </View>
      </View>
    </Sheet>
  );
}

const HEX = /^#?[0-9a-fA-F]{6}$/;

export function CustomColorSheet({
  visible,
  initial = '#8ccfd9',
  onClose,
  onApply,
}: {
  visible: boolean;
  initial?: string;
  onClose: () => void;
  onApply: (hex: string) => void;
}) {
  const [hex, setHex] = useState(initial);
  const [text, setText] = useState(initial.toUpperCase());
  useEffect(() => {
    if (visible) {
      setHex(initial);
      setText(initial.toUpperCase());
    }
  }, [visible, initial]);

  const valid = HEX.test(text);
  return (
    <Sheet visible={visible} onClose={onClose} title="Custom colour" noScrim>
      <ColorPicker
        value={hex}
        onCompleteJS={(c) => {
          const v = c.hex.slice(0, 7);
          setHex(v);
          setText(v.toUpperCase());
        }}
        style={{ gap: 14 }}>
        <Panel1 style={{ height: 150, borderRadius: 16, boxShadow: shadow.inset }} thumbSize={24} />
        <HueSlider style={{ height: 16, borderRadius: 8 }} thumbSize={24} />
      </ColorPicker>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Swatch color={valid ? (text.startsWith('#') ? text : `#${text}`) : hex} size={50} label="Preview" />
        <View style={{ flex: 1 }}>
          <Field
            icon="hash"
            value={text.replace('#', '')}
            autoCapitalize="characters"
            maxLength={7}
            onChangeText={(t) => {
              const v = `#${t.replace('#', '')}`;
              setText(v.toUpperCase());
              if (HEX.test(v)) setHex(v.toLowerCase());
            }}
            error={valid ? null : 'Use 6 hex digits, like 8CCFD9'}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button variant="secondary" fullWidth style={{ flex: 1 }} onPress={onClose}>
          Cancel
        </Button>
        <Button fullWidth style={{ flex: 1 }} disabled={!valid} onPress={() => onApply(hex.toLowerCase())}>
          Apply
        </Button>
      </View>
    </Sheet>
  );
}
