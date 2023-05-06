import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Layer from "../../Wolfie2D/Scene/Layer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import MainHW4Scene from "./Levels/MainHW4Scene";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import MainMenu from "./MainMenu";
import { CheatEvent } from "../Events";

export default class Help extends Scene {
  // Layers, for multiple main menu screens
  private Help: Layer;
  private about: Layer;
  private control: Layer;

  public loadScene() {}

  public startScene() {
    const center = this.viewport.getCenter();

    this.Help = this.addUILayer("Help");

    // Return Button
    const backButton = <Button>this.add.uiElement(
      UIElementType.BUTTON,
      "Help",
      {
        position: new Vec2(
          center.x - this.viewport.getHalfSize().x + 100,
          center.y - this.viewport.getHalfSize().y + 50
        ),
        text: "X",
      }
    );

    backButton.size.set(150, 50);
    backButton.borderWidth = 2;
    backButton.borderColor = Color.WHITE;
    backButton.backgroundColor = Color.BLACK;
    backButton.onClickEventId = "return";
    
    const controlsLabel = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Help",
      {
        position: new Vec2(
          center.x,
          center.y - this.viewport.getHalfSize().y + 100
        ),
        text: "HELP",
      }
    );

    controlsLabel.textColor = Color.WHITE;
    controlsLabel.backgroundColor = Color.RED;
    controlsLabel.fontSize = 48;

    const text = [
      "In Undead Siege, you are humanity's last          ",
      "hope, entrusted with the ultimate mission:        ",
      "delivering the cure to a deadly virus that has    ",
      "turned the world into a zombie-infested           ",
      "wasteland. Navigate through the harsh             ",
      "environments, refuel your helicopter, and         ",
      "upgrade your arsenal, all while fending off       ",
      "relentless waves of the undead. Each level        ",
      "brings you closer to the final research facility, ",
      "where you must gather fuel and attachment         ",
      "upgrades for your weapon during the day,          ",
      "and defend your helicopter and yourself from      ",
      "hordes of zombies at night. With the fate of      ",
      "humanity on the line, it's up to you to           ",
      "complete your mission, save the remaining         ",
      "survivors, and change the course of history.      ",
      "Are you ready to face the challenge and           ",
      "become the hero the world desperately needs?      ",
      "        The Undead Siege awaits.                  ",
    ];
    for (let i = 0; i < text.length; i++) {
      const controlsLabel = <Label>this.add.uiElement(
        UIElementType.LABEL,
        "Help",
        {
          position: new Vec2(
            center.x + 25,
            center.y - this.viewport.getHalfSize().y + 150 + i * 20
          ),
          text: text[i],
        }
      );
      controlsLabel.textColor = Color.WHITE;
      controlsLabel.fontSize = 16;
    }

    const developersLabel = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Help",
      {
        position: new Vec2(
          center.x,
          center.y - this.viewport.getHalfSize().y + 150 + text.length * 20 + 50
        ),
        text: "DEVELOPERS",
      }
    );
    developersLabel.textColor = Color.WHITE;

    const developers = ["Kevin Liu", "Joey Chan", "Luigi Razon"];
    for (let i = 0; i < developers.length; i++) {
      const devLabels = <Label>this.add.uiElement(UIElementType.LABEL, "Help", {
        position: new Vec2(
          center.x,
          center.y -
            this.viewport.getHalfSize().y +
            150 +
            text.length * 20 +
            100 +
            i * 40
        ),
        text: developers[i],
      });
      devLabels.textColor = Color.RED;
      devLabels.fontSize = 30;
    }

    const cheatLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Help", {
        position: new Vec2(
            center.x - this.viewport.getHalfSize().x + 150,
            center.y - this.viewport.getHalfSize().y + 150 + text.length * 20 + 50
        ),
        text: "CHEATS",
    });
    cheatLabel.textColor = Color.RED;

    const cheats = ["[0] - Unlock all levels", "[9] - Infinite Health", "[8] - End day/night", "[7] - Add Material"];
    for (let i = 0; i < cheats.length; i++) {
        const cheatButtons = <Label>this.add.uiElement(UIElementType.LABEL, "Help", {
            position: new Vec2(
                center.x - this.viewport.getHalfSize().x + 150,
                center.y - this.viewport.getHalfSize().y + 150 + text.length * 20 + 100 + i * 30
            ),
            text: cheats[i],
        });
        // cheatButtons.size.set(150, 30);
        // cheatButtons.borderWidth = 2;
        // cheatButtons.borderColor = Color.BLACK
        cheatButtons.textColor = Color.WHITE; 
        // cheatButtons.backgroundColor = Color.WHITE;
        cheatButtons.fontSize = 15;
    }

    // Subscribe to the button events
    this.receiver.subscribe("return");
    // this.receiver.subscribe("UNLOCK ALL LEVELS");

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
      case "UNLOCK ALL LEVELS":
        this.emitter.fireEvent("allLevelCheatUnlock");
        break;
    }
  }
}
