import Spritesheet from "../../Wolfie2D/DataTypes/Spritesheet";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { BattlerEvent, ItemEvent } from "../Events";
import BasicBattler from "../GameSystems/BattleSystem/BasicBattler";
import Battler from "../GameSystems/BattleSystem/Battler";
import Inventory from "../GameSystems/ItemSystem/Inventory";
import HW3Item from "../GameSystems/ItemSystem/Item";
import BasicTargetable from "../GameSystems/Targeting/BasicTargetable";
import { TargetableEntity } from "../GameSystems/Targeting/TargetableEntity";
import { TargetingEntity } from "../GameSystems/Targeting/TargetingEntity";
import HW4Scene from "../Scenes/Levels/HW4Scene";


export default class PlayerActor extends AnimatedSprite implements Battler {

    /** Override the type of the scene to be the HW3 scene */
    protected scene: HW4Scene;
    public isInvicible: boolean;
    public bulletDamage: number = 1;

    /** Give the player a battler compoonent */
    protected battler: Battler;
    protected targetable: TargetableEntity;

    protected heldItem: HW3Item;

    public isDying: boolean = false;
    
    constructor(sheet: Spritesheet) {
        super(sheet);
        this.battler = new BasicBattler(this);
        this.targetable = new BasicTargetable(this);

        this.receiver.subscribe(ItemEvent.LASERGUN_FIRED);
    }

    get battlerActive(): boolean {
        return this.battler.battlerActive;
    }
    set battlerActive(value: boolean) {
        this.battler.battlerActive = value;
        this.visible = value;
    }
    
    public getTargeting(): TargetingEntity[] { return this.targetable.getTargeting(); }
    public addTargeting(targeting: TargetingEntity): void { this.targetable.addTargeting(targeting); }
    public removeTargeting(targeting: TargetingEntity): void { this.targetable.removeTargeting(targeting); }

    public override setScene(scene: HW4Scene): void { this.scene = scene; }
    public override getScene(): HW4Scene { return this.scene; }

    get battleGroup(): number {
        return this.battler.battleGroup;
    }
    set battleGroup(value: number) {
        this.battler.battleGroup = value;
    }
    get maxHealth(): number {
        return this.battler.maxHealth;
    }
    set maxHealth(value: number) {
        this.battler.maxHealth = value;
    }
    get energy(): number {
        return this.battler.energy;
    }
    set energy(value: number) {
        this.battler.energy = value;
    };

    get maxEnergy(): number {
        return this.battler.maxEnergy;
    }
    set maxEnergy(value: number) {
        this.battler.maxEnergy = value;
    }
    get health(): number {
        return this.battler.health;
    }
    set health(value: number) {
        this.battler.health = value;
        if (this.health <= 0) {
            this.emitter.fireEvent(BattlerEvent.BATTLER_KILLED, {id: this.id});
        }
    }
    get speed(): number {
        return this.battler.speed;
    }
    set speed(value: number) {
        this.battler.speed = value;
    }
    get inventory(): Inventory {
        return this.battler.inventory;
    }

    get invincible(): boolean {
        return this.battler.invincible;
    }
    set invincible(value: boolean) {
        this.battler.invincible = value;
    }

    get armor(): number {
        return this.battler.armor;
    }

    set armor(value: number) {
        this.battler.armor = value;
    }
}