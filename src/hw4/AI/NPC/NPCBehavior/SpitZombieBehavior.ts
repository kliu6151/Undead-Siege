import ZombieBehavior, { ZombieOptions } from "./ZombieBehavior";
import SpitZombieAttack from "../NPCActions/SpitZombieAttack";
import { ZombieActions } from "./ZombieBehavior";
import { BattlerActiveFilter } from "../../../GameSystems/Searching/HW4Filters";
import { ClosestPositioned } from "../../../GameSystems/Searching/HW4Reducers";
import BasicFinder from "../../../GameSystems/Searching/BasicFinder";
import Battler from "../../../GameSystems/BattleSystem/Battler";
import { ZombieStatuses } from "./ZombieBehavior";

export default class SpitZombieBehavior extends ZombieBehavior {
  protected initializeActions(): void {
    // An action for spit zombies to attack the target
    let spitAttack = new SpitZombieAttack(this, this.owner);
    spitAttack.targets = [this.target];
    spitAttack.targetFinder = new BasicFinder<Battler>(
      ClosestPositioned(this.owner),
      BattlerActiveFilter()
    );
    new ZombieBehavior
    spitAttack.addPrecondition(ZombieStatuses.PLAYER_IN_ZOMBIE_POSITION);
    spitAttack.addEffect(ZombieStatuses.GOAL);
    spitAttack.cost = 1;
    this.addState(ZombieActions.SPIT_ATTACK_PLAYER, spitAttack);

    // Keep other actions from the parent class, such as moving towards the target
    super.initializeActions();
  }
}
