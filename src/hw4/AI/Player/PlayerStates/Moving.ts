import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import { PlayerAnimationType, PlayerStateType } from "./PlayerState";
import PlayerState from "./PlayerState";

export default class Moving extends PlayerState {
    
    public override onEnter(options: Record<string, any>): void {
        this.parent.owner.animation.playIfNotAlready(PlayerAnimationType.WALK, true);
    }

    public override handleInput(event: GameEvent): void { 
        switch(event.type) {
            default: {
                super.handleInput(event);
            }
        }
    }

    public override update(deltaT: number): void {
        super.update(deltaT);
        if (this.parent.controller.moveDir.equals(Vec2.ZERO)) {
            this.finished(PlayerStateType.IDLE);
        }
        if(this.parent.owner.health <= 0) {
            console.log("IN MOVING AND < 0 HP")
            this.finished(PlayerStateType.DEAD);
        }
    }

    public override onExit(): Record<string, any> { return {}; }
}