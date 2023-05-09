import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import { GameEventType } from "../../../../Wolfie2D/Events/GameEventType";
import { BattlerEvent } from "../../../Events";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import { ZombieAnimationType } from "../NPCBehavior/ZombieBehavior";
import NPCAction from "./NPCAction";

/**
 * An Idle action for the NPCGoapAI. Basically a default action for all of the NPCs
 * to do nothing.
 */
export default class IdleAction extends NPCAction {

    public performAction(target: TargetableEntity): void {
        if(this.actor.health <= 0) {
            this.actor.animation.playIfNotAlready(ZombieAnimationType.DYING, false, BattlerEvent.BATTLER_KILLED, {id: this.actor.id});
        }

        this.finished();
    }

    public handleInput(event: GameEvent): void {
        switch(event.type) {
            default: {
                super.handleInput(event);
                break;
            }
        }
    }
    
}