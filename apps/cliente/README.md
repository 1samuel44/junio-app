# Junio · app de clientes

App de iOS y Android (React Native + Expo SDK 58, TypeScript, Expo Router).

## Qué tiene

- **Entrar:** con un código de 6 dígitos por correo, sin contraseñas. La cuenta nueva gana el sello de bienvenida.
- **Inicio:** si está abierto ahora (hora de San José del Cabo), tu tarjeta y el Guest Beans del mes.
- **Menú:** viene de Supabase (lo que edite el dueño). Lo agotado sale del carrito solo.
- **Producto:** leche, extras y cantidad.
- **Carrito:** usar la bebida gratis (una bebida de café, tamaño y extras incluidos), pagar en la barra, nota para la barra. Fuera de horario no deja enviar.
- **Pedido:** número corto y estado, que se actualiza en tiempo real cuando la barra lo mueve.
- **Junio Rewards:** 7 sellos + la 8ª gratis, QR de un solo uso que cambia cada 60 s (la barra lo escanea para dar el sello).
- **Perfil:** español / inglés, cerrar sesión.

**Pagar en la app (Mercado Pago Checkout Pro):** la app crea el pedido y llama a la función `mp-crear-pago`, que cobra el total calculado en el servidor. El cliente paga en la página de Mercado Pago y regresa a la app. El pedido se marca pagado (y da el sello) solo cuando Mercado Pago avisa a `mp-webhook` y el pago se verifica con su API. Las funciones están en `supabase/functions/` y se publican al unir a `main`. Necesitan el secreto `MP_ACCESS_TOKEN` en Supabase (Edge Functions → Secrets).

**El servidor decide todo:** precios, sellos y recompensas los calculan las funciones de `supabase/migrations/` (`create_order`, `award_stamp`, `scan_qr`, `issue_qr_token`). La app solo muestra.

### Versión de prueba

Con `EXPO_PUBLIC_DEMO=1` la app no usa Supabase: guarda todo en el teléfono y muestra botones para simular la barra. Sirve para probar la interfaz sin internet.

## Probarla

```bash
cd apps/cliente
npm install
npx expo start        # escanea el QR con la app Expo Go en tu teléfono
npx expo start --web  # o ábrela en el navegador
EXPO_PUBLIC_DEMO=1 npx expo start   # versión de prueba, sin Supabase
```

## Revisiones

```bash
npm test              # reglas de sellos, precios, horario y pedidos
npm run typecheck
```

## Estructura

| Carpeta | Qué hay |
|---|---|
| `src/app/` | Pantallas (cada archivo es una ruta de Expo Router) |
| `src/components/` | Piezas de interfaz: botones, tarjeta de sellos, avisos |
| `src/data/menu.ts` | Menú local (versión de prueba y origen del menú inicial en Supabase) |
| `src/lib/api.ts` | Llamadas a Supabase |
| `src/lib/config.ts` | URL y publishable key de Supabase (públicas) |
| `src/lib/` | Reglas: sellos, precios, horario, textos ES/EN |
| `src/state/store.tsx` | Estado de la app: carrito, sesión, tarjeta y pedidos en tiempo real |
| `src/theme.ts` | Colores y tipografía de la marca |

Tipografía: Archivo (Google Fonts) mientras se confirma la licencia de Owners Text.
