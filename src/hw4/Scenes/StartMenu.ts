import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Layer from "../../Wolfie2D/Scene/Layer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import MainMenu from "./MainMenu";
import ResourceManager from "../../Wolfie2D/ResourceManager/ResourceManager";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import HW4Scene from "./HW4Scene";


export default class StartMenu extends Scene {
    // Layers, for multiple main menu screens
    private startMenu: Layer;
    private start: Layer;
    private bgLayer: Layer;

    public static BACKGROUND_KEY = "BACKGROUND"
    public static BACKGROUND_PATH = "assets/sprites/background.jpg"

    private background: Sprite;


    public loadScene(){
        this.load.image(StartMenu.BACKGROUND_KEY, StartMenu.BACKGROUND_PATH);
    }

    public startScene(){
        
        
        
        const center = this.viewport.getCenter();

        this.addLayer("BACKGROUND", 1);
		this.initBackground();

        this.startMenu = this.addUILayer("startMenu");

        // The start menu
        const start = <Label>this.add.uiElement(UIElementType.LABEL, "startMenu", {position: new Vec2(center.x, center.y + center.y/1.5), text: "Click anywhere to start"});
        start.size.set(center.x * 2, center.y + center.y * 1.5 + center.y * 2);
        start.borderWidth = 2;
        start.textColor = Color.WHITE;
        start.borderColor = Color.WHITE;
        start.backgroundColor = Color.TRANSPARENT;
        start.onClickEventId = "start";

        const title = [
            "Undead",
            "Siege"
        ]
        for(let i = 0; i < title.length; i++){
            const titleText = <Label>this.add.uiElement(UIElementType.LABEL, "startMenu", {position: new Vec2(center.x, center.y * .5 - 50 + i * 90), text: title[i]});
            titleText.textColor = Color.RED;
            titleText.fontSize = 80;
        }
        this.receiver.subscribe("start");
    }

    public updateScene(){
        while(this.receiver.hasNextEvent()){
            this.handleEvent(this.receiver.getNextEvent());
        }
    }

    public handleEvent(event: GameEvent): void {
        switch(event.type) {
            case "start": {
                this.sceneManager.changeToScene(MainMenu);
                break;
            }
        }
    }

    protected initBackground(): void {
		this.background = this.add.sprite(StartMenu.BACKGROUND_KEY, "BACKGROUND");
        const center = this.viewport.getCenter();

        const viewportSize = this.viewport.getHalfSize().scale(2);
        const imageSize = this.background.size;

        // Calculate the scale factors for the X and Y dimensions
        const scaleX = viewportSize.x / imageSize.x;
        const scaleY = viewportSize.y / imageSize.y;

        // // Set the scale of the background image to match the viewport dimensions
        this.background.scale.set(scaleX, scaleY);

        //Revert the viewport halfsize
        this.viewport.getHalfSize().scale(.5);

		this.background.position.copy(center);
	}

}