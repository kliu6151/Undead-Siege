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

export default class MainMenu extends Scene {
  // Layers, for multiple main menu screens
  private mainMenu: Layer;
  private about: Layer;
  private control: Layer;


  public static BACKGROUND_KEY = "BACKGROUND";
  public static BACKGROUND_PATH = "assets/images/background.jpg";

  public static LOGO_KEY = "LOGO";
  public static LOGO_PATH = "assets/images/logo.png";

  private background: Sprite;
  private logo: Sprite;

  public loadScene() {
    this.load.image(MainMenu.BACKGROUND_KEY, MainMenu.BACKGROUND_PATH);
    this.load.image(MainMenu.LOGO_KEY, MainMenu.LOGO_PATH);
  }

  public startScene() {
    const center = this.viewport.getCenter();

    this.addLayer("BACKGROUND", 0);
    this.initBackground();

    this.addLayer("LOGO", 1);
    this.initLogo();

    // The main menu
    this.mainMenu = this.addUILayer("mainMenu");

    //Play Button
    const play = <Button>(this.add.uiElement(UIElementType.BUTTON, "mainMenu", {
        position: new Vec2(center.x - 450, center.y + 300),
        text: "Play",
        }));

    play.size.set(300, 50);
    play.textColor = Color.RED;
    play.borderWidth = 2;
    play.borderColor = Color.WHITE;
    play.backgroundColor = Color.BLACK;
    play.onClickEventId = "play";

    //Level Selection
    const selectLevel = <Button>(this.add.uiElement(UIElementType.BUTTON, "mainMenu", {
      position: new Vec2(center.x + 300, center.y + 100),
      text: "Level Selection",
    }));
    // play.setTextColor(Color.BLACK);

    selectLevel.size.set(300, 50);
    selectLevel.borderWidth = 2;
    selectLevel.borderColor = Color.WHITE;
    selectLevel.backgroundColor = Color.BLACK;
    selectLevel.onClickEventId = "Level Selection";

    const astar = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {
      position: new Vec2(center.x + 300, center.y + 200),
      text: "Controls",
    });
    astar.size.set(300, 50);
    astar.borderWidth = 2;
    astar.borderColor = Color.WHITE;
    astar.backgroundColor = Color.BLACK;
    astar.onClickEventId = "controls";

    const guard = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {
      position: new Vec2(center.x + 300, center.y + 300),
      text: "Help",
    });
    guard.size.set(300, 50);
    guard.borderWidth = 2;
    guard.borderColor = Color.WHITE;
    guard.backgroundColor = Color.BLACK;
    guard.onClickEventId = "help";

    //Credit
    const creditK = <Label>this.add.uiElement(UIElementType.LABEL, "mainMenu", {
        position: new Vec2(center.x + 600, center.y - 300),
        text: "Kevin Liu",
        });
    creditK.textColor = Color.WHITE;
    const creditJ = <Label>this.add.uiElement(UIElementType.LABEL, "mainMenu", {
        position: new Vec2(center.x + 600, center.y - 225),
        text: "Joey Chan",
        });
    creditJ.textColor = Color.WHITE;
    const creditL = <Label>this.add.uiElement(UIElementType.LABEL, "mainMenu", {
        position: new Vec2(center.x + 600, center.y - 150),
        text: "Luigi Razon",
        });
    creditL.textColor = Color.WHITE;

    // Subscribe to the button events
    this.receiver.subscribe("play");
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
      case "play": {
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
    this.background = this.add.sprite(MainMenu.BACKGROUND_KEY, "BACKGROUND");
    const center = this.viewport.getCenter();

    const viewportSize = this.viewport.getHalfSize().scale(2);
    const imageSize = this.background.size;

    // Calculate the scale factors for the X and Y dimensions
    const scaleX = viewportSize.x / imageSize.x;
    const scaleY = viewportSize.y / imageSize.y;

    // // Set the scale of the background image to match the viewport dimensions
    this.background.scale.set(scaleX, scaleY);

    //Rever the viewport halfsize
    this.viewport.getHalfSize().scale(0.5);

    this.background.position.copy(center);
  }

  protected initLogo(): void {
    this.logo = this.add.sprite(MainMenu.LOGO_KEY, "LOGO");
    const center = this.viewport.getCenter();

    this.logo.scale.set(5, 5);
    this.logo.position.set(center.x - 400, center.y - 100);
  }
}
