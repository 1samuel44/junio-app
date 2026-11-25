import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StampCard } from '@/components/StampCard';
import { Button, Card, Logo, Pill, T } from '@/components/ui';
import { guestBeans } from '@/data/menu';
import { pick } from '@/lib/i18n';
import { activeStamps, openRewards } from '@/lib/rewards';
import { isOpen, nextOpening } from '@/lib/time';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme';

export default function Home() {
  const { state, t } = useStore();
  const now = new Date();
  const open = isOpen(now);
  const next = nextOpening(now);
  const stamps = activeStamps(state.card, now.getTime());
  const rewards = openRewards(state.card, now.getTime()).length;
  const day = next.daysAhead === 0 ? t.today : next.daysAhead === 1 ? t.tomorrow : t.weekdays[next.weekday];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Logo size={72} />
          <View style={{ flex: 1 }}>
            <T variant="display">{t.slogan}</T>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: open ? colors.ok : colors.alerta }]} />
              <T variant="small">{open ? t.open : `${t.closed} · ${t.opensAt(day, next.hour)}`}</T>
            </View>
          </View>
        </View>

        <Pressable onPress={() => router.navigate('/rewards')}>
          <Card tone="negro">
            <View style={styles.cardTop}>
              <T variant="label" style={{ color: colors.crema }}>
                Junio Rewards
              </T>
              <T variant="small" style={{ color: colors.salviaClaro }}>
                {t.stampsOf(stamps)}
              </T>
            </View>
            <View style={styles.stampsBg}>
              <StampCard filled={stamps} freeLabel={t.free} compact />
            </View>
            <T style={{ color: colors.hueso, marginTop: space(3) }}>
              {rewards > 0 ? t.freeDrinkReady : t.stampsLeft(7 - stamps)}
            </T>
          </Card>
        </Pressable>

        <Button title={t.orderNow} onPress={() => router.navigate('/menu')} />

        <Card tone="salviaClaro">
          <Pill label={t.guestBeans} tone="hueso" />
          <T variant="title" style={{ marginTop: space(3) }}>
            {guestBeans.roaster}
          </T>
          <T variant="small">{guestBeans.origin}</T>
          <T style={{ marginTop: space(2) }}>{pick(guestBeans, 'notes', state.lang)}</T>
        </Card>

        <View style={{ alignItems: 'center', gap: 4, paddingVertical: space(4) }}>
          <T variant="small">{t.hours}</T>
          <T variant="small">{t.address}</T>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.hueso },
  content: { padding: space(5), gap: space(5) },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(4) },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space(4) },
  stampsBg: { backgroundColor: colors.hueso, borderRadius: 16, paddingVertical: space(4), paddingHorizontal: space(2) },
});
