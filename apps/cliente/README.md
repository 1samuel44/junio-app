# Junio · app de clientes

App de iOS y Android (React Native + Expo SDK 58, TypeScript, Expo Router).

## Qué tiene (etapa 1)

- **Inicio:** horario y si está abierto ahora (hora de San José del Cabo), resumen de la tarjeta, Guest Beans.
- **Menú:** los 30 productos de `assets/marca/menu.csv`, por categoría, con leches y extras.
- **Producto:** elegir leche, extras y cantidad.
- **Carrito:** usar la bebida gratis (aplica a una bebida de café, con tamaño y extras), pagar en la barra, nota para la barra. Fuera de horario no deja enviar.
- **Pedido:** número corto y estado (recibido, preparando, listo, entregado).
- **Junio Rewards:** 7 sellos + la 8ª gratis, QR que cambia cada 60 s, reglas.
- **Perfil:** cambio de idioma español / inglés.

Por ahora todo es **de prueba**: los datos se guardan en el teléfono y hay botones de "Versión de prueba" para simular la barra. En la etapa 2 se conecta a Supabase (`supabase/esquema.sql`) y esos botones se quitan. Pagar en la app (Mercado Pago) llega en la etapa 3.

Las reglas de sellos y precios en `src/lib/` siguen las funciones del servidor (`award_stamp`, `create_order`), pero **el servidor siempre decide**.

## Probarla

```bash
cd apps/cliente
npm install
npx expo start        # escanea el QR con la app Expo Go en tu teléfono
npx expo start --web  # o ábrela en el navegador
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
| `src/data/menu.ts` | Menú de prueba con la misma forma que las tablas de Supabase |
| `src/lib/` | Reglas: sellos, precios, horario, textos ES/EN |
| `src/state/store.tsx` | Estado de la app (carrito, tarjeta, pedidos) |
| `src/theme.ts` | Colores y tipografía de la marca |

Tipografía: Archivo (Google Fonts) mientras se confirma la licencia de Owners Text.
