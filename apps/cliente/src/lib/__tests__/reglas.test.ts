import { items, optionsFor } from '@/data/menu';
import { cartTotals, defaultOptionIds } from '@/lib/pricing';
import { activeStamps, awardStamp, emptyCard, openRewards, REWARD_EXPIRY_MS, STAMP_EXPIRY_MS } from '@/lib/rewards';
import { isOpen, localDay, nextOpening } from '@/lib/time';
import { _initialStateForTests as initial, _reducerForTests as reducer } from '@/state/store';

const DAY = 86_400_000;
// Martes 25 nov 2026, 10:00 en San José del Cabo (17:00 UTC)
const T0 = Date.UTC(2026, 10, 25, 17, 0);

const id = (name: string) => items.find((i) => i.name_es === name)!.id;

describe('Junio Rewards', () => {
  test('sello de bienvenida y uno de compra el mismo día', () => {
    let c = awardStamp(emptyCard(), 'bienvenida', T0).card;
    const r = awardStamp(c, 'pedido', T0 + 1000);
    expect(r.result).toBe('otorgado');
    c = r.card;
    expect(activeStamps(c, T0)).toBe(2);
  });

  test('máximo 1 sello de compra por día', () => {
    const c = awardStamp(emptyCard(), 'pedido', T0).card;
    expect(awardStamp(c, 'escaneo', T0 + 3600_000).result).toBe('ya_hoy');
    expect(awardStamp(c, 'pedido', T0 + DAY).result).toBe('otorgado');
  });

  test('el día cambia a medianoche de San José del Cabo, no de UTC', () => {
    // 23:30 local del 25 = 06:30 UTC del 26
    expect(localDay(new Date(Date.UTC(2026, 10, 26, 6, 30)))).toBe('2026-11-25');
  });

  test('7 sellos dan una bebida gratis y la tarjeta vuelve a 0', () => {
    let c = awardStamp(emptyCard(), 'bienvenida', T0).card;
    let last;
    for (let d = 0; d < 6; d++) {
      last = awardStamp(c, 'pedido', T0 + d * DAY);
      c = last.card;
    }
    expect(last!.result).toBe('recompensa');
    expect(activeStamps(c, T0 + 6 * DAY)).toBe(0);
    expect(openRewards(c, T0 + 6 * DAY)).toHaveLength(1);
    expect(openRewards(c, T0 + 5 * DAY + REWARD_EXPIRY_MS + DAY)).toHaveLength(0);
  });

  test('los sellos vencen a los 6 meses sin visita', () => {
    const c = awardStamp(awardStamp(emptyCard(), 'bienvenida', T0).card, 'pedido', T0).card;
    expect(activeStamps(c, T0 + STAMP_EXPIRY_MS - DAY)).toBe(2);
    expect(activeStamps(c, T0 + STAMP_EXPIRY_MS + DAY)).toBe(0);
    const later = awardStamp(c, 'pedido', T0 + STAMP_EXPIRY_MS + DAY).card;
    expect(activeStamps(later, T0 + STAMP_EXPIRY_MS + DAY)).toBe(1);
  });
});

describe('Precios del carrito', () => {
  const latte = id('Latte');

  test('opciones suman al precio', () => {
    const avena = optionsFor(latte).find((o) => o.name_es === 'Leche de avena')!.id;
    const shot = optionsFor(latte).find((o) => o.name_es === 'Shot de espresso')!.id;
    expect(cartTotals([{ key: 'a', itemId: latte, optionIds: defaultOptionIds(latte), qty: 2 }], false).subtotal).toBe(160);
    expect(cartTotals([{ key: 'a', itemId: latte, optionIds: [avena, shot], qty: 1 }], false).subtotal).toBe(120);
    // con la bebida gratis, la leche y el shot también van gratis
    expect(cartTotals([{ key: 'a', itemId: latte, optionIds: [avena, shot], qty: 1 }], true).total).toBe(0);
  });

  test('la bebida gratis aplica a una unidad de café con sus extras', () => {
    const bagel = id('Bagel clásico');
    const matcha = id('Matcha');
    const lines = [
      { key: 'a', itemId: bagel, optionIds: [], qty: 1 },
      { key: 'b', itemId: matcha, optionIds: [], qty: 1 },
      { key: 'c', itemId: latte, optionIds: [], qty: 2 },
    ];
    const t = cartTotals(lines, true);
    expect(t.rewardLine).toBe(2);
    expect(t.discount).toBe(80);
    expect(t.total).toBe(135 + 100 + 160 - 80);
  });

  test('sin bebida de café no hay descuento', () => {
    const t = cartTotals([{ key: 'a', itemId: id('Chai'), optionIds: [], qty: 1 }], true);
    expect(t.rewardLine).toBe(-1);
    expect(t.discount).toBe(0);
  });
});

describe('Horario', () => {
  test('abierto y cerrado', () => {
    expect(isOpen(new Date(T0))).toBe(true); // martes 10:00
    expect(isOpen(new Date(Date.UTC(2026, 10, 26, 3, 0)))).toBe(false); // martes 20:00
    expect(isOpen(new Date(Date.UTC(2026, 10, 29, 17, 0)))).toBe(false); // domingo
    expect(isOpen(new Date(Date.UTC(2026, 10, 28, 22, 30)))).toBe(true); // sábado 15:30
    expect(isOpen(new Date(Date.UTC(2026, 10, 28, 23, 30)))).toBe(false); // sábado 16:30
  });

  test('sábado en la tarde abre el lunes a las 7', () => {
    expect(nextOpening(new Date(Date.UTC(2026, 10, 28, 23, 30)))).toEqual({ weekday: 1, hour: 7, daysAhead: 2 });
  });
});

describe('Pedidos (versión de prueba)', () => {
  test('pedido en barra: sello al cobrar, no al pedir', () => {
    let s = initial();
    s = reducer(s, { type: 'add', line: { itemId: latte(), optionIds: [], qty: 1 } });
    s = reducer(s, { type: 'place', method: 'barra', note: '', now: T0 });
    const order = s.orders[0];
    expect(order.status).toBe('recibido');
    expect(order.isPaid).toBe(false);
    const before = s.card.stamps.length;
    for (let i = 0; i < 3; i++) s = reducer(s, { type: 'advance', orderId: order.id, now: T0 });
    expect(s.orders[0].status).toBe('entregado');
    expect(s.orders[0].isPaid).toBe(true);
    expect(s.card.stamps.length).toBe(before + 1);
    expect(s.cart).toHaveLength(0);
  });

  function latte() {
    return id('Latte');
  }
});
