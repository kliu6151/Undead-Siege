import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Layer from "../../Wolfie2D/Scene/Layer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import LevelSelectionScene from "./LevelSelectionScene";
import Controls from "./Controls";
import Help from "./Help";
import Level1 from "./Levels/Level1";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import StartMenu from "./StartMenu";

export default class MainMenu extends Scene {
  // Layers, for multiple main menu screens
  private mainMenu: Layer;
  private about: Layer;
  private control: Layer;

  public static BACKGROUND_KEY = "BACKGROUND";
  public static BACKGROUND_PATH = "assets/sprites/background.jpg";

  public static LOGO_KEY = "LOGO";
  public static LOGO_PATH = "assets/sprites/logo.png";


  

  private background: Sprite;
  private logo: Sprite;

  public loadScene() {
    this.load.image(MainMenu.BACKGROUND_KEY, MainMenu.BACKGROUND_PATH);
    this.load.image(MainMenu.LOGO_KEY, MainMenu.LOGO_PATH);
  }

  public startScene() {
    const center = this.viewport.getCenter();

    const size = this.viewport.getHalfSize();
    this.addLayer("BACKGROUND", 0);
    this.initBackground();

    this.addLayer("LOGO", 1);
    this.initLogo();

    // The main menu
    this.mainMenu = this.addUILayer("mainMenu");

    //Play Button
    const play = <Button>this.add.uiElement(UIElementType.BUTTON, "mainMenu", {
      position: new Vec2(
        center.x - (center.x * 5) / 10,
        center.y + (center.y * 8) / 10
      ),
      text: "Play",
    });

    play.size.set(300, 50);
    play.textColor = Color.RED;
    play.borderWidth = 2;
    play.borderColor = Color.WHITE;
    play.backgroundColor = Color.BLACK;
    play.onClickEventId = "play";

    //Level Selection
    const selectLevel = <Button>this.add.uiElement(
      UIElementType.BUTTON,
      "mainMenu",
      {
        position: new Vec2(center.x + center.x * 4/10, center.y + center.y * 3/10),
        text: "Level Selection",
      }
    );
    // play.setTextColor(Color.BLACK);

    selectLevel.size.set(300, 50);
    selectLevel.borderWidth = 2;
    selectLevel.borderColor = Color.WHITE;
    selectLevel.backgroundColor = Color.BLACK;
    selectLevel.onClickEventId = "Level Selection";

    const controls = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {
      position: new Vec2(center.x + center.x * 4/10, center.y + center.y * 50/100),
      text: "Controls",
    });
    controls.size.set(300, 50);
    controls.borderWidth = 2;
    controls.borderColor = Color.WHITE;
    controls.backgroundColor = Color.BLACK;
    controls.onClickEventId = "controls";

    const help = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {
      position: new Vec2(center.x + center.x * 4/10, center.y + center.y * 70/100),
      text: "Help",
    });
    help.size.set(300, 50);
    help.borderWidth = 2;
    help.borderColor = Color.WHITE;
    help.backgroundColor = Color.BLACK;
    help.onClickEventId = "help";

    //Credit
    const creditK = <Label>this.add.uiElement(UIElementType.LABEL, "mainMenu", {
      position: new Vec2(center.x + center.x * 8/10, center.y - center.y * 8/10),
      text: "Kevin Liu",
    });
    creditK.textColor = Color.WHITE;
    const creditJ = <Label>this.add.uiElement(UIElementType.LABEL, "mainMenu", {
      position: new Vec2(center.x + center.x * 8/10, center.y - center.y * 65/100),
      text: "Joey Chan",
    });
    creditJ.textColor = Color.WHITE;
    const creditL = <Label>this.add.uiElement(UIElementType.LABEL, "mainMenu", {
      position: new Vec2(center.x + center.x * 8/10, center.y - center.y * 50/100),
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
        // this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: StartMenu.MUSIC_KEY, loop: true, holdReference: false})
        this.sceneManager.changeToScene(Level1);
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

    const imageSize = this.background.size;

    // Calculate the scale factors for the X and Y dimensions
    const scaleX = (this.viewport.getHalfSize().x * 2) / imageSize.x;
    const scaleY = (this.viewport.getHalfSize().y * 2) / imageSize.y;

    // // Set the scale of the background image to match the viewport dimensions
    this.background.scale.set(scaleX, scaleY);

    //Revert the viewport halfsize

    this.background.position.copy(center);
  }

  protected initLogo(): void {
    this.logo = this.add.sprite(MainMenu.LOGO_KEY, "LOGO");
    const center = this.viewport.getCenter();

    // Calculate the desired scale based on the viewport dimensions
    const scaleFactor = Math.min((center.x * 2) / 1280, (center.y * 2) / 720);

    // Use the calculated scale factor to set the logo scale
    this.logo.scale.set(5 * scaleFactor, 5 * scaleFactor);
    this.logo.position.set(
      center.x - (center.x * 45) / 100,
      center.y - (center.y * 2) / 10
    );
  }
}
