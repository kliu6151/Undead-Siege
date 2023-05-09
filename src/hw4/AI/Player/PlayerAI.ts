import StateMachineAI from "../../../Wolfie2D/AI/StateMachineAI";
import AI from "../../../Wolfie2D/DataTypes/Interfaces/AI";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import Input from "../../../Wolfie2D/Input/Input";
import PlayerActor from "../../Actors/PlayerActor";
import { ItemEvent } from "../../Events";
import Inventory from "../../GameSystems/ItemSystem/Inventory";
import Item from "../../GameSystems/ItemSystem/Item";
import MainHW4Scene from "../../Scenes/Levels/MainHW4Scene";
import PlayerController, { PlayerInput } from "./PlayerController";
import {
  Idle,
  Invincible,
  Moving,
  Dead,
  PlayerStateType,
  PlayerAnimationType,
} from "./PlayerStates/PlayerState";
import PlayerWeapon from "./PlayerWeapon";

/**
 * The AI that controls the player. The players AI has been configured as a Finite State Machine (FSM)
 * with 4 states; Idle, Moving, Invincible, and Dead.
 */
export default class PlayerAI extends StateMachineAI implements AI {
  /** The GameNode that owns this AI */
  public owner: PlayerActor;
  /** A set of controls for the player */
  public controller: PlayerController;
  /** The inventory object associated with the player */
  public inventory: Inventory;
  /** The players held item */
  public item: Item | null;

  protected weapon: PlayerWeapon;

  public initializeAI(owner: PlayerActor, opts: Record<string, any>): void {
    this.owner = owner;
    this.controller = new PlayerController(owner);

    this.weapon = opts.weaponSystem;

    // Add the players states to it's StateMachine
    this.addState(PlayerStateType.IDLE, new Idle(this, this.owner));
    this.addState(PlayerStateType.INVINCIBLE, new Invincible(this, this.owner));
    this.addState(PlayerStateType.MOVING, new Moving(this, this.owner));
    this.addState(PlayerStateType.DEAD, new Dead(this, this.owner));

    // Initialize the players state to Idle
    this.initialize(PlayerStateType.IDLE);
  }

  public activate(options: Record<string, any>): void {}

  public update(deltaT: number): void {
    if ((<MainHW4Scene>this.owner.getScene()).isPaused) return;
    super.update(deltaT);
    if(!this.owner.isDying) {
    if (Input.isMouseJustPressed()) {
      let particles = this.weapon.getPool();
      for (let i = 0; i < particles.length; i++) {
        particles[i].active = true;
      }
      this.weapon.startSystem(500, 0, this.owner.position);
      this.emitter.fireEvent(GameEventType.PLAY_MUSIC, {key: this.owner.getScene().getPlayerShootAudioKey(), loop: false, holdReference: false})
      console.log("EMITTER: " ,this.emitter)
      this.owner.animation.play(PlayerAnimationType.ATTACK)
    }
    }
  }

  public destroy(): void {}

  public handleEvent(event: GameEvent): void {
    switch (event.type) {
      case ItemEvent.LASERGUN_FIRED: {
        this.handleLaserFiredEvent(
          event.data.get("actorId"),
          event.data.get("to"),
          event.data.get("from")
        );
        break;
      }
      default: {
        super.handleEvent(event);
        break;
      }
    }
  }

  protected handleLaserFiredEvent(actorId: number, to: Vec2, from: Vec2): void {
    if (this.owner.id !== actorId && this.owner.collisionShape !== undefined) {
      if (
        this.owner.collisionShape
          .getBoundingRect()
          .intersectSegment(to, from.clone().sub(to)) !== null
      ) {
        console.log("THE THINGS HP?: ", this.owner.health)
        this.owner.health -= this.owner.bulletDamage;
      }
    }
  }
}
