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
import MainMenu from "./MainMenu";

export default class Controls extends Scene {
  // Layers, for multiple main menu screens
  private Controls: Layer;
  private about: Layer;

  private highestLevelCompleted: number = 0;



  public static BACKGROUND_KEY = "BACKGROUND";
  public static BACKGROUND_PATH = "assets/sprites/background.jpg";
  public static MOUSE_KEY = "MOUSE";
    public static MOUSE_PATH = "assets/sprites/Mouse.png";

  private background: Sprite;
  private mouse: Sprite;

  public loadScene() {
    this.load.image(Controls.MOUSE_KEY, Controls.MOUSE_PATH);
  }

  public startScene() {

    this.addLayer("MOUSE", 0);

    const center = this.viewport.getCenter();

    this.Controls = this.addUILayer("Controls");

    // Return Button
    const backButton = <Button>this.add.uiElement(UIElementType.BUTTON, "Controls", {
        position: new Vec2(center.x - this.viewport.getHalfSize().x + 100, center.y - this.viewport.getHalfSize().y + 50),
        text: "X",
      });
      
      backButton.size.set(150, 50);
      backButton.borderWidth = 2;
      backButton.borderColor = Color.WHITE;
      backButton.backgroundColor = Color.BLACK;
      backButton.onClickEventId = "return";


// Controls Label
const controlsLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Controls", {
    position: new Vec2(center.x, center.y - this.viewport.getHalfSize().y + 100),
    text: "CONTROLS",
  });

  controlsLabel.textColor = Color.WHITE;
  controlsLabel.backgroundColor = Color.RED;
  controlsLabel.fontSize = 48;

  // Movement Label
  const movementLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Controls", {
    position: new Vec2(center.x - 300, center.y - 200),
    text: "MOVEMENT",
  });

  movementLabel.textColor = Color.RED;
//   movementLabel.underline = true;

  // WASD buttons
  const wasdKeys = ["W", "A", "S", "D"];
  const wasdOffsets = [
    new Vec2(0, -75),
    new Vec2(-75, 0),
    new Vec2(0, 0),
    new Vec2(75, 0),
  ];

  for (let i = 0; i < wasdKeys.length; i++) {
    const keyButton = <Button>this.add.uiElement(UIElementType.BUTTON, "Controls", {
      position: new Vec2(center.x - 300 + wasdOffsets[i].x, center.y - 50 + wasdOffsets[i].y),
      text: wasdKeys[i],
    });

    keyButton.size.set(50, 50);
    keyButton.borderWidth = 2;
    keyButton.borderColor = Color.WHITE;
    keyButton.backgroundColor = Color.BLACK;
    keyButton.disable();
  }

  // Direction labels
    const directions = ["Up", "Left", "Down", "Right"];
    const directionOffsets = [
      new Vec2(0, -50),
      new Vec2(-50, 0),
      new Vec2(0, 50),
      new Vec2(50, 0),
    ];

    for (let i = 0; i < directions.length; i++) {
      const directionLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Controls", {
        position: new Vec2(center.x - 300 + wasdOffsets[i].x + directionOffsets[i].x, center.y - 50 + wasdOffsets[i].y + directionOffsets[i].y),
        text: directions[i],
      });

      directionLabel.textColor = Color.WHITE;
      directionLabel.fontSize = 16;
    }

    // Attacking Label
    const attackingLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Controls", {
      position: new Vec2(center.x + 300, center.y - 200),
      text: "ATTACKING",
    });

    attackingLabel.textColor = Color.RED;
    // attackingLabel.underline = true;

    // Mouse image
    // Load the mouse image asset in loadScene()
    this.initMouse();

    // Attack Label
    const attackLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Controls", {
      position: new Vec2(center.x + 200, center.y - 150),
      text: "ATTACK",
    });
    attackLabel.fontSize = 16;
    attackLabel.textColor = Color.WHITE;

    // Other Label
    const otherLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Controls", {
      position: new Vec2(center.x, center.y + 100),
      text: "OTHER",
    });

    otherLabel.textColor = Color.RED;
    // otherLabel.underline = true;

    // Spacebar Button
    const spacebarButton = <Button>this.add.uiElement(UIElementType.BUTTON, "Controls", {
      position: new Vec2(center.x - 300, center.y + 200),
      text: "Space",
    });

    spacebarButton.size.set(200, 50);
    spacebarButton.borderWidth = 2;
    spacebarButton.borderColor = Color.WHITE;
    spacebarButton.backgroundColor = Color.BLACK;
    spacebarButton.disable();

    // Pickup Item Label
    const pickupItemLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Controls", {
      position: new Vec2(center.x - 300, center.y + 270),
      text: "Pick-up item",
    });

    pickupItemLabel.textColor = Color.WHITE;
    pickupItemLabel.fontSize = 16;

    // Pause Button
    const pauseButton = <Button>this.add.uiElement(UIElementType.BUTTON, "Controls", {
      position: new Vec2(center.x + 300, center.y + 200),
      text: "ESC",
    });

    pauseButton.size.set(100, 50);
    pauseButton.borderWidth = 2;
    pauseButton.borderColor = Color.WHITE;
    pauseButton.backgroundColor = Color.BLACK;
    pauseButton.disable();

    // Pause Game Label
    const pauseGameLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Controls", {
      position: new Vec2(center.x + 300, center.y + 270),
      text: "Pause game",
    });

    pauseGameLabel.textColor = Color.WHITE;
    pauseGameLabel.fontSize = 16;
    // Subscribe to the button events
    this.receiver.subscribe("return")

  }

  public updateScene() {
    while (this.receiver.hasNextEvent()) {
      this.handleEvent(this.receiver.getNextEvent());
    }
  }

  public handleEvent(event: GameEvent): void {
    switch (event.type) {
        case "return":
            this.sceneManager.changeToScene(MainMenu);
            break;
    }   
  }
  
  protected initMouse(): void  {
    this.mouse = this.add.sprite(Controls.MOUSE_KEY, "MOUSE");
    const center = this.viewport.getCenter();

    this.mouse.scale.set(1, 1);
    this.mouse.position.set(center.x + 300, center.y - 100);
  }
}
