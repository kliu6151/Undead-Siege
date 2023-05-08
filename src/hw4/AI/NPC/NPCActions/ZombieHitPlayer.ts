import { GoapActionStatus } from "../../../../Wolfie2D/DataTypes/Goap/GoapAction";
import AABB from "../../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import OrthogonalTilemap from "../../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import LaserGun from "../../../GameSystems/ItemSystem/Items/LaserGun";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import NPCAction from "./NPCAction";
import { ItemEvent } from "../../../Events";
import Timer from "../../../../Wolfie2D/Timing/Timer";
import PlayerActor from "../../../Actors/PlayerActor";
import Battler from "../../../GameSystems/BattleSystem/Battler";

export default class ZombieHitPlayer extends NPCAction {
  protected timer: Timer;

  public constructor(parent: NPCBehavior, actor: NPCActor) {
    super(parent, actor);
    this._target = null;
    this.timer = new Timer(2000);
  }

  public performAction(target: Battler): void {
    // this.timer.isStopped()
    //   ? console.log("Zombie Attack cooling down!")
    //   : console.log("Zombie Attack ready!");
    if (this.timer.isStopped() && target.invincible !== true) {
      // Send a laser fired event
      let targetArmor = target.armor;
      if (targetArmor > 5) {
        target.health -= 0;
      }
      else {
        target.health = 5 - targetArmor;
      }
      console.log("TARGET IS: ", target)

      this.timer.start();
    }
    // Finish the action
    this.finished();
  }

  public onEnter(options: Record<string, any>): void {
    super.onEnter(options);
  }

  public handleInput(event: GameEvent): void {
    switch (event.type) {
      default: {
        super.handleInput(event);
        break;
      }
    }
  }

  public update(deltaT: number): void {
    super.update(deltaT);
  }

  public onExit(): Record<string, any> {
    return super.onExit();
  }
}
