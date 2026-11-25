// Inicio de sesión con código por correo (Supabase Auth). Si el correo es nuevo, crea la cuenta
// y el servidor da el sello de bienvenida.
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Logo, T } from '@/components/ui';
import * as api from '@/lib/api';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space } from '@/theme';

export default function SignIn() {
  const { state, t, setLang } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const usedCode = useRef<string | null>(null);

  // Llegamos aquí desde el enlace del correo
  useEffect(() => {
    if (params.error_description) setError(t.login.error(String(params.error_description)));
    const code = params.code ? String(params.code) : '';
    if (!code || usedCode.current === code) return;
    usedCode.current = code;
    setBusy(true);
    api
      .signInFromLink(code)
      .catch((e) => setError(t.login.error(e instanceof Error ? e.message : String(e))))
      .finally(() => setBusy(false));
  }, [params.code, params.error_description, t]);

  if (state.userId) return <Redirect href="/" />;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(t.login.error(e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  const cleanEmail = email.trim().toLowerCase();
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: space(3) }}>
            <Logo size={110} />
            <T variant="display" style={{ textAlign: 'center' }}>
              {t.login.title}
            </T>
            <T style={{ textAlign: 'center' }}>{t.login.subtitle}</T>
          </View>

          {!sent ? (
            <View style={{ gap: space(3) }}>
              <TextInput
                placeholder={t.login.name}
                placeholderTextColor="#8b8b84"
                value={name}
                onChangeText={setName}
                autoComplete="name"
                style={styles.input}
              />
              <TextInput
                placeholder={t.login.email}
                placeholderTextColor="#8b8b84"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={styles.input}
              />
              <T variant="small" style={{ textAlign: 'center' }}>
                {t.login.welcome}
              </T>
              {busy ? (
                <ActivityIndicator color={colors.negro} size="large" />
              ) : (
                <Button
                  title={t.login.send}
                  disabled={!validEmail}
                  onPress={() =>
                    run(async () => {
                      await api.sendCode(cleanEmail, name.trim());
                      setSent(true);
                    })
                  }
                />
              )}
            </View>
          ) : (
            <View style={{ gap: space(3) }}>
              <T style={{ textAlign: 'center' }}>{t.login.codeSent(cleanEmail)}</T>
              <T variant="small" style={{ textAlign: 'center' }}>
                {t.login.orCode}
              </T>
              <TextInput
                placeholder={t.login.code}
                placeholderTextColor="#8b8b84"
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 8))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                style={[styles.input, styles.code]}
              />
              {busy ? (
                <ActivityIndicator color={colors.negro} size="large" />
              ) : (
                <>
                  <Button
                    title={t.login.verify}
                    disabled={code.length < 6}
                    onPress={() => run(() => api.verifyCode(cleanEmail, code))}
                  />
                  <Button
                    title={t.login.otherEmail}
                    kind="ghost"
                    onPress={() => {
                      setSent(false);
                      setCode('');
                    }}
                  />
                </>
              )}
            </View>
          )}

          {!!error && (
            <T variant="small" style={{ textAlign: 'center', color: colors.alerta }}>
              {error}
            </T>
          )}

          <View style={styles.langs}>
            <Button title="Español" kind={state.lang === 'es' ? 'secondary' : 'ghost'} onPress={() => setLang('es')} style={{ flex: 1 }} />
            <Button title="English" kind={state.lang === 'en' ? 'secondary' : 'ghost'} onPress={() => setLang('en')} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.hueso },
  content: { padding: space(6), gap: space(6), flexGrow: 1, justifyContent: 'center' },
  input: {
    backgroundColor: colors.blanco,
    borderRadius: radius.md,
    padding: space(4),
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.negro,
  },
  code: { fontFamily: fonts.bold, fontSize: 26, letterSpacing: 8, textAlign: 'center' },
  langs: { flexDirection: 'row', gap: space(3) },
});
