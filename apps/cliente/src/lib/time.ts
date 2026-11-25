// Hora local de la cafetería (America/Mazatlan). Desde 2022 México ya no cambia
// de horario, así que Baja California Sur es UTC-7 todo el año.
const OFFSET_HOURS = -7;

/** Fecha y hora "de pared" en San José del Cabo, expresada en campos UTC. */
export function cafeClock(now: Date): Date {
  return new Date(now.getTime() + OFFSET_HOURS * 3600_000);
}

/** Día local (YYYY-MM-DD), igual que la columna stamps.local_day. */
export function localDay(now: Date): string {
  return cafeClock(now).toISOString().slice(0, 10);
}

// Horario: lun a vie 7 a 19, sáb 8 a 16, dom cerrado. Índice = día de la semana (0 = domingo).
export const HOURS: Array<[open: number, close: number] | null> = [
  null,
  [7, 19],
  [7, 19],
  [7, 19],
  [7, 19],
  [7, 19],
  [8, 16],
];

const hourOf = (c: Date) => c.getUTCHours() + c.getUTCMinutes() / 60;

export function isOpen(now: Date): boolean {
  const c = cafeClock(now);
  const h = HOURS[c.getUTCDay()];
  return !!h && hourOf(c) >= h[0] && hourOf(c) < h[1];
}

/** Próxima apertura, para mostrar "Abrimos mañana a las 7". */
export function nextOpening(now: Date): { weekday: number; hour: number; daysAhead: number } {
  const c = cafeClock(now);
  for (let d = 0; d < 8; d++) {
    const wd = (c.getUTCDay() + d) % 7;
    const h = HOURS[wd];
    if (!h) continue;
    if (d === 0 && hourOf(c) >= h[0]) continue;
    return { weekday: wd, hour: h[0], daysAhead: d };
  }
  return { weekday: 1, hour: 7, daysAhead: 1 };
}
