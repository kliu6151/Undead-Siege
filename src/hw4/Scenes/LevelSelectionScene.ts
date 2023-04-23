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

export default class LevelSelectionScene extends Scene {
  // Layers, for multiple main menu screens
  private LevelSelectionScene: Layer;
  private about: Layer;
  private control: Layer;

  private highestLevelCompleted: number = 0;

  private levelButtons: Button[] = [];


  public static BACKGROUND_KEY = "BACKGROUND";
  public static BACKGROUND_PATH = "assets/sprites/background.jpg";

  private background: Sprite;

  public loadScene() {
    this.load.image(LevelSelectionScene.BACKGROUND_KEY, LevelSelectionScene.BACKGROUND_PATH);
  }

  public startScene() {
    const center = this.viewport.getCenter();
    console.log("CENTER IN LEVELSELECTIONSCENE: ", center)
    this.highestLevelCompleted = parseInt(localStorage.getItem("highestLevelCompleted") || "0");


    this.addLayer("BACKGROUND", 0);
    this.initBackground();

    this.LevelSelectionScene = this.addUILayer("LevelSelectionScene");

    // Return Button
    const backButton = <Button>this.add.uiElement(UIElementType.BUTTON, "LevelSelectionScene", {
        position: new Vec2(center.x - this.viewport.getHalfSize().x + 100, center.y - this.viewport.getHalfSize().y + 50),
        text: "Back",
      });
      
      backButton.size.set(150, 50);
      backButton.borderWidth = 2;
      backButton.borderColor = Color.WHITE;
      backButton.backgroundColor = Color.BLACK;
      backButton.onClickEventId = "return";

   // Create an array to store the level buttons
   this.levelButtons = [];

   // Loop through the levels and create buttons
   for (let i = 1; i <= 6; i++) {
     const levelButton = <Button>this.add.uiElement(UIElementType.BUTTON, "LevelSelectionScene", {
       position: new Vec2(center.x - 350 + ((i - 1) % 3) * 350, center.y - 150 + Math.floor((i - 1) / 3) * 200),
       text: `Level ${i}`,
     });

     levelButton.size.set(300, 50);
     levelButton.borderWidth = 2;
     levelButton.borderColor = Color.WHITE;
     levelButton.onClickEventId = `level${i}`;

     // Check if the level is unlocked
     if (i <= this.highestLevelCompleted + 1) {
       levelButton.backgroundColor = Color.BLACK;
     } else {
       levelButton.backgroundColor = Color.BLUE;
       levelButton.disable();
     }

   }
   this.unlockLevels(this.levelButtons);


   /**
    * IMPLEMENTED AFTER A LEVEL IS COMPLETED. TAKE THIS AWAY FROM HERE!!!!!
    */
    //const highestLevelCompleted = parseInt(localStorage.getItem("highestLevelCompleted") || "0");

    // if (levelNumber > highestLevelCompleted) {
    //   localStorage.setItem("highestLevelCompleted", levelNumber.toString());
    // }


    // Subscribe to the button events
    this.receiver.subscribe("return")
    this.receiver.subscribe("level1");
    this.receiver.subscribe("Level2");
    this.receiver.subscribe("Level3");
    this.receiver.subscribe("Level4");
    this.receiver.subscribe("Level5");
    this.receiver.subscribe("Level6");
    this.receiver.subscribe("allLevelCheatUnlock");


  }

  public updateScene() {
    while (this.receiver.hasNextEvent()) {
      this.handleEvent(this.receiver.getNextEvent());
    }
  }



  public handleEvent(event: GameEvent): void {
    switch (event.type) {
      case "allLevelCheatUnlock": {
        this.highestLevelCompleted = 5;
        localStorage.setItem("highestLevelCompleted", this.highestLevelCompleted.toString());
        this.unlockLevels(this.levelButtons);
        break;
    }

        case "return":
            this.sceneManager.changeToScene(MainMenu);
            break;
        case "level1":
            break
        case "Level2":
            break
        case "Level3":
            break
        case "Level4":
            break
        case "Level5":
            break
        case "Level6":
            break
    }   
  }
  protected initBackground(): void {
    this.background = this.add.sprite(LevelSelectionScene.BACKGROUND_KEY, "BACKGROUND");
    const center = this.viewport.getCenter();

    const viewportSize = this.viewport.getHalfSize().scale(2);
    const imageSize = this.background.size;

    // Calculate the scale factors for the X and Y dimensions
    const scaleX = viewportSize.x / imageSize.x;
    const scaleY = viewportSize.y / imageSize.y;

    // // Set the scale of the background image to match the viewport dimensions
    this.background.scale.set(scaleX, scaleY);

    //Revert the viewport halfsize
    this.viewport.getHalfSize().scale(0.5);

    this.background.position.copy(center);
  }

  private unlockLevels(levelButtons: Button[]): void {
    for (let i = 0; i < levelButtons.length; i++) {
        if (i <= this.highestLevelCompleted) {
            levelButtons[i].backgroundColor = Color.BLACK;
            levelButtons[i].enable(); // Enable the button
        } else {
            levelButtons[i].backgroundColor = Color.BLUE;
            levelButtons[i].disable(); // Disable the button
        }
    }
}

}
