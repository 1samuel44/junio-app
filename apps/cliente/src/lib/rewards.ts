// Junio Rewards: misma lógica que award_stamp en supabase/esquema.sql.
// Desde la etapa 2 decide el servidor; aquí sirve para la versión de prueba.
import { localDay } from './time';

export const STAMPS_FOR_REWARD = 7;
const DAY = 86_400_000;
export const STAMP_EXPIRY_MS = 182 * DAY; // ~6 meses sin visita
export const REWARD_EXPIRY_MS = 60 * DAY;

export type StampSource = 'bienvenida' | 'pedido' | 'escaneo';

export interface Stamp {
  source: StampSource;
  createdAt: number;
  localDay: string;
}

export interface Reward {
  id: string;
  earnedAt: number;
  expiresAt: number;
  redeemedAt?: number;
}

export interface Card {
  stamps: Stamp[]; // sellos activos
  hadWelcome: boolean;
  lastStampDay?: string; // último día con sello de compra (límite 1 al día)
  rewards: Reward[];
}

export type AwardResult = 'otorgado' | 'ya_hoy' | 'recompensa';

export const emptyCard = (): Card => ({ stamps: [], hadWelcome: false, rewards: [] });

/** Sellos activos. Si pasaron 6 meses sin visita, la tarjeta vuelve a 0. */
export function activeStamps(card: Card, now: number): number {
  if (card.stamps.length === 0) return 0;
  const last = Math.max(...card.stamps.map((s) => s.createdAt));
  return now - last > STAMP_EXPIRY_MS ? 0 : card.stamps.length;
}

export function openRewards(card: Card, now: number): Reward[] {
  return card.rewards.filter((r) => !r.redeemedAt && r.expiresAt > now);
}

export function awardStamp(card: Card, source: StampSource, now: number): { card: Card; result: AwardResult } {
  const today = localDay(new Date(now));
  if (source === 'bienvenida' ? card.hadWelcome : card.lastStampDay === today) {
    return { card, result: 'ya_hoy' };
  }
  const kept = activeStamps(card, now) === 0 ? [] : card.stamps;
  const stamps = [...kept, { source, createdAt: now, localDay: today }];
  const next: Card = {
    ...card,
    stamps,
    hadWelcome: card.hadWelcome || source === 'bienvenida',
    lastStampDay: source === 'bienvenida' ? card.lastStampDay : today,
  };

  if (stamps.length >= STAMPS_FOR_REWARD) {
    const reward: Reward = { id: `r-${now}`, earnedAt: now, expiresAt: now + REWARD_EXPIRY_MS };
    return {
      card: { ...next, stamps: stamps.slice(STAMPS_FOR_REWARD), rewards: [...card.rewards, reward] },
      result: 'recompensa',
    };
  }
  return { card: next, result: 'otorgado' };
}

export function redeemReward(card: Card, rewardId: string, now: number): Card {
  return {
    ...card,
    rewards: card.rewards.map((r) => (r.id === rewardId ? { ...r, redeemedAt: now } : r)),
  };
}
