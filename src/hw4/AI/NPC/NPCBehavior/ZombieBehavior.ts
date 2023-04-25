import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import Idle from "../NPCActions/GotoAction";
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
import { TargetExists } from "../NPCStatuses/TargetExists";
import { HasItem } from "../NPCStatuses/HasItem";
import FalseStatus from "../NPCStatuses/FalseStatus";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import GoapAction from "../../../../Wolfie2D/AI/Goap/GoapAction";
import GoapState from "../../../../Wolfie2D/AI/Goap/GoapState";
import Battler from "../../../GameSystems/BattleSystem/Battler";
import ZombieHitPlayer from "../NPCActions/ZombieHitPlayer";
import PlayerActor from "../../../Actors/PlayerActor";

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

    // A status checking if there are any enemies at target the zombie is attacking
    let enemyBattlerFinder = new BasicFinder<Battler>(
      null,
      BattlerActiveFilter(),
      EnemyFilter(this.owner),
      RangeFilter(this.owner, this.target, 0, this.range * this.range)
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
    // An action for attacking the target
    let attack = new ZombieHitPlayer(this, this.owner);
        attack.targets = [this.target];
        attack.targetFinder = new BasicFinder<Battler>(
          ClosestPositioned(this.owner),
          BattlerActiveFilter(),
          EnemyFilter(this.owner),
          RangeFilter(this.owner, this.target, 0, this.range * this.range)
        );
        attack.addPrecondition(ZombieStatuses.PLAYER_IN_ZOMBIE_POSITION);
        attack.addEffect(ZombieStatuses.GOAL);
        attack.cost = 1;
    this.addState(ZombieActions.ATTACK_PLAYER, attack);

    // An action for moving towards the target
    let moveTowards = new Idle(this, this.owner);
        moveTowards.targets = [this.target];
        moveTowards.targetFinder = new BasicFinder();
        moveTowards.addEffect(ZombieStatuses.GOAL);
        moveTowards.cost = 1000;
    this.addState(ZombieActions.MOVE_TOWARDS_PLAYER, moveTowards);
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

export type ZombieStatus = (typeof ZombieStatuses)[keyof typeof ZombieStatuses];
export const ZombieStatuses = {
  ATTACK_PLAYER: "attack-player",
  PLAYER_IN_ZOMBIE_POSITION: "player-at-zombie-position",
  GOAL: "goal",
} as const;

export type ZombieAction = (typeof ZombieActions)[keyof typeof ZombieActions];
export const ZombieActions = {
  ATTACK_PLAYER: "attack-player",
  CHASE_PLAYER: "chase-player",
  MOVE_TOWARDS_PLAYER: "move-towards-player",
} as const;
