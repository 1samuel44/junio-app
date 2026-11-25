import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Logo, T } from '@/components/ui';
import type { Lang } from '@/lib/i18n';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space } from '@/theme';

export default function Profile() {
  const { state, t, dispatch } = useStore();
  const langs: Array<[Lang, string]> = [
    ['es', 'Español'],
    ['en', 'English'],
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <T variant="display">{t.profile}</T>

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space(4) }}>
          <Logo size={48} tone="oliva" />
          <View style={{ flex: 1 }}>
            <T variant="title">{t.guest}</T>
            <T variant="small">{t.signInSoon}</T>
          </View>
        </Card>

        <View style={{ gap: space(2) }}>
          <T variant="label">{t.language}</T>
          <View style={styles.segment}>
            {langs.map(([code, label]) => (
              <Pressable
                key={code}
                onPress={() => dispatch({ type: 'lang', lang: code })}
                style={[styles.seg, state.lang === code && styles.segOn]}
              >
                <T style={[{ fontFamily: fonts.semibold }, state.lang === code && { color: colors.hueso }]}>{label}</T>
              </Pressable>
            ))}
          </View>
        </View>

        <Card tone="salviaClaro" style={{ gap: 4 }}>
          <T style={{ fontFamily: fonts.bold }}>Junio y Café</T>
          <T variant="small">{t.address}</T>
          <T variant="small">{t.hours}</T>
          <Pressable onPress={() => Linking.openURL('https://www.instagram.com/junioycafe/')}>
            <T variant="small" style={{ textDecorationLine: 'underline' }}>
              {t.instagram}
            </T>
          </Pressable>
        </Card>

        <Card tone="crema" style={{ gap: space(2) }}>
          <T variant="label">{t.demo}</T>
          <Button title={t.demoReset} kind="ghost" onPress={() => dispatch({ type: 'reset' })} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.hueso },
  content: { padding: space(5), gap: space(5) },
  segment: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.negro, borderRadius: radius.pill, padding: 3 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.pill },
  segOn: { backgroundColor: colors.negro },
});
