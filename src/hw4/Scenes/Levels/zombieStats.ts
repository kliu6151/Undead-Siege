
export enum ZombieType {
    Basic,
    Fast,
    Strong,
    Boss,
    Spit
}

export interface ZombieStats {
  health: number;
  maxHealth: number;
  speed: number;
  armor: number;
}

export const baseZombieStats: Record<ZombieType, ZombieStats> = {
  [ZombieType.Basic]: {
    health: 100,
    maxHealth: 100,
    speed: 8,
    armor: 0,
  },
  [ZombieType.Fast]: {
    health: 60,
    maxHealth: 60,
    speed: 12,
    armor: 0,
  },
  [ZombieType.Strong]: {
    health: 150,
    maxHealth: 150,
    speed: 4,
    armor: 2,
  },
  [ZombieType.Boss]: {
    health: 500,
    maxHealth: 500,
    speed: 4,
    armor: 2,
  },
  [ZombieType.Spit]: {
    health: 40,
    maxHealth: 40,
    speed: 2,
    armor: 0
  }
};

export function applyMultiplier(
  stats: ZombieStats,
  multiplier: number
): ZombieStats {
  return {
    health: stats.health * multiplier,
    maxHealth: stats.maxHealth * multiplier,
    speed: stats.speed * multiplier,
    armor: stats.armor * multiplier,
  };
}
