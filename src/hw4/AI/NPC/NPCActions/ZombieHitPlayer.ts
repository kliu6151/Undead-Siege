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
import { BattlerEvent, ItemEvent } from "../../../Events";
import Timer from "../../../../Wolfie2D/Timing/Timer";
import PlayerActor from "../../../Actors/PlayerActor";
import Battler from "../../../GameSystems/BattleSystem/Battler";
import { ZombieAnimationType } from "../NPCBehavior/ZombieBehavior";
import { GameEventType } from "../../../../Wolfie2D/Events/GameEventType";

export default class ZombieHitPlayer extends NPCAction {
  protected timer: Timer;

  public constructor(parent: NPCBehavior, actor: NPCActor) {
    super(parent, actor);
    this._target = null;
    this.timer = new Timer(2000);
  }

  public performAction(target: Battler): void {
    if(this.actor.health <= 0) {
      this.actor.animation.playIfNotAlready(ZombieAnimationType.DYING, false, BattlerEvent.BATTLER_KILLED, {id: this.actor.id});
  }
    this.actor.animation.playIfNotAlready(ZombieAnimationType.ATTACK, true)
    if (this.timer.isStopped() && target.invincible !== true) {
      // Send a laser fired event
      let targetArmor = target.armor;
      if (targetArmor > 5) {
        target.health -= 0;
      }
      else {
        target.health -= 5 - targetArmor;
      }

      if(target instanceof PlayerActor) {
        this.emitter.fireEvent(GameEventType.PLAY_MUSIC, {key: this.actor.getScene().getPlayerDamagedAudioKey(), loop:false})
      }
      else {
        this.emitter.fireEvent(GameEventType.PLAY_MUSIC, {key: this.actor.getScene().getHelicopterDamagedAudioKey(), loop:false})
      }

      // console.log("I AM: " , this.actor);
      // console.log("TARGET IS: ", target)
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
