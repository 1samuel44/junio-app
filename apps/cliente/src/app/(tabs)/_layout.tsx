import Feather from '@expo/vector-icons/Feather';
import { Redirect, Tabs } from 'expo-router';

import { useStore } from '@/state/store';
import { colors, fonts } from '@/theme';

type IconName = React.ComponentProps<typeof Feather>['name'];
const icon =
  (name: IconName) =>
  ({ color, size }: { color: unknown; size: number }) => (
    <Feather name={name} color={typeof color === 'string' ? color : colors.negro} size={size} />
  );

export default function TabsLayout() {
  const { t, state, live } = useStore();
  const count = state.cart.reduce((n, l) => n + l.qty, 0);
  if (!state.authReady) return null;
  if (live && !state.userId) return <Redirect href="/entrar" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.negro,
        tabBarInactiveTintColor: '#8b8b84',
        tabBarStyle: { backgroundColor: colors.hueso, borderTopColor: colors.linea },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.hueso },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.home, tabBarIcon: icon('sun') }} />
      <Tabs.Screen
        name="menu"
        options={{
          title: t.tabs.menu,
          tabBarIcon: icon('coffee'),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.salvia, color: colors.negro },
        }}
      />
      <Tabs.Screen name="rewards" options={{ title: t.tabs.rewards, tabBarIcon: icon('award') }} />
      <Tabs.Screen name="pedidos" options={{ title: t.tabs.orders, tabBarIcon: icon('shopping-bag') }} />
      <Tabs.Screen name="perfil" options={{ title: t.tabs.profile, tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
