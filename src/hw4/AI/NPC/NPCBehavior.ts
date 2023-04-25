import StateMachineGoapAI from "../../../Wolfie2D/AI/Goap/StateMachineGoapAI";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import Line from "../../../Wolfie2D/Nodes/Graphics/Line";
import Timer from "../../../Wolfie2D/Timing/Timer";
import NPCActor from "../../Actors/NPCActor";
import { ItemEvent } from "../../Events";
import MainHW4Scene from "../../Scenes/Levels/MainHW4Scene";
import NPCAction from "./NPCActions/NPCAction";


/**
 * An abstract implementation of behavior for an NPC. Each concrete implementation of the
 * NPCBehavior class should define some new behavior for an NPCActor. 
 */
export default abstract class NPCBehavior extends StateMachineGoapAI<NPCAction> {
  protected override owner: NPCActor;

  public initializeAI(owner: NPCActor, options: Record<string, any>): void {
    this.owner = owner;
    this.receiver.subscribe(ItemEvent.LASERGUN_FIRED);
    this.receiver.subscribe(ItemEvent.ZOMBIE_HIT_PLAYER);
  }

  public activate(options: Record<string, any>): void {}

  public update(deltaT: number): void {
    if ((<MainHW4Scene>this.owner.getScene()).isPaused) return;
    super.update(deltaT);
  }

  /**
   * @param event the game event
   */
  public handleEvent(event: GameEvent): void {
    switch (event.type) {
      case ItemEvent.LASERGUN_FIRED: {
        console.log("Catching and handling lasergun fired event!!!");
        this.handleLasergunFired(
          event.data.get("actorId"),
          event.data.get("to"),
          event.data.get("from")
        );
        break;
      }
      case ItemEvent.ZOMBIE_HIT_PLAYER: {
        console.log("Catching and handling zombie hit player event!!!");
        this.handleZombieHit(event.data.get("actorId"));
        break;
      }
      default: {
        super.handleEvent(event);
        break;
      }
    }
  }
  
  protected handleZombieHit(actorId: number): void {
    if (actorId !== this.owner.id) {
      this.owner.health -= 1;
    }
  }

  protected handleLasergunFired(actorId: number, to: Vec2, from: Vec2): void {
    if (actorId !== this.owner.id) {
      this.owner.health -= this.owner.collisionShape
        .getBoundingRect()
        .intersectSegment(to, from)
        ? 1
        : 0;
    }
  }
}