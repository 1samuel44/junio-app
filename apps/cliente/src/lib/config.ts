// Conexión a Supabase. La URL y la "publishable key" son públicas: van dentro de la app
// y la seguridad la ponen las reglas (RLS) del servidor. Nunca pongas aquí la secret key.
//
// Se pueden cambiar sin tocar el código con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_KEY.
// Si no hay key (o con EXPO_PUBLIC_DEMO=1), la app corre en "versión de prueba" con datos guardados en el teléfono.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://frjrbzpunnzbmzhnpslt.supabase.co';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_j92iZGi_0FowC8A4Jjya-Q_SNA0sd9h';

// EXPO_PUBLIC_DEMO=1 fuerza la versión de prueba aunque haya key.
export const LIVE = SUPABASE_KEY.length > 0 && process.env.EXPO_PUBLIC_DEMO !== '1';
