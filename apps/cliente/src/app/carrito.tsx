import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { LineSummary } from '@/components/LineSummary';
import { Button, Card, T } from '@/components/ui';
import { cartTotals, money } from '@/lib/pricing';
import { openRewards } from '@/lib/rewards';
import { isOpen } from '@/lib/time';
import { useStore, type PaymentMethod } from '@/state/store';
import { colors, fonts, radius, space } from '@/theme';

export default function Cart() {
  const { state, t, dispatch } = useStore();
  const [method, setMethod] = useState<PaymentMethod>('barra');
  const [note, setNote] = useState('');
  const now = Date.now();
  const reward = openRewards(state.card, now)[0];
  const totals = cartTotals(state.cart, state.useReward && !!reward);
  const open = isOpen(new Date(now));

  if (state.cart.length === 0) {
    return (
      <View style={styles.empty}>
        <T variant="title">{t.emptyCart}</T>
        <Button title={t.browseMenu} kind="ghost" onPress={() => router.navigate('/menu')} />
      </View>
    );
  }

  const place = () => {
    const number = state.nextNumber;
    dispatch({ type: 'place', method, note: note.trim(), now: Date.now() });
    router.replace({ pathname: '/pedido/[id]', params: { id: String(number) } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.hueso }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          {state.cart.map((l, i) => (
            <View key={l.key} style={[styles.line, i > 0 && styles.divider]}>
              <LineSummary line={l} lang={state.lang} isReward={i === totals.rewardLine} freeLabel={t.free} />
              <View style={styles.qty}>
                <Pressable onPress={() => dispatch({ type: 'qty', key: l.key, delta: -1 })} hitSlop={8}>
                  <T style={styles.qtyBtn}>−</T>
                </Pressable>
                <Pressable onPress={() => dispatch({ type: 'qty', key: l.key, delta: 1 })} hitSlop={8}>
                  <T style={styles.qtyBtn}>+</T>
                </Pressable>
              </View>
            </View>
          ))}
        </Card>

        {reward && (
          <Card tone="crema">
            <View style={styles.rewardRow}>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: fonts.bold }}>{t.useReward}</T>
                {state.useReward && totals.rewardLine < 0 && <T variant="small">{t.rewardNeedsCoffee}</T>}
              </View>
              <Switch
                value={state.useReward}
                onValueChange={(v) => dispatch({ type: 'useReward', value: v })}
                trackColor={{ true: colors.salvia, false: colors.linea }}
              />
            </View>
          </Card>
        )}

        <View style={{ gap: space(2) }}>
          <T variant="label">{t.payHow}</T>
          <PayOption selected={method === 'barra'} title={t.payBar} hint={t.payBarHint} onPress={() => setMethod('barra')} />
          <PayOption selected={false} disabled title={t.payApp} hint={t.payAppSoon} onPress={() => {}} />
        </View>

        <TextInput
          placeholder={t.note}
          placeholderTextColor="#8b8b84"
          value={note}
          onChangeText={setNote}
          maxLength={140}
          style={styles.input}
        />

        <Card>
          <Row label={t.subtotal} value={money(totals.subtotal)} />
          {totals.discount > 0 && <Row label={t.discount} value={`−${money(totals.discount)}`} />}
          <Row label={t.total} value={money(totals.total)} bold />
        </Card>

        {!open && <T variant="small" style={{ textAlign: 'center' }}>{t.closedNoOrders}</T>}
      </ScrollView>
      <View style={styles.footer}>
        <Button title={`${t.placeOrder} · ${money(totals.total)}`} onPress={place} disabled={!open} />
      </View>
    </View>
  );
}

function PayOption({ selected, title, hint, onPress, disabled }: { selected: boolean; title: string; hint: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.pay, selected && styles.payOn, disabled && { opacity: 0.5 }]}>
      <View style={[styles.radio, selected && { backgroundColor: colors.salvia }]} />
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: fonts.semibold }}>{title}</T>
        <T variant="small">{hint}</T>
      </View>
    </Pressable>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const s = bold ? { fontFamily: fonts.bold, fontSize: 17 } : undefined;
  return (
    <View style={styles.sumRow}>
      <T style={s}>{label}</T>
      <T style={s}>{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), gap: space(4), paddingBottom: 140 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(4), backgroundColor: colors.hueso },
  line: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(3) },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.linea },
  qty: { flexDirection: 'row', gap: space(3) },
  qtyBtn: { fontFamily: fonts.bold, fontSize: 22, paddingHorizontal: 4 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  pay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    padding: space(4),
    borderRadius: radius.md,
    backgroundColor: colors.blanco,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  payOn: { borderColor: colors.negro },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.negro },
  input: {
    backgroundColor: colors.blanco,
    borderRadius: radius.md,
    padding: space(4),
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.negro,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  footer: { position: 'absolute', left: space(5), right: space(5), bottom: space(8) },
});
