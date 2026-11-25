// Aviso cuando se gana un sello o la bebida gratis.
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/state/store';
import { colors, fonts, radius } from '@/theme';

export function Notice() {
  const { state, t, dispatch } = useStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!state.notice) return;
    const id = setTimeout(() => dispatch({ type: 'dismissNotice' }), 4000);
    return () => clearTimeout(id);
  }, [state.notice, dispatch]);

  if (!state.notice) return null;
  const text =
    state.notice === 'recompensa' ? t.rewardEarned : state.notice === 'otorgado' ? t.stampEarned : t.alreadyToday;
  return (
    <Pressable
      onPress={() => dispatch({ type: 'dismissNotice' })}
      style={[styles.box, { top: insets.top + 8 }, state.notice === 'ya_hoy' && { backgroundColor: colors.crema }]}
    >
      <Text style={[styles.text, state.notice === 'ya_hoy' && { color: colors.negro }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.negro,
    borderRadius: radius.md,
    padding: 14,
    zIndex: 10,
    elevation: 10,
  },
  text: { fontFamily: fonts.semibold, color: colors.hueso, fontSize: 15, textAlign: 'center' },
});
