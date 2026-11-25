# Junio

App de Junio y Café (San José del Cabo) para iOS y Android: menú, pedidos para recoger, pago en la app o en la barra, y la tarjeta de lealtad **Junio Rewards**.

> Verano todo el año.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `apps/cliente/` | App para clientes (React Native + Expo, TypeScript). Ver `apps/cliente/README.md`. |
| `apps/panel/` | Panel del dueño y "modo barra" para baristas (Next.js). *Por crear en la fase 4.* |
| `supabase/esquema.sql` | Esquema de base de datos con las reglas de lealtad aplicadas en el servidor. |
| `supabase/tests/` | Pruebas de las reglas (probadas en Postgres 16). |
| `docs/diseno/junio-prototipo.html` | Prototipo clicable de la fase 2. |
| `assets/marca/` | Logos (SVG/PNG), páginas del menú y `menu.csv` (33 productos). |

## Tecnología

- **App de clientes:** React Native + Expo (TypeScript). Una sola app en las tiendas.
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage). Zona horaria `America/Mazatlan`.
- **Panel y modo barra:** Next.js (web).
- **Pagos:** Mercado Pago Checkout Pro + webhook. Un pedido cuenta como pagado solo cuando el webhook lo confirma.
- **POS:** Square (integración posterior).
- **Notificaciones:** Expo Push.

## Reglas de Junio Rewards

- 1 sello por compra (no por bebida), máximo 1 sello al día. Todas las bebidas suman.
- 7 sellos = la 8ª bebida gratis. La bebida gratis tiene que ser de café, cualquier tamaño, sin cobrar extras.
- Sello de bienvenida al registrarse.
- Los sellos vencen 6 meses después de la última visita; la bebida gratis, a los 60 días.

## Marca

Negro `#1D1D1B`, hueso `#F1EDE6`, verde salvia `#9AA98F`, más crema y salvia claro. Tipografía: Owners Text (licencia para app por confirmar; respaldo: Archivo condensada).

## Horario

Lun a vie 7:00 a 19:00 · Sáb 8:00 a 16:00 · Dom cerrado.

## Documentos

- Fase 1, definición: https://claude.ai/artifact/KbybMQU1sc6zdFsahi6y9t
- Fase 2, prototipo: https://claude.ai/artifact/BhvwWdXE9nHSpkGjidaGAw
- Fase 3, arquitectura: https://claude.ai/artifact/X9Wru9YB8bQiL4tycx2qkd
