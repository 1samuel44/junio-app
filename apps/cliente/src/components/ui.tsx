import { Image, Pressable, StyleSheet, Text, View, type PressableProps, type TextProps, type ViewStyle } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';

export function T({ style, variant = 'body', ...rest }: TextProps & { variant?: 'display' | 'title' | 'body' | 'small' | 'label' }) {
  return <Text {...rest} style={[styles[variant], style]} />;
}

export function Button({
  title,
  kind = 'primary',
  style,
  disabled,
  ...rest
}: PressableProps & { title: string; kind?: 'primary' | 'secondary' | 'ghost'; style?: ViewStyle }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.btn,
        kind === 'primary' && styles.btnPrimary,
        kind === 'secondary' && styles.btnSecondary,
        kind === 'ghost' && styles.btnGhost,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
        style,
      ]}
    >
      <Text style={[styles.btnText, kind !== 'primary' && { color: colors.negro }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style, tone = 'blanco' }: { children: React.ReactNode; style?: ViewStyle; tone?: keyof typeof colors }) {
  return <View style={[styles.card, { backgroundColor: colors[tone] }, style]}>{children}</View>;
}

export function Logo({ size = 64, tone = 'negro' }: { size?: number; tone?: 'negro' | 'oliva' }) {
  const src = tone === 'negro' ? require('../../assets/logo-negro.png') : require('../../assets/logo-oliva.png');
  return <Image source={src} style={{ width: size, height: size }} resizeMode="contain" accessibilityLabel="Junio" />;
}

export function Pill({ label, tone = 'salviaClaro' }: { label: string; tone?: keyof typeof colors }) {
  return (
    <View style={[styles.pill, { backgroundColor: colors[tone] }]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 30, color: colors.negro, letterSpacing: -0.5 },
  title: { fontFamily: fonts.bold, fontSize: 19, color: colors.negro },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.negro, lineHeight: 21 },
  small: { fontFamily: fonts.regular, fontSize: 13, color: '#5a5a55', lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.negro, textTransform: 'uppercase', letterSpacing: 1.2 },
  btn: { borderRadius: radius.pill, paddingVertical: space(4), paddingHorizontal: space(5), alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.negro },
  btnSecondary: { backgroundColor: colors.salviaClaro },
  btnGhost: { borderWidth: 1.5, borderColor: colors.negro },
  btnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.hueso },
  card: { borderRadius: radius.lg, padding: space(5) },
  pill: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  pillText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.negro },
});
