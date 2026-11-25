jest.mock('@/lib/supabase', () => ({ supabase: null }));
jest.mock('expo-linking', () => ({ createURL: () => 'junio://entrar' }));
import { ts } from '@/lib/api';

test('lee fechas de Postgres con microsegundos', () => {
  expect(ts('2026-11-25T03:19:14.755019+00:00')).toBe(Date.UTC(2026, 10, 25, 3, 19, 14, 755));
  expect(ts('2026-11-25 04:12:16.827255+00')).toBe(Date.UTC(2026, 10, 25, 4, 12, 16, 827));
  expect(ts('2026-11-25T03:19:14+00:00')).toBe(Date.UTC(2026, 10, 25, 3, 19, 14));
});
