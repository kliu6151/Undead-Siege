import PositionGraph from "../../Wolfie2D/DataTypes/Graphs/PositionGraph";
import Actor from "../../Wolfie2D/DataTypes/Interfaces/Actor";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import GameNode from "../../Wolfie2D/Nodes/GameNode";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Line from "../../Wolfie2D/Nodes/Graphics/Line";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Navmesh from "../../Wolfie2D/Pathfinding/Navmesh";
import DirectStrategy from "../../Wolfie2D/Pathfinding/Strategies/DirectStrategy";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import Timer from "../../Wolfie2D/Timing/Timer";
import Color from "../../Wolfie2D/Utils/Color";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import NPCActor from "../Actors/NPCActor";
import PlayerActor from "../Actors/PlayerActor";
import GuardBehavior from "../AI/NPC/NPCBehavior/GaurdBehavior";
import HealerBehavior from "../AI/NPC/NPCBehavior/HealerBehavior";
import ZombieBehavior from "../AI/NPC/NPCBehavior/ZombieBehavior";
import PlayerAI from "../AI/Player/PlayerAI";
import { ItemEvent, PlayerEvent, BattlerEvent, InputEvent } from "../Events";
import Battler from "../GameSystems/BattleSystem/Battler";
import BattlerBase from "../GameSystems/BattleSystem/BattlerBase";
import HealthbarHUD from "../GameSystems/HUD/HealthbarHUD";
import InventoryHUD from "../GameSystems/HUD/InventoryHUD";
import Inventory from "../GameSystems/ItemSystem/Inventory";
import Item from "../GameSystems/ItemSystem/Item";
import Healthpack from "../GameSystems/ItemSystem/Items/Healthpack";
import LaserGun from "../GameSystems/ItemSystem/Items/LaserGun";
import { ClosestPositioned } from "../GameSystems/Searching/HW4Reducers";
import BasicTargetable from "../GameSystems/Targeting/BasicTargetable";
import Position from "../GameSystems/Targeting/Position";
import AstarStrategy from "../Pathfinding/AstarStrategy";
import HW4Scene from "./HW4Scene";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import Layer from "../../Wolfie2D/Scene/Layer";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Material from "../GameSystems/ItemSystem/Items/Material";
import Fuel from "../GameSystems/ItemSystem/Items/Fuel";
import MainMenu from "./MainMenu";

const BattlerGroups = {
  RED: 1,
  BLUE: 2,
} as const;

export default class MainHW4Scene extends HW4Scene {
  public isPaused: boolean;
  private pauseLayer: Layer;
  private pauseText: Label;

  /** GameSystems in the HW3 Scene */
  private inventoryHud: InventoryHUD;

  //Timers
  private countDownTimer: Timer;
  private timerLabel: Label;
  private elapsedTime: number;

  //UI Sprites
  private materialIcon: Sprite;
  private fuelIcon: Sprite;
  private pause_background: Sprite;
  private logo: Sprite;
  private night: Sprite;

  //UI Counter Labels
  private materialCounter: Label;
  private fuelCounter: Label;

  //UI Pause Label & Buttons
  private backButton: Button;
  private resume: Label;
  private controls: Label;
  private exit: Label;
  private cheats: Label;
  private AllLevelsCheat: Button;
  private unlimitedHealthCheat: Button;
  private speedBoostCheat: Button;

  public static MATERIAL_KEY = "MATERIAL";
  public static MATERIAL_PATH = "assets/sprites/loot.png";
  public static FUEL_KEY = "FUEL";
  public static FUEL_PATH = "assets/sprites/fuel.png";
  public static PAUSE_BG_KEY = "PAUSE_BG";
  public static PAUSE_BG_PATH = "assets/sprites/pauseBg.jpg";
  public static LOGO_KEY = "LOGO";
  public static LOGO_PATH = "assets/sprites/logo.png";
  public static NIGHT_KEY = "NIGHT";
  public static NIGHT_PATH = "assets/sprites/black.png";

  /** All the battlers in the HW3Scene (including the player) */
  private battlers: (Battler & Actor)[];
  /** Healthbars for the battlers */
  private healthbars: Map<number, HealthbarHUD>;

  private bases: BattlerBase[];

  private healthpacks: Array<Healthpack>;
  private laserguns: Array<LaserGun>;

  private materials: Array<Material>;
  private fuels: Array<Fuel>;

  // The wall layer of the tilemap
  private walls: OrthogonalTilemap;

  // The position graph for the navmesh
  private graph: PositionGraph;

  public constructor(
    viewport: Viewport,
    sceneManager: SceneManager,
    renderingManager: RenderingManager,
    options: Record<string, any>
  ) {
    super(viewport, sceneManager, renderingManager, options);

    this.battlers = new Array<Battler & Actor>();
    this.healthbars = new Map<number, HealthbarHUD>();

    this.laserguns = new Array<LaserGun>();
    this.healthpacks = new Array<Healthpack>();

    this.materials = new Array<Material>();
    this.fuels = new Array<Fuel>();
  }

  /**
   * @see Scene.update()
   */
  public override loadScene() {
    // Load the player and enemy spritesheets
    this.load.spritesheet("player1", "assets/spritesheets/player1.json");

    // Load in the enemy sprites
    this.load.spritesheet("BlueEnemy", "assets/spritesheets/BlueEnemy.json");
    this.load.spritesheet("RedEnemy", "assets/spritesheets/RedEnemy.json");
    this.load.spritesheet("BlueHealer", "assets/spritesheets/BlueHealer.json");
    this.load.spritesheet("RedHealer", "assets/spritesheets/RedHealer.json");

    // Load the tilemap
    this.load.tilemap("level", "assets/tilemaps/Level1Map.json");

    // Load the enemy locations
    this.load.object("red", "assets/data/enemies/red.json");
    this.load.object("blue", "assets/data/enemies/blue.json");

    // Load the healthpack and lasergun loactions
    this.load.object("healthpacks", "assets/data/items/healthpacks.json");
    this.load.object("laserguns", "assets/data/items/laserguns.json");

    // Load the material and fuel locations
    this.load.object("materials", "assets/data/items/materials.json");
    this.load.object("fuels", "assets/data/items/fuels.json");

    // Load the healthpack, inventory slot, and laser gun sprites
    // this.load.image("healthpack", "assets/sprites/healthpack.png");
    this.load.image("inventorySlot", "assets/sprites/inventory.png");
    // this.load.image("laserGun", "assets/sprites/laserGun.png");

    this.load.image(MainHW4Scene.MATERIAL_KEY, MainHW4Scene.MATERIAL_PATH);
    this.load.image(MainHW4Scene.FUEL_KEY, MainHW4Scene.FUEL_PATH);
    this.load.image(MainHW4Scene.LOGO_KEY, MainHW4Scene.LOGO_PATH);
    this.load.image(MainHW4Scene.PAUSE_BG_KEY, MainHW4Scene.PAUSE_BG_PATH);
    this.load.image(MainHW4Scene.NIGHT_KEY, MainHW4Scene.NIGHT_PATH);
  }
  /**
   * @see Scene.startScene
   */
  public override startScene() {
    // Add in the tilemap
    let tilemapLayers = this.add.tilemap("level");
    const tempSize = this.viewport.getCenter();
    console.log("START OF 4: ", tempSize)
    // Get the wall layer
    this.walls = <OrthogonalTilemap>tilemapLayers[1].getItems()[0];

    // Set the viewport bounds to the tilemap
    let tilemapSize: Vec2 = this.walls.size;

    this.viewport.setBounds(0, 0, tilemapSize.x, tilemapSize.y);
    this.viewport.setZoomLevel(2);

    this.initLayers();
    this.initializeUI();
    this.initPauseUI();

    this.elapsedTime = 0;
    this.countDownTimer = new Timer(120 * 1000);
    this.countDownTimer.start();

    // Create the player
    this.initializePlayer();
    this.initializeItems();

    this.initializeNavmesh();

    // Create the NPCS
    this.initializeNPCs();

    // Subscribe to relevant events
    this.receiver.subscribe("healthpack");
    this.receiver.subscribe("enemyDied");
    this.receiver.subscribe(ItemEvent.ITEM_REQUEST);
    this.receiver.subscribe(ItemEvent.MATERIAL_PICKED_UP);
    this.receiver.subscribe(ItemEvent.FUEL_PICKED_UP);
    this.receiver.subscribe(InputEvent.PAUSED);
    this.receiver.subscribe("exit");
    this.receiver.subscribe("unPause");
    this.receiver.subscribe("showCheats")

    // Add a UI for health
    this.addUILayer("health");

    this.receiver.subscribe(PlayerEvent.PLAYER_KILLED);
    this.receiver.subscribe(BattlerEvent.BATTLER_KILLED);
    this.receiver.subscribe(BattlerEvent.BATTLER_RESPAWN);
  }
  /**
   * @see Scene.updateScene
   */
  public override updateScene(deltaT: number): void {
    // Move input handling outside the if statement
    while (this.receiver.hasNextEvent()) {
      this.handleEvent(this.receiver.getNextEvent());
    }

    if (!this.isPaused) {
      // this.inventoryHud.update(deltaT);
      this.healthbars.forEach((healthbar) => healthbar.update(deltaT));

      this.elapsedTime += deltaT;

      // Update the timer
      this.countDownTimer.update(deltaT);

      // Update the timer label
      const remainingTime = Math.max(
        this.countDownTimer.getTotalTime() - this.elapsedTime,
        0
      );
      const minutes = Math.floor(remainingTime / 60);
      const seconds = Math.floor(remainingTime % 60);
      this.timerLabel.text = `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
      if (remainingTime <= 0) {
        console.log("DUSK");
        this.night = this.add.sprite(MainHW4Scene.NIGHT_KEY, "night");
        this.night.alpha = 0.1;
        this.night.scale.set(2, 2);
        this.night.position.set(
          this.viewport.getHalfSize().x,
          this.viewport.getHalfSize().y
        );
      }
    }
  }

  /**
   * Handle events from the rest of the game
   * @param event a game event
   */
  public handleEvent(event: GameEvent): void {
    if (this.isPaused) {
      switch (event.type) {
        case "exit": {
          this.sceneManager.changeToScene(MainMenu);
          break;
        }
        case "unPause": {
          this.handlePaused();
          break;
        }
        case "showCheats": {
          this.handleShowCheats();
          break;
        }
        case InputEvent.PAUSED: {
          this.handlePaused();
          break;
        }
      }
    } else if (!this.isPaused || event.type === InputEvent.PAUSED) {
      switch (event.type) {
        case InputEvent.PAUSED: {
          this.handlePaused();
          break;
        }
        case BattlerEvent.BATTLER_KILLED: {
          this.handleBattlerKilled(event);
          break;
        }
        case BattlerEvent.BATTLER_RESPAWN: {
          break;
        }
        case ItemEvent.ITEM_REQUEST: {
          this.handleItemRequest(
            event.data.get("node"),
            event.data.get("inventory")
          );
          break;
        }
        case ItemEvent.MATERIAL_PICKED_UP: {
          this.handleMaterialPickedUp();
          break;
        }
        case ItemEvent.FUEL_PICKED_UP: {
          this.handleFuelPickedUp();
          break;
        }
        default: {
          throw new Error(
            `Unhandled event type "${event.type}" caught in HW3Scene event handler`
          );
        }
      }
    }
  }
  protected handleItemRequest(node: GameNode, inventory: Inventory): void {
    let items: Item[] = new Array<Item>(
      ...this.materials,
      ...this.fuels
    ).filter((item: Item) => {
      return (
        item.inventory === null &&
        item.position.distanceTo(node.position) <= 100
      );
    });

    if (items.length > 0) {
      const pickedUpItem = items.reduce(ClosestPositioned(node));
      inventory.add(pickedUpItem);

      if (pickedUpItem instanceof Material) {
        this.emitter.fireEvent(ItemEvent.MATERIAL_PICKED_UP);
      } else if (pickedUpItem instanceof Fuel) {
        this.emitter.fireEvent(ItemEvent.FUEL_PICKED_UP);
      }
    }
  }

  private handleMaterialPickedUp(): void {
    const currentValue = parseInt(this.materialCounter.text);
    this.materialCounter.text = (currentValue + 1).toString();
  }

  private handleFuelPickedUp(): void {
    const currentValue = parseInt(this.fuelCounter.text);
    this.fuelCounter.text = (currentValue + 1).toString();
  }

  private handlePaused(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.showPauseUI();
    } else {
      this.hidePauseUI();
    }
  }

  private handleShowCheats(): void {
    this.showCheatsUI();
  }

  /**
   * Handles an NPC being killed by unregistering the NPC from the scenes subsystems
   * @param event an NPC-killed event
   */
  protected handleBattlerKilled(event: GameEvent): void {
    let id: number = event.data.get("id");
    let battler = this.battlers.find((b) => b.id === id);

    if (battler) {
      battler.battlerActive = false;
      this.healthbars.get(id).visible = false;
    }
  }

  initializeUI(): void {
    //timer
    this.timerLabel = <Button>this.add.uiElement(
      UIElementType.BUTTON,
      "timer",
      {
        position: new Vec2(this.viewport.getHalfSize().x, 15),
        text: "00:00",
      }
    );
    // Remove the font-related line if you don't have custom fonts
    this.timerLabel.borderColor = Color.WHITE;
    this.timerLabel.textColor = Color.WHITE;
    this.timerLabel.backgroundColor = Color.BLACK;
    this.timerLabel.fontSize = 32;

    //Materials Icon
    this.materialIcon = this.add.sprite(MainHW4Scene.MATERIAL_KEY, "Counters");
    this.materialIcon.scale.set(0.5, 0.5);
    this.materialIcon.position.set(
      this.viewport.getHalfSize().x + this.viewport.getHalfSize().x / 3,
      15
    );
    //Material Counter
    this.materialCounter = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Counters",
      {
        position: new Vec2(
          this.viewport.getHalfSize().x +
            this.viewport.getHalfSize().x / 3 +
            20,
          15
        ),
        text: "0",
      }
    );
    //Fuel Icon
    this.fuelIcon = this.add.sprite(MainHW4Scene.FUEL_KEY, "Counters");
    this.fuelIcon.scale.set(0.6, 0.6);
    this.fuelIcon.position.set(
      this.viewport.getHalfSize().x + 2 * (this.viewport.getHalfSize().x / 3),
      13
    );
    //Fuel Counter
    this.fuelCounter = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Counters",
      {
        position: new Vec2(
          this.viewport.getHalfSize().x +
            2 * (this.viewport.getHalfSize().x / 3) +
            20,
          15
        ),
        text: "0",
      }
    );
  }

  private initPauseUI(): void {
    const center = this.viewport.getCenter();
    console.log("CENTER IN MAIN: ", center);
    console.log(this.viewport);
    // Background
    this.pause_background = this.add.sprite(MainHW4Scene.PAUSE_BG_KEY, "Pause");
    const viewportSize = this.viewport.getHalfSize().scale(2);
    const imageSize = this.pause_background.size;
    const scaleX = viewportSize.x / imageSize.x;
    const scaleY = viewportSize.y / imageSize.y;
    this.pause_background.scale.set(scaleX, scaleY);
    this.viewport.getHalfSize().scale(1 / 2);
    this.pause_background.position.copy(center).sub(this.viewport.getOrigin());

    // Logo
    this.logo = this.add.sprite(MainHW4Scene.LOGO_KEY, "Pause");
    // this.logo.scale.set(1, 1);
    this.logo.position.set(this.viewport.getHalfSize().x, 70);

    this.backButton = <Button>this.add.uiElement(
      UIElementType.BUTTON,
      "Pause",
      {
        position: new Vec2(
          center.x - this.viewport.getHalfSize().x + 50,
          center.y - this.viewport.getHalfSize().y + 25
        ).sub(this.viewport.getOrigin()),
        text: "X",
      }
    );

    this.backButton.size.set(150, 50);
    this.backButton.borderWidth = 2;
    this.backButton.borderColor = Color.WHITE;
    this.backButton.backgroundColor = Color.BLACK;
    this.backButton.onClickEventId = "unPause";

    this.resume = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x, 160),
      text: "Resume",
    });
    this.resume.textColor = Color.RED;
    this.resume.fontSize = 32;
    this.resume.onClickEventId = "unPause";

    this.controls = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x, 180),
      text: "Controls",
    });
    this.controls.textColor = Color.WHITE;
    this.controls.fontSize = 32;
    this.exit = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x, 200),
      text: "Exit",
    });
    this.exit.textColor = Color.RED;
    this.exit.fontSize = 32;
    this.exit.onClickEventId = "exit";

    this.cheats = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x, 220),
      text: "Cheats",
    });
    this.cheats.textColor = Color.WHITE;
    this.cheats.fontSize = 32;
    this.cheats.onClickEventId = "showCheats";

    this.AllLevelsCheat = <Button>this.add.uiElement(UIElementType.BUTTON, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x / 7, this.viewport.getHalfSize().y * 2 - (3*(this.viewport.getHalfSize().y / 8))),
      text: "All Levels",
    });
    this.AllLevelsCheat.textColor = Color.WHITE;
    this.AllLevelsCheat.backgroundColor = Color.BLACK;
    this.AllLevelsCheat.fontSize = 24;
    this.AllLevelsCheat.onClickEventId = "allLevelCheatUnlock";

    this.unlimitedHealthCheat = <Button>this.add.uiElement(UIElementType.BUTTON, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x / 7, this.viewport.getHalfSize().y * 2 - (2*(this.viewport.getHalfSize().y / 8))),
      text: "Unlimited Health",
    });
    this.unlimitedHealthCheat.textColor = Color.WHITE;
    this.unlimitedHealthCheat.backgroundColor = Color.BLACK;
    this.unlimitedHealthCheat.fontSize = 24;

    this.speedBoostCheat = <Button>this.add.uiElement(UIElementType.BUTTON, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x / 7, this.viewport.getHalfSize().y * 2 - (this.viewport.getHalfSize().y / 8) ),
      text: "Speed Boost",
    });
    this.speedBoostCheat.textColor = Color.WHITE;
    this.speedBoostCheat.backgroundColor = Color.BLACK;
    this.speedBoostCheat.fontSize = 24;


    this.hidePauseUI();
  }

  private showPauseUI(): void {
    this.pause_background.visible = true;
    this.logo.visible = true;
    this.backButton.visible = true;
    this.resume.visible = true;
    this.controls.visible = true;
    this.exit.visible = true;
    this.cheats.visible = true;
  }

  private hidePauseUI(): void {
    this.pause_background.visible = false;
    this.logo.visible = false;
    this.backButton.visible = false;
    this.resume.visible = false;
    this.controls.visible = false;
    this.exit.visible = false;
    this.cheats.visible = false;
    this.hideCheatsUI();
  }

  private showCheatsUI(): void {
    this.unlimitedHealthCheat.visible = true;
    this.AllLevelsCheat.visible = true;
    this.speedBoostCheat.visible = true;
  }

  private hideCheatsUI(): void {
    this.unlimitedHealthCheat.visible = false;
    this.AllLevelsCheat.visible = false;
    this.speedBoostCheat.visible = false;
  }

  /** Initializes the layers in the scene */
  protected initLayers(): void {
    this.addLayer("primary", 10);
    this.addUILayer("slots");
    this.addUILayer("items");
    this.addUILayer("timer");
    this.addUILayer("Counters");
    this.addUILayer("Pause");
    this.addUILayer("night");
    this.getLayer("night").setDepth(0);
    this.getLayer("Pause").setDepth(1);
    this.getLayer("timer").setDepth(1);
    this.getLayer("Counters").setDepth(1);
    this.getLayer("slots").setDepth(1);
    this.getLayer("items").setDepth(2);
  }

  /**
   * Initializes the player in the scene
   */
  protected initializePlayer(): void {
    let player = this.add.animatedSprite(PlayerActor, "player1", "primary");
    player.position.set(40, 40);
    player.battleGroup = 2;

    player.health = 10;
    player.maxHealth = 10;

    // player.inventory.onChange = ItemEvent.INVENTORY_CHANGED
    // this.inventoryHud = new InventoryHUD(this, player.inventory, "inventorySlot", {
    //     start: new Vec2(232, 24),
    //     slotLayer: "slots",
    //     padding: 8,
    //     itemLayer: "items"
    // });

    // Give the player physics
    player.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)));

    // Give the player a healthbar
    let healthbar = new HealthbarHUD(this, player, "primary", {
      size: player.size.clone().scaled(2, 1 / 2),
      offset: player.size.clone().scaled(0, -1 / 2),
    });
    this.healthbars.set(player.id, healthbar);

    // Give the player PlayerAI
    player.addAI(PlayerAI);

    // Start the player in the "IDLE" animation
    player.animation.play("IDLE");

    this.battlers.push(player);
    this.viewport.follow(player);
  }
  /**
   * Initialize the NPCs
   */
  protected initializeNPCs(): void {
    // Get the object data for the red enemies
    let red = this.load.getObject("red");

    // Initialize the red healers
    /*for (let i = 0; i < red.healers.length; i++) {
            let npc = this.add.animatedSprite(NPCActor, "RedHealer", "primary");
            npc.position.set(red.healers[i][0], red.healers[i][1]);
            npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(7, 7)), null, false);

            npc.battleGroup = 1;
            npc.speed = 10;
            npc.health = 10;
            npc.maxHealth = 10;
            npc.navkey = "navmesh";

            // Give the NPC a healthbar
            let healthbar = new HealthbarHUD(this, npc, "primary", {size: npc.size.clone().scaled(2, 1/2), offset: npc.size.clone().scaled(0, -1/2)});
            this.healthbars.set(npc.id, healthbar);

            npc.addAI(HealerBehavior);
            npc.animation.play("IDLE");
            this.battlers.push(npc);
        }

        for (let i = 0; i < red.enemies.length; i++) {
            let npc = this.add.animatedSprite(NPCActor, "RedEnemy", "primary");
            npc.position.set(red.enemies[i][0], red.enemies[i][1]);
            npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(7, 7)), null, false);

            // Give the NPC a healthbar
            let healthbar = new HealthbarHUD(this, npc, "primary", {size: npc.size.clone().scaled(2, 1/2), offset: npc.size.clone().scaled(0, -1/2)});
            this.healthbars.set(npc.id, healthbar);
            
            // Set the NPCs stats
            npc.battleGroup = 1
            npc.speed = 10;
            npc.health = 1;
            npc.maxHealth = 10;
            npc.navkey = "navmesh";

            npc.addAI(GuardBehavior, {target: new BasicTargetable(new Position(npc.position.x, npc.position.y)), range: 100});

            // Play the NPCs "IDLE" animation 
            npc.animation.play("IDLE");
            // Add the NPC to the battlers array
            this.battlers.push(npc);
        }*/

    // Get the object data for the blue enemies
    let blue = this.load.getObject("blue");

    // Initialize the blue enemies
    for (let i = 0; i < blue.enemies.length; i++) {
      let npc = this.add.animatedSprite(NPCActor, "BlueEnemy", "primary");
      npc.position.set(blue.enemies[i][0], blue.enemies[i][1]);
      npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(7, 7)), null, false);

      // Give the NPCS their healthbars
      let healthbar = new HealthbarHUD(this, npc, "primary", {
        size: npc.size.clone().scaled(2, 1 / 2),
        offset: npc.size.clone().scaled(0, -1 / 2),
      });
      this.healthbars.set(npc.id, healthbar);

      npc.battleGroup = 2;
      npc.speed = 10;
      npc.health = 1;
      npc.maxHealth = 10;
      npc.navkey = "navmesh";

      // Give the NPCs their AI
      npc.addAI(ZombieBehavior, { target: this.battlers[0], range: 100 });

      // Play the NPCs "IDLE" animation
      npc.animation.play("IDLE");

      this.battlers.push(npc);
    }

    // Initialize the blue healers
    /*for (let i = 0; i < blue.healers.length; i++) {
            
            let npc = this.add.animatedSprite(NPCActor, "BlueHealer", "primary");
            npc.position.set(blue.healers[i][0], blue.healers[i][1]);
            npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(7, 7)), null, false);

            npc.battleGroup = 2;
            npc.speed = 10;
            npc.health = 1;
            npc.maxHealth = 10;
            npc.navkey = "navmesh";

            let healthbar = new HealthbarHUD(this, npc, "primary", {size: npc.size.clone().scaled(2, 1/2), offset: npc.size.clone().scaled(0, -1/2)});
            this.healthbars.set(npc.id, healthbar);

            npc.addAI(HealerBehavior);
            npc.animation.play("IDLE");
            this.battlers.push(npc);
        }*/
  }

  /**
   * Initialize the items in the scene (healthpacks and laser guns)
   */
  // protected initializeItems(): void {
  //     let laserguns = this.load.getObject("laserguns");
  //     this.laserguns = new Array<LaserGun>(laserguns.items.length);
  //     for (let i = 0; i < laserguns.items.length; i++) {
  //         let sprite = this.add.sprite("laserGun", "primary");
  //         let line = <Line>this.add.graphic(GraphicType.LINE, "primary", {start: Vec2.ZERO, end: Vec2.ZERO});
  //         this.laserguns[i] = LaserGun.create(sprite, line);
  //         sprite.scale.set(0.5, 0.5);
  //         this.laserguns[i].position.set(laserguns.items[i][0], laserguns.items[i][1]);
  //     }

  //     let healthpacks = this.load.getObject("healthpacks");
  //     this.healthpacks = new Array<Healthpack>(healthpacks.items.length);
  //     for (let i = 0; i < healthpacks.items.length; i++) {
  //         let sprite = this.add.sprite("healthpack", "primary");
  //         sprite.scale.set(0.5, 0.5);
  //         this.healthpacks[i] = new Healthpack(sprite);
  //         this.healthpacks[i].position.set(healthpacks.items[i][0], healthpacks.items[i][1]);
  //     }
  // }

  //Initialize the items Material and Fuels
  protected initializeItems(): void {
    let materials = this.load.getObject("materials");
    this.materials = new Array<Material>(materials.items.length);
    for (let i = 0; i < materials.items.length; i++) {
      let sprite = this.add.sprite(MainHW4Scene.MATERIAL_KEY, "primary");
      sprite.scale.set(0.5, 0.5);
      this.materials[i] = new Material(sprite);
      this.materials[i].position.set(
        materials.items[i][0],
        materials.items[i][1]
      );
    }
    let fuels = this.load.getObject("fuels");
    this.fuels = new Array<Fuel>(fuels.items.length);
    for (let i = 0; i < fuels.items.length; i++) {
      let sprite = this.add.sprite(MainHW4Scene.FUEL_KEY, "primary");
      sprite.scale.set(0.5, 0.5);
      this.fuels[i] = new Fuel(sprite);
      this.fuels[i].position.set(fuels.items[i][0], fuels.items[i][1]);
    }
  }
  /**
   * Initializes the navmesh graph used by the NPCs in the HW3Scene. This method is a little buggy, and
   * and it skips over some of the positions on the tilemap. If you can fix my navmesh generation algorithm,
   * go for it.
   *
   * - Peter
   */
  protected initializeNavmesh(): void {
    // Create the graph
    this.graph = new PositionGraph();

    let dim: Vec2 = this.walls.getDimensions();
    for (let i = 0; i < dim.y; i++) {
      for (let j = 0; j < dim.x; j++) {
        let tile: AABB = this.walls.getTileCollider(j, i);
        this.graph.addPositionedNode(tile.center);
      }
    }

    let rc: Vec2;
    for (let i = 0; i < this.graph.numVertices; i++) {
      rc = this.walls.getTileColRow(i);
      if (
        !this.walls.isTileCollidable(rc.x, rc.y) &&
        !this.walls.isTileCollidable(
          MathUtils.clamp(rc.x - 1, 0, dim.x - 1),
          rc.y
        ) &&
        !this.walls.isTileCollidable(
          MathUtils.clamp(rc.x + 1, 0, dim.x - 1),
          rc.y
        ) &&
        !this.walls.isTileCollidable(
          rc.x,
          MathUtils.clamp(rc.y - 1, 0, dim.y - 1)
        ) &&
        !this.walls.isTileCollidable(
          rc.x,
          MathUtils.clamp(rc.y + 1, 0, dim.y - 1)
        ) &&
        !this.walls.isTileCollidable(
          MathUtils.clamp(rc.x + 1, 0, dim.x - 1),
          MathUtils.clamp(rc.y + 1, 0, dim.y - 1)
        ) &&
        !this.walls.isTileCollidable(
          MathUtils.clamp(rc.x - 1, 0, dim.x - 1),
          MathUtils.clamp(rc.y + 1, 0, dim.y - 1)
        ) &&
        !this.walls.isTileCollidable(
          MathUtils.clamp(rc.x + 1, 0, dim.x - 1),
          MathUtils.clamp(rc.y - 1, 0, dim.y - 1)
        ) &&
        !this.walls.isTileCollidable(
          MathUtils.clamp(rc.x - 1, 0, dim.x - 1),
          MathUtils.clamp(rc.y - 1, 0, dim.y - 1)
        )
      ) {
        // Create edge to the left
        rc = this.walls.getTileColRow(i + 1);
        if ((i + 1) % dim.x !== 0 && !this.walls.isTileCollidable(rc.x, rc.y)) {
          this.graph.addEdge(i, i + 1);
          // this.add.graphic(GraphicType.LINE, "graph", {start: this.graph.getNodePosition(i), end: this.graph.getNodePosition(i + 1)})
        }
        // Create edge below
        rc = this.walls.getTileColRow(i + dim.x);
        if (
          i + dim.x < this.graph.numVertices &&
          !this.walls.isTileCollidable(rc.x, rc.y)
        ) {
          this.graph.addEdge(i, i + dim.x);
          // this.add.graphic(GraphicType.LINE, "graph", {start: this.graph.getNodePosition(i), end: this.graph.getNodePosition(i + dim.x)})
        }
      }
    }

    // Set this graph as a navigable entity
    let navmesh = new Navmesh(this.graph);
    // Add different strategies to use for this navmesh
    navmesh.registerStrategy("direct", new DirectStrategy(navmesh));
    navmesh.registerStrategy("astar", new AstarStrategy(navmesh));
    // Select A* as our navigation strategy
    navmesh.setStrategy("astar");

    // Add this navmesh to the navigation manager
    this.navManager.addNavigableEntity("navmesh", navmesh);
  }

  public getBattlers(): Battler[] {
    return this.battlers;
  }

  public getWalls(): OrthogonalTilemap {
    return this.walls;
  }

  public getHealthpacks(): Healthpack[] {
    return this.healthpacks;
  }

  public getLaserGuns(): LaserGun[] {
    return this.laserguns;
  }

  /**
   * Checks if the given target position is visible from the given position.
   * @param position
   * @param target
   * @returns
   */
  public isTargetVisible(position: Vec2, target: Vec2): boolean {
    // Get the new player location
    let start = position.clone();
    let delta = target.clone().sub(start);

    // Iterate through the tilemap region until we find a collision
    let minX = Math.min(start.x, target.x);
    let maxX = Math.max(start.x, target.x);
    let minY = Math.min(start.y, target.y);
    let maxY = Math.max(start.y, target.y);

    // Get the wall tilemap
    let walls = this.getWalls();

    let minIndex = walls.getTilemapPosition(minX, minY);
    let maxIndex = walls.getTilemapPosition(maxX, maxY);

    let tileSize = walls.getScaledTileSize();

    for (let col = minIndex.x; col <= maxIndex.x; col++) {
      for (let row = minIndex.y; row <= maxIndex.y; row++) {
        if (walls.isTileCollidable(col, row)) {
          // Get the position of this tile
          let tilePos = new Vec2(
            col * tileSize.x + tileSize.x / 2,
            row * tileSize.y + tileSize.y / 2
          );

          // Create a collider for this tile
          let collider = new AABB(tilePos, tileSize.scaled(1 / 2));

          let hit = collider.intersectSegment(start, delta, Vec2.ZERO);

          if (
            hit !== null &&
            start.distanceSqTo(hit.pos) < start.distanceSqTo(target)
          ) {
            // We hit a wall, we can't see the player
            return false;
          }
        }
      }
    }
    return true;
  }
}
