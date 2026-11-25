import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { LineSummary } from '@/components/LineSummary';
import { Button, Card, T } from '@/components/ui';
import { money } from '@/lib/pricing';
import { useStore, type OrderStatus } from '@/state/store';
import { colors, fonts, space } from '@/theme';

const STEPS: OrderStatus[] = ['recibido', 'preparando', 'listo', 'entregado'];

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, t, dispatch, live, payOrder } = useStore();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const order = state.orders.find((o) => o.id === id);
  if (!order) return null;
  const awaitingPayment = live && order.method === 'app' && order.status === 'esperando_pago';
  const pay = async () => {
    setPaying(true);
    setPayError('');
    try {
      await payOrder(order.id);
    } catch (e) {
      setPayError(t.payError(e instanceof Error ? e.message : String(e)));
    } finally {
      setPaying(false);
    }
  };
  const step = STEPS.indexOf(order.status);

  return (
    <ScrollView style={{ backgroundColor: colors.hueso }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t.orderNumber(order.number) }} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <T variant="label">{t.orderNumber(order.number)}</T>
        <T variant="display" style={{ textAlign: 'center' }}>
          {t.status[order.status]}
        </T>
        {!!t.statusHint[order.status] && <T>{t.statusHint[order.status]}</T>}
        {order.method === 'barra' && !order.isPaid && (
          <T variant="small" style={{ color: colors.alerta }}>
            {t.payAtBarReminder}
          </T>
        )}
      </View>

      {awaitingPayment && (
        <Card tone="crema" style={{ gap: space(3) }}>
          <T style={{ textAlign: 'center' }}>{t.payPending}</T>
          {paying ? (
            <ActivityIndicator color={colors.negro} />
          ) : (
            <Button title={t.payNow(money(order.totals.total))} onPress={pay} />
          )}
          {!!payError && (
            <T variant="small" style={{ textAlign: 'center', color: colors.alerta }}>
              {payError}
            </T>
          )}
        </Card>
      )}

      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={[styles.bar, i <= step && { backgroundColor: colors.salvia }]} />
            <T variant="small" style={[{ textAlign: 'center' }, i === step && { fontFamily: fonts.semibold, color: colors.negro }]}>
              {t.status[s]}
            </T>
          </View>
        ))}
      </View>

      <Card>
        {order.lines.map((l, i) => (
          <View key={l.key} style={{ paddingVertical: space(2) }}>
            <LineSummary menu={state.menu} line={l} lang={state.lang} isReward={i === order.totals.rewardLine && !!order.rewardId} freeLabel={t.free} />
          </View>
        ))}
        {order.totals.discount > 0 && (
          <View style={styles.sum}>
            <T>{t.discount}</T>
            <T>−{money(order.totals.discount)}</T>
          </View>
        )}
        <View style={styles.sum}>
          <T style={{ fontFamily: fonts.bold }}>{t.total}</T>
          <T style={{ fontFamily: fonts.bold }}>{money(order.totals.total)}</T>
        </View>
        {!!order.note && <T variant="small">“{order.note}”</T>}
      </Card>

      {!live && order.status !== 'entregado' && (
        <Card tone="crema" style={{ gap: space(2) }}>
          <T variant="label">{t.demo}</T>
          <T variant="small">{t.demoHint}</T>
          <Button title={t.demoAdvance} kind="ghost" onPress={() => dispatch({ type: 'advance', orderId: order.id, now: Date.now() })} />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), gap: space(5) },
  steps: { flexDirection: 'row', gap: 6 },
  bar: { height: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: colors.linea },
  sum: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: space(2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.linea,
  },
});
