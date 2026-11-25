import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Pill, T } from '@/components/ui';
import { itemById, optionsFor, type ItemOption, type OptionKind } from '@/data/menu';
import { pick } from '@/lib/i18n';
import { defaultOptionIds, money, unitPrice } from '@/lib/pricing';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space } from '@/theme';

export default function Product() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, t, dispatch } = useStore();
  const item = itemById(Number(id));
  const [selected, setSelected] = useState<number[]>(() => defaultOptionIds(Number(id)));
  const [qty, setQty] = useState(1);

  if (!item) return null;
  const lang = state.lang;
  const opts = optionsFor(item.id);
  const groups: Array<[OptionKind, string]> = [
    ['tamano', t.choose],
    ['leche', t.milk],
    ['extra', t.extras],
  ];

  const toggle = (o: ItemOption) => {
    setSelected((cur) => {
      if (o.kind === 'extra') return cur.includes(o.id) ? cur.filter((x) => x !== o.id) : [...cur, o.id];
      // tamaño y leche: una sola opción del grupo
      const sameKind = opts.filter((x) => x.kind === o.kind).map((x) => x.id);
      return [...cur.filter((x) => !sameKind.includes(x)), o.id];
    });
  };

  const price = unitPrice(item, selected) * qty;
  const desc = pick(item, 'desc', lang);

  return (
    <View style={{ flex: 1, backgroundColor: colors.hueso }}>
      <ScrollView contentContainerStyle={styles.content}>
        <T variant="display">{pick(item, 'name', lang)}</T>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {!!item.size && <Pill label={item.size} />}
          {item.is_coffee && <Pill label={t.coffeeOnly} tone="crema" />}
        </View>
        {!!desc && <T>{desc}</T>}

        {groups.map(([kind, label]) => {
          const list = opts.filter((o) => o.kind === kind);
          if (list.length === 0) return null;
          return (
            <View key={kind} style={{ gap: space(2) }}>
              <T variant="label">{label}</T>
              {list.map((o) => {
                const on = selected.includes(o.id);
                return (
                  <Pressable key={o.id} onPress={() => toggle(o)} style={[styles.opt, on && styles.optOn]}>
                    <View style={[kind === 'extra' ? styles.box : styles.radio, on && styles.checkOn]} />
                    <T style={{ flex: 1 }}>{pick(o, 'name', lang)}</T>
                    {o.price_delta > 0 && <T variant="small">+{money(o.price_delta)}</T>}
                  </Pressable>
                );
              })}
            </View>
          );
        })}

        <View style={styles.qtyRow}>
          <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn} accessibilityLabel="-">
            <T style={styles.qtyText}>−</T>
          </Pressable>
          <T style={styles.qtyText}>{qty}</T>
          <Pressable onPress={() => setQty((q) => Math.min(20, q + 1))} style={styles.qtyBtn} accessibilityLabel="+">
            <T style={styles.qtyText}>+</T>
          </Pressable>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={t.addToCart(money(price))}
          onPress={() => {
            dispatch({ type: 'add', line: { itemId: item.id, optionIds: selected, qty } });
            router.back();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), gap: space(4), paddingBottom: 120 },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    padding: space(3),
    borderRadius: radius.md,
    backgroundColor: colors.blanco,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optOn: { borderColor: colors.negro },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.negro },
  box: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: colors.negro },
  checkOn: { backgroundColor: colors.salvia },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(6), marginTop: space(2) },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.negro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontFamily: fonts.bold, fontSize: 20 },
  footer: { position: 'absolute', left: space(5), right: space(5), bottom: space(8) },
});
