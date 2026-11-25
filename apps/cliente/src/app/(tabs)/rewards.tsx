import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StampCard } from '@/components/StampCard';
import { Button, Card, T } from '@/components/ui';
import { activeStamps, openRewards } from '@/lib/rewards';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme';

const QR_SECONDS = 60;

// En la etapa 2 el token viene de issue_qr_token() en Supabase y vence a los 60 s.
const demoToken = () =>
  Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

function useRotatingToken() {
  const [token, setToken] = useState(demoToken);
  const [left, setLeft] = useState(QR_SECONDS);
  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setToken(demoToken());
          return QR_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return { token, left };
}

export default function Rewards() {
  const { state, t, dispatch } = useStore();
  const { token, left } = useRotatingToken();
  const now = Date.now();
  const stamps = activeStamps(state.card, now);
  const rewards = openRewards(state.card, now);
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(state.lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <T variant="display">Junio Rewards</T>

        <Card style={{ gap: space(4) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T variant="label">{t.yourCard}</T>
            <T variant="small">{t.stampsOf(stamps)}</T>
          </View>
          <StampCard filled={stamps} freeLabel={t.free} />
          <T style={{ textAlign: 'center' }}>{t.stampsLeft(7 - stamps)}</T>
        </Card>

        {rewards.map((r) => (
          <Card key={r.id} tone="negro">
            <T variant="title" style={{ color: colors.crema }}>
              {t.freeDrinkReady}
            </T>
            <T variant="small" style={{ color: colors.salviaClaro }}>
              {t.coffeeOnly} · {t.freeDrinkExpires(fmt(r.expiresAt))}
            </T>
          </Card>
        ))}

        <Card tone="salviaClaro" style={{ alignItems: 'center', gap: space(3) }}>
          <T style={{ textAlign: 'center' }}>{t.showAtBar}</T>
          <View style={styles.qr}>
            <QRCode value={`junio:${token}`} size={180} color={colors.negro} backgroundColor={colors.blanco} />
          </View>
          <T variant="small">{t.qrRefresh(left)}</T>
        </Card>

        <View style={{ gap: space(2) }}>
          <T variant="label">{t.rules}</T>
          {t.rulesList.map((r) => (
            <T key={r}>• {r}</T>
          ))}
        </View>

        <Card tone="crema" style={{ gap: space(2) }}>
          <T variant="label">{t.demo}</T>
          <T variant="small">{t.demoHint}</T>
          <Button title={t.demoStamp} kind="ghost" onPress={() => dispatch({ type: 'scan', now: Date.now() })} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.hueso },
  content: { padding: space(5), gap: space(5) },
  qr: { backgroundColor: colors.blanco, padding: space(3), borderRadius: 16 },
});
