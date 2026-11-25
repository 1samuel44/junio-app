import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StampCard } from '@/components/StampCard';
import * as api from '@/lib/api';
import { Button, Card, T } from '@/components/ui';
import { activeStamps, openRewards } from '@/lib/rewards';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme';

const QR_SECONDS = 60;

// Versión de prueba: token al azar. Con Supabase: issue_qr_token(), de un solo uso y vence a los 60 s.
const demoToken = async () =>
  Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

function useRotatingToken(live: boolean) {
  const [token, setToken] = useState<string | null>(null);
  const [left, setLeft] = useState(QR_SECONDS);
  useEffect(() => {
    let alive = true;
    const next = () =>
      (live ? api.issueQrToken() : demoToken())
        .then((tk) => alive && setToken(tk))
        .catch(() => alive && setToken(null));
    next();
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          next();
          return QR_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [live]);
  return { token, left };
}

export default function Rewards() {
  const { state, t, dispatch, live } = useStore();
  const { token, left } = useRotatingToken(live);
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
            {token ? (
              <QRCode value={`junio:${token}`} size={180} color={colors.negro} backgroundColor={colors.blanco} />
            ) : (
              <View style={{ width: 180, height: 180, alignItems: 'center', justifyContent: 'center' }}>
                <T variant="small">{t.qrLoading}</T>
              </View>
            )}
          </View>
          {token && <T variant="small">{t.qrRefresh(left)}</T>}
        </Card>

        <View style={{ gap: space(2) }}>
          <T variant="label">{t.rules}</T>
          {t.rulesList.map((r) => (
            <T key={r}>• {r}</T>
          ))}
        </View>

        {!live && (
          <Card tone="crema" style={{ gap: space(2) }}>
            <T variant="label">{t.demo}</T>
            <T variant="small">{t.demoHint}</T>
            <Button title={t.demoStamp} kind="ghost" onPress={() => dispatch({ type: 'scan', now: Date.now() })} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.hueso },
  content: { padding: space(5), gap: space(5) },
  qr: { backgroundColor: colors.blanco, padding: space(3), borderRadius: 16 },
});
