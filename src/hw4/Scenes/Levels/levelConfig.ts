
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
      statMultiplier: .5,
      maxAmount: 5
    },
    LEVEL2: {
      zombieTypes: [ZombieType.Basic, ZombieType.Fast],
      zombieCount: 50,
      statMultiplier: 1,
      maxAmount: 10
    },
    LEVEL3: {
      zombieTypes: [ZombieType.Basic, ZombieType.Fast, ZombieType.Strong, ZombieType.Boss],
      zombieCount: 70,
      statMultiplier: 1.5,
      maxAmount: 15,
    },
    // Add more level configurations as needed
  };
  