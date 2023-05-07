import Updateable from "../../../Wolfie2D/DataTypes/Interfaces/Updateable";
import Scene from "../../../Wolfie2D/Scene/Scene";
import Color from "../../../Wolfie2D/Utils/Color";
import Label from "../../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Positioned from "../../../Wolfie2D/DataTypes/Interfaces/Positioned";
import Unique from "../../../Wolfie2D/DataTypes/Interfaces/Unique";

interface Energy {
    get energy(): number;
    get maxEnergy(): number;
}

interface EnergyBarOptions {
    size: Vec2;
    offset: Vec2;
}

/**
 * A UI component that's suppossed to represent a energyBar
 */
export default class EnergybarHUD implements Updateable {

    /** The scene and layer in the scene the energyBar is in */
    protected scene: Scene;
    protected layer: string;

    /** The GameNode that owns this energybar */
    protected owner: Energy & Positioned & Unique;

    /** The size and offset of the energybar from it's owner's position */
    protected size: Vec2;
    protected offset: Vec2;

    /** The actual energybar (the part with color) */
    protected energyBar: Label;
    /** The energybars' background (the part with the border) */
    protected energyBarBg: Label;

    public constructor(scene: Scene, owner: Energy & Positioned & Unique, layer: string, options: EnergyBarOptions) {
        this.scene = scene;
        this.layer = layer;
        this.owner = owner;

        this.size = options.size;
        this.offset = options.offset;

        this.energyBar = <Label>this.scene.add.uiElement(UIElementType.LABEL, layer, {position: this.owner.position.clone().add(this.offset), text: ""});
        this.energyBar.size.copy(this.size);
        this.energyBar.backgroundColor = Color.YELLOW;

        this.energyBarBg = <Label>this.scene.add.uiElement(UIElementType.LABEL, layer, {position: this.owner.position.clone().add(this.offset), text: ""});
        this.energyBarBg.backgroundColor = Color.TRANSPARENT;
        this.energyBarBg.borderColor = Color.BLACK;
        this.energyBarBg.borderWidth = 1;
        this.energyBarBg.size.copy(this.size);
    }

    /**
     * Updates the energyBars position according to the position of it's owner
     * @param deltaT 
     */
    public update(deltaT: number): void {
        this.energyBar.position.copy(this.owner.position).add(this.offset);
        this.energyBarBg.position.copy(this.owner.position).add(this.offset);
      
        let scale = this.scene.getViewScale();
        this.energyBar.scale.scale(scale);
        this.energyBarBg.scale.scale(scale);
      
        let unit = this.energyBarBg.size.x / this.owner.maxEnergy;
        this.energyBar.size.set(unit * this.owner.energy, this.energyBarBg.size.y);
        this.energyBar.position.set(this.energyBarBg.position.x, this.energyBarBg.position.y);
        this.energyBar.backgroundColor = Color.YELLOW;
      }
      

    get ownerId(): number { return this.owner.id; }

    set visible(visible: boolean) {
        this.energyBar.visible = visible;
        this.energyBarBg.visible = visible;
    }
    

}