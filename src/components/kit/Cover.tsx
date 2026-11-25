// Kit Cover: the book's own cover image, or a generated cover in the design's style
// (gradient, spine line, title, rule, author).
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { colors, coverGradients, linear, shadow } from '@/theme';

export type CoverBook = { title: string; author?: string | null; cover_seed?: number; local_cover?: string | null };

export function Cover({ book, w = 64, h, r = 10 }: { book: CoverBook; w?: number; h?: number; r?: number }) {
  const height = h ?? Math.round(w * 1.5);
  const s = w / 100;
  const g = coverGradients[Math.abs(book.cover_seed ?? 0) % coverGradients.length];
  const base = { width: w, height, borderRadius: r, overflow: 'hidden' as const, boxShadow: shadow.raised };

  if (book.local_cover) {
    return (
      <View style={base}>
        <Image source={{ uri: book.local_cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      </View>
    );
  }
  return (
    <View
      accessibilityLabel={`Cover of ${book.title}`}
      style={[
        base,
        {
          backgroundImage: linear(g as [string, string], 155),
          paddingTop: 12 * s,
          paddingRight: 10 * s,
          paddingBottom: 10 * s,
          paddingLeft: 16 * s,
        },
      ]}>
      <View style={{ position: 'absolute', left: 7 * s, top: 0, bottom: 0, width: Math.max(1, 2 * s), backgroundColor: 'rgba(255,255,255,0.2)' }} />
      {w >= 28 ? (
        <>
          <Text
            numberOfLines={w < 50 ? 3 : 5}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            textBreakStrategy="simple"
            style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: Math.max(6, 13 * s), lineHeight: Math.max(7, 13 * s * 1.12), color: colors.textOnDark, marginTop: 4 * s }}>
            {book.title}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.35)', marginBottom: 5 * s }} />
          {book.author ? (
            <Text numberOfLines={2} style={{ fontFamily: 'Nunito_700Bold', fontSize: Math.max(5, 9 * s), lineHeight: Math.max(6, 9 * s * 1.2), color: colors.textOnDark, opacity: 0.88 }}>
              {book.author}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
