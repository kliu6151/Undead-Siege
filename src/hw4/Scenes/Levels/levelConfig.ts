
import { ZombieType } from "./zombieStats";

export interface LevelConfig {
    zombieTypes: ZombieType[];
    zombieCount: number;
    statMultiplier: number;
    // Add other level-specific properties here (e.g., number of zombies, spawn rate, etc.)
  }
  
  export const levelConfigs: Record<string, LevelConfig> = {
    LEVEL1: {
      zombieTypes: [ZombieType.Basic],
      zombieCount: 20,
      statMultiplier: 1,
    },
    LEVEL2: {
      zombieTypes: [ZombieType.Basic, ZombieType.Fast],
      zombieCount: 50,
      statMultiplier: 1.5
    },
    LEVEL3: {
      zombieTypes: [ZombieType.Basic, ZombieType.Fast, ZombieType.Strong],
      zombieCount: 70,
      statMultiplier: 2
    },
    // Add more level configurations as needed
  };
  