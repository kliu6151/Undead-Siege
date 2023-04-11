import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import Idle from "../NPCActions/GotoAction";
import ShootLaserGun from "../NPCActions/ShootLaserGun";
import BasicFinder from "../../../GameSystems/Searching/BasicFinder";
import {
  BattlerActiveFilter,
  EnemyFilter,
  ItemFilter,
  RangeFilter,
  VisibleItemFilter,
} from "../../../GameSystems/Searching/HW4Filters";
import Item from "../../../GameSystems/ItemSystem/Item";
import PickupItem from "../NPCActions/PickupItem";
import { ClosestPositioned } from "../../../GameSystems/Searching/HW4Reducers";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import LaserGun from "../../../GameSystems/ItemSystem/Items/LaserGun";
import { TargetExists } from "../NPCStatuses/TargetExists";
import { HasItem } from "../NPCStatuses/HasItem";
import FalseStatus from "../NPCStatuses/FalseStatus";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import GoapAction from "../../../../Wolfie2D/AI/Goap/GoapAction";
import GoapState from "../../../../Wolfie2D/AI/Goap/GoapState";
import Battler from "../../../GameSystems/BattleSystem/Battler";

export default class ZombieBehavior extends NPCBehavior {
  /** The target the guard should guard */
  protected target: TargetableEntity;
  /** The range the guard should be from the target they're guarding to be considered guarding the target */
  protected range: number;

  /** Initialize the NPC AI */
  public initializeAI(owner: NPCActor, options: ZombieOptions): void {
    super.initializeAI(owner, options);

    // Initialize the targetable entity the guard should try to protect and the range to the target
    this.target = options.target;
    this.range = options.range;

    // Initialize zombie statuses
    this.initializeStatuses();
    // Initialize zombie actions
    this.initializeActions();
    // Set the zombies goal
    this.goal = ZombieStatuses.GOAL; // Initialize the zombie behavior
    this.initialize();
  }

  public handleEvent(event: GameEvent): void {
    switch (event.type) {
      default: {
        super.handleEvent(event);
        break;
      }
    }
  }

  public update(deltaT: number): void {
    super.update(deltaT);
  }

  protected initializeStatuses(): void {
    let scene = this.owner.getScene();

    // A status checking if there are any enemies at target the guard is guarding
    let enemyBattlerFinder = new BasicFinder<Battler>(
      null,
      BattlerActiveFilter(),
      EnemyFilter(this.owner),
      RangeFilter(this.target, 0, this.range * this.range)
    );
    let playerAtZombiePosition = new TargetExists(
      scene.getBattlers(),
      enemyBattlerFinder
    );
    this.addStatus(
      ZombieStatuses.PLAYER_IN_ZOMBIE_POSITION,
      playerAtZombiePosition
    );

    // Add the goal status
    this.addStatus(ZombieStatuses.GOAL, new FalseStatus());
  }

  protected initializeActions(): void {
    let scene = this.owner.getScene();

    // An action for shooting an enemy in the guards guard area
    let attackEnemy = new ShootLaserGun(this, this.owner);
    attackEnemy.targets = scene.getBattlers();
    attackEnemy.targetFinder = new BasicFinder<Battler>(
      ClosestPositioned(this.owner),
      BattlerActiveFilter(),
      EnemyFilter(this.owner),
      RangeFilter(this.target, 0, this.range * this.range)
    );
    //shootEnemy.addPrecondition(ZombieStatuses.HAS_WEAPON);
    attackEnemy.addPrecondition(ZombieStatuses.PLAYER_IN_ZOMBIE_POSITION);
    attackEnemy.addEffect(ZombieStatuses.GOAL);
    attackEnemy.cost = 1;
    this.addState(ZombieActions.ATTACK_PLAYER, attackEnemy);

    // An action for following the player's location
    let zombie = new Idle(this, this.owner);
    zombie.targets = [this.target];
    zombie.targetFinder = new BasicFinder();
    zombie.addEffect(ZombieStatuses.GOAL);
    zombie.cost = 1000;
    this.addState(ZombieActions.MOVE_PLAYER, zombie);
  }

  public override addState(stateName: ZombieAction, state: GoapAction): void {
    super.addState(stateName, state);
  }

  public override addStatus(statusName: ZombieStatus, status: GoapState): void {
    super.addStatus(statusName, status);
  }
}

export interface ZombieOptions {
  target: TargetableEntity;
  range: number;
}

export type ZombieStatus = typeof ZombieStatuses[keyof typeof ZombieStatuses];
export const ZombieStatuses = {
  PLAYER_IN_ZOMBIE_POSITION: "player-at-zombie-position",

  GOAL: "goal",
} as const;

export type ZombieAction = typeof ZombieActions[keyof typeof ZombieActions];
export const ZombieActions = {

  ATTACK_PLAYER: "attack-player",

  MOVE_PLAYER: "move-player",
} as const;
