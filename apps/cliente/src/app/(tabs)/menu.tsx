import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, T } from '@/components/ui';
import type { MenuItem } from '@/data/menu';
import { pick } from '@/lib/i18n';
import { cartTotals, money } from '@/lib/pricing';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space } from '@/theme';

export default function Menu() {
  const { state, t } = useStore();
  const [active, setActive] = useState<number | null>(null);
  const lang = state.lang;
  const { categories, items } = state.menu;

  const sections = useMemo(
    () =>
      categories
        .filter((c) => active === null || c.id === active)
        .map((c) => ({ key: String(c.id), title: pick(c, 'name', lang), data: items.filter((i) => i.category_id === c.id) })),
    [active, lang, categories, items],
  );

  const count = state.cart.reduce((n, l) => n + l.qty, 0);
  const totals = cartTotals(state.menu, state.cart, false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <T variant="display" style={styles.h1}>
        {t.tabs.menu}
      </T>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ id: null as number | null, label: lang === 'es' ? 'Todo' : 'All' }, ...categories.map((c) => ({ id: c.id as number | null, label: pick(c, 'name', lang) }))].map(
            (c) => (
              <Pressable
                key={String(c.id)}
                onPress={() => setActive(c.id)}
                style={[styles.chip, active === c.id && styles.chipOn]}
              >
                <T style={[styles.chipText, active === c.id && { color: colors.hueso }]}>{c.label}</T>
              </Pressable>
            ),
          )}
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: 120 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <T variant="label" style={styles.section}>
            {section.title}
          </T>
        )}
        renderItem={({ item }) => <Row item={item} />}
      />

      {count > 0 && (
        <View style={styles.cartBar}>
          <Button title={`${t.cart} (${count}) · ${money(totals.subtotal)}`} onPress={() => router.push('/carrito')} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Row({ item }: { item: MenuItem }) {
  const { state, t } = useStore();
  const desc = pick(item, 'desc', state.lang);
  return (
    <Pressable
      disabled={!item.is_available}
      onPress={() => router.push({ pathname: '/producto/[id]', params: { id: String(item.id) } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }, !item.is_available && { opacity: 0.45 }]}
    >
      <View style={{ flex: 1 }}>
        <T style={styles.name}>{pick(item, 'name', state.lang)}</T>
        {!!desc && <T variant="small">{desc}</T>}
        <View style={styles.meta}>
          {!!item.size && <T variant="small">{item.size}</T>}
          {item.is_coffee && <T variant="small" style={{ color: colors.ok }}>★ {t.redeemable}</T>}
          {!item.is_available && <T variant="small" style={{ color: colors.alerta }}>{t.soldOut}</T>}
        </View>
      </View>
      <T style={styles.price}>{money(item.base_price)}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.hueso },
  h1: { paddingHorizontal: space(5), paddingTop: space(3) },
  chips: { gap: 8, paddingHorizontal: space(5), paddingVertical: space(3) },
  chip: { borderWidth: 1.5, borderColor: colors.negro, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 14 },
  chipOn: { backgroundColor: colors.negro },
  chipText: { fontFamily: fonts.semibold, fontSize: 14 },
  section: { marginTop: space(5), marginBottom: space(2) },
  row: {
    flexDirection: 'row',
    gap: space(3),
    paddingVertical: space(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.linea,
  },
  name: { fontFamily: fonts.bold, fontSize: 16 },
  meta: { flexDirection: 'row', gap: 10, marginTop: 2 },
  price: { fontFamily: fonts.semibold },
  cartBar: { position: 'absolute', left: space(5), right: space(5), bottom: space(4) },
});
