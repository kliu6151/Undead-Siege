
import { ZombieType } from "./zombieStats";

export interface LevelConfig {
    zombieTypes: ZombieType[];
    zombieCount: number;
    statMultiplier: number;
    maxAmount: number;
    // Add other level-specific properties here (e.g., number of zombies, spawn rate, etc.)
  }
  
  export const levelConfigs: Record<string, LevelConfig> = {
    LEVEL1: {
      zombieTypes: [ZombieType.Basic],
      zombieCount: 20,
      statMultiplier: 1,
      maxAmount: 5
    },
    LEVEL2: {
      zombieTypes: [ZombieType.Basic, ZombieType.Fast],
      zombieCount: 50,
      statMultiplier: 1.5,
      maxAmount: 15
    },
    LEVEL3: {
      zombieTypes: [ZombieType.Basic, ZombieType.Fast, ZombieType.Strong],
      zombieCount: 70,
      statMultiplier: 2,
      maxAmount: 30
    },
    // Add more level configurations as needed
  };
  