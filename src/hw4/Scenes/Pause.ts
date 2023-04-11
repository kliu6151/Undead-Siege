import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Layer from "../../Wolfie2D/Scene/Layer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import MainHW4Scene from "./MainHW4Scene";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import LevelSelectionScene from "./LevelSelectionScene";
import Controls from "./Controls";
import Help from "./Help";

export default class Pause extends Scene {
  // Layers, for multiple main menu screens
  private Pause: Layer;
  private about: Layer;
  private control: Layer;

  public static LOGO_KEY = "LOGO";
  public static LOGO_PATH = "assets/images/logo.png";
  public static BG_KEY = "BG";
  public static BG_PATH = "assets/images/pauseBg.jpg";

  private background: Sprite;
  private logo: Sprite;

  public loadScene() {
    this.load.image(Pause.LOGO_KEY, Pause.LOGO_PATH);
    this.load.image(Pause.BG_KEY, Pause.BG_PATH);
  }

  public startScene() {
    const center = this.viewport.getCenter();

    this.addLayer("BG", 0);
    this.initBackground();

    this.addLayer("LOGO", 1);
    this.initLogo();

    // The main menu
    this.Pause = this.addUILayer("Pause");


    const backButton = <Button>this.add.uiElement(UIElementType.BUTTON, "Pause", {
        position: new Vec2(center.x - this.viewport.getHalfSize().x + 50, center.y - this.viewport.getHalfSize().y + 25),
        text: "X",
      });
      
      backButton.size.set(150, 50);
      backButton.borderWidth = 2;
      backButton.borderColor = Color.WHITE;
      backButton.backgroundColor = Color.BLACK;
      backButton.onClickEventId = "return";

    const resume = <Label>(this.add.uiElement(UIElementType.LABEL, "Pause", {
        position: new Vec2(center.x, 160),
        text: "Resume",
        }));
        resume.textColor = Color.RED;
    const controls = <Label>(this.add.uiElement(UIElementType.LABEL, "Pause", {
        position: new Vec2(center.x, 180),
        text: "Controls",
        }));
        controls.textColor = Color.WHITE;
    const saveAndExit = <Label>(this.add.uiElement(UIElementType.LABEL, "Pause", {
        position: new Vec2(center.x, 200),
        text: "Save and Exit",
        }));
        saveAndExit.textColor = Color.RED;
    const exit = <Label>(this.add.uiElement(UIElementType.LABEL, "Pause", {
        position: new Vec2(center.x, 220),
        text: "Exit",
        }));
        exit.textColor = Color.WHITE;
    const cheats = <Label>(this.add.uiElement(UIElementType.LABEL, "Pause", {
        position: new Vec2(center.x, 240),
        text: "Cheats",
        }));
        cheats.textColor = Color.RED;


    // Subscribe to the button events
    this.receiver.subscribe("return");
    this.receiver.subscribe("Level Selection");
    this.receiver.subscribe("controls");
    this.receiver.subscribe("help");
  }

  public updateScene() {
    while (this.receiver.hasNextEvent()) {
      this.handleEvent(this.receiver.getNextEvent());
    }
  }

  public handleEvent(event: GameEvent): void {
    switch (event.type) {
      case "return": {
        this.sceneManager.changeToScene(MainHW4Scene);
        break;
      }
      case "controls": {
        this.sceneManager.changeToScene(Controls);
        break;
      }
      case "help": {
        this.sceneManager.changeToScene(Help);
        break;
      }
        case "Level Selection": {
        this.sceneManager.changeToScene(LevelSelectionScene);
        break;
    }
  }
}

protected initBackground(): void {
    this.background = this.add.sprite(Pause.BG_KEY, "BG");
    const center = this.viewport.getCenter();

    const viewportSize = this.viewport.getHalfSize().scale(2);
    const imageSize = this.background.size;

    // Calculate the scale factors for the X and Y dimensions
    const scaleX = viewportSize.x / imageSize.x;
    const scaleY = viewportSize.y / imageSize.y;

    // // Set the scale of the background image to match the viewport dimensions
    this.background.scale.set(scaleX, scaleY);

    //Rever the viewport halfsize
    this.viewport.getHalfSize().scale(.5);

    this.background.position.copy(center);

}
  protected initLogo(): void {
    this.logo = this.add.sprite(Pause.LOGO_KEY, "LOGO");
    // const center = this.viewport.getCenter();

    this.logo.scale.set(1, 1);
    this.logo.position.set(this.viewport.getHalfSize().x, 70);
  }
}
