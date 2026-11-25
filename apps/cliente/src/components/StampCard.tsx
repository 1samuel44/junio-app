// Tarjeta de sellos estilo etiqueta de vaso: 7 sellos + la 8ª bebida gratis.
import { StyleSheet, Text, View } from 'react-native';

import { STAMPS_FOR_REWARD } from '@/lib/rewards';
import { colors, fonts } from '@/theme';

export function StampCard({ filled, freeLabel, compact }: { filled: number; freeLabel: string; compact?: boolean }) {
  const size = compact ? 30 : 56;
  const gap = compact ? 6 : 14;
  // compacta: una fila de 8; completa: dos filas de 4, como tarjeta de sellos
  const maxWidth = compact ? undefined : size * 4 + gap * 3;
  return (
    <View style={[styles.row, { gap, maxWidth, alignSelf: 'center' }]} accessibilityLabel={`${filled}/${STAMPS_FOR_REWARD}`}>
      {Array.from({ length: STAMPS_FOR_REWARD }, (_, i) => {
        const on = i < filled;
        return (
          <View
            key={i}
            style={[
              styles.stamp,
              { width: size, height: size, borderRadius: size / 2 },
              on ? styles.on : styles.off,
              on && { transform: [{ rotate: `${(i % 3) * 9 - 9}deg` }] },
            ]}
          >
            <Text style={[styles.mark, { fontSize: size * 0.42 }, !on && { color: colors.linea }]}>{on ? 'J' : i + 1}</Text>
          </View>
        );
      })}
      <View style={[styles.stamp, styles.free, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.freeText, { fontSize: size * 0.2 }]}>{freeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  stamp: { alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.salvia, borderWidth: 2, borderColor: colors.negro },
  off: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.linea },
  mark: { fontFamily: fonts.display, color: colors.negro },
  free: { backgroundColor: colors.negro },
  freeText: { fontFamily: fonts.bold, color: colors.crema, textTransform: 'uppercase', textAlign: 'center' },
});
