import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Pill, T } from '@/components/ui';
import { money } from '@/lib/pricing';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space } from '@/theme';

export default function Orders() {
  const { state, t } = useStore();
  const fmt = (ms: number) =>
    new Date(ms).toLocaleString(state.lang === 'es' ? 'es-MX' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <T variant="display" style={{ paddingHorizontal: space(5), paddingTop: space(3) }}>
        {t.tabs.orders}
      </T>
      <FlatList
        data={state.orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: space(5), gap: space(3), flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <T variant="title">{t.noOrders}</T>
            <Button title={t.orderNow} kind="ghost" onPress={() => router.navigate('/menu')} />
          </View>
        }
        renderItem={({ item: o }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/pedido/[id]', params: { id: String(o.number) } })}
            style={styles.row}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <T style={{ fontFamily: fonts.bold }}>{t.orderNumber(o.number)}</T>
              <T variant="small">{fmt(o.createdAt)}</T>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Pill label={t.status[o.status]} tone={o.status === 'listo' ? 'salvia' : 'salviaClaro'} />
              <T>{money(o.totals.total)}</T>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.hueso },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(4) },
  row: { flexDirection: 'row', backgroundColor: colors.blanco, borderRadius: radius.md, padding: space(4) },
});
