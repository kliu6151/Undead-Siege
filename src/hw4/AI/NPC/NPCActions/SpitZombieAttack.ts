// SpitZombieAttack.ts

import NPCAction from "./ZombieHitPlayer";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import PlayerActor from "../../../Actors/PlayerActor";
import NPCBehavior from "../NPCBehavior";
import NPCActor from "../../../Actors/NPCActor";

export default class SpitZombieAttack extends NPCAction {
    constructor(parent: NPCBehavior, actor: NPCActor) {
        super(parent, actor);
    }

    performAction(target: TargetableEntity): void {
        // Attack logic for SpitZombie

        // Replace this with the actual attack logic for the SpitZombie, e.g., shooting projectiles
        let particles = this.actor.weaponSystem.getPool();
        for (let i = 0; i < particles.length; i++) {
            particles[i].active = true;
        }
        this.actor.weaponSystem.startSystem(500, 0, this.actor.position);
    }
}
