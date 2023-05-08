import PositionGraph from "../../../Wolfie2D/DataTypes/Graphs/PositionGraph";
import Actor from "../../../Wolfie2D/DataTypes/Interfaces/Actor";
import AABB from "../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import { GraphicType } from "../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Line from "../../../Wolfie2D/Nodes/Graphics/Line";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Navmesh from "../../../Wolfie2D/Pathfinding/Navmesh";
import DirectStrategy from "../../../Wolfie2D/Pathfinding/Strategies/DirectStrategy";
import RenderingManager from "../../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../../Wolfie2D/SceneGraph/Viewport";
import Timer from "../../../Wolfie2D/Timing/Timer";
import Color from "../../../Wolfie2D/Utils/Color";
import MathUtils from "../../../Wolfie2D/Utils/MathUtils";
import NPCActor from "../../Actors/NPCActor";
import PlayerActor from "../../Actors/PlayerActor";
import GuardBehavior from "../../AI/NPC/NPCBehavior/GaurdBehavior";
import HealerBehavior from "../../AI/NPC/NPCBehavior/HealerBehavior";
import ZombieBehavior from "../../AI/NPC/NPCBehavior/ZombieBehavior";
import PlayerAI from "../../AI/Player/PlayerAI";
import {
  ItemEvent,
  PlayerEvent,
  BattlerEvent,
  InputEvent,
  CheatEvent,
  SceneEvent,
} from "../../Events";
import Battler from "../../GameSystems/BattleSystem/Battler";
import BattlerBase from "../../GameSystems/BattleSystem/BattlerBase";
import HealthbarHUD from "../../GameSystems/HUD/HealthbarHUD";
import EnergybarHUD from "../../GameSystems/HUD/EnergybarHUD";
import InventoryHUD from "../../GameSystems/HUD/InventoryHUD";
import Inventory from "../../GameSystems/ItemSystem/Inventory";
import Item from "../../GameSystems/ItemSystem/Item";
import Healthpack from "../../GameSystems/ItemSystem/Items/Healthpack";
import LaserGun from "../../GameSystems/ItemSystem/Items/LaserGun";
import { ClosestPositioned } from "../../GameSystems/Searching/HW4Reducers";
import BasicTargetable from "../../GameSystems/Targeting/BasicTargetable";
import Position from "../../GameSystems/Targeting/Position";
import AstarStrategy from "../../Pathfinding/AstarStrategy";
import HW4Scene from "./HW4Scene";
import Label from "../../../Wolfie2D/Nodes/UIElements/Label";
import Button from "../../../Wolfie2D/Nodes/UIElements/Button";
import Layer from "../../../Wolfie2D/Scene/Layer";
import { UIElementType } from "../../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Material from "../../GameSystems/ItemSystem/Items/Material";
import Fuel from "../../GameSystems/ItemSystem/Items/Fuel";
import Graphic from "../../../Wolfie2D/Nodes/Graphic";
import MainMenu from "../MainMenu";
import CanvasNode from "../../../Wolfie2D/Nodes/CanvasNode";
import LightMask from "../../Custom/LightMask";
import SpotlightShader from "../../Custom/Shaders/SpotLightShader";
import CanvasRenderer from "../../../Wolfie2D/Rendering/CanvasRenderer";
import GraphUtils from "../../../Wolfie2D/Utils/GraphUtils";
import PlayerWeapon from "../../AI/Player/PlayerWeapon";
import { PhysicsGroups } from "../../PhysicsGroups";
import Particle from "../../../Wolfie2D/Nodes/Graphics/Particle";
import Input from "../../../Wolfie2D/Input/Input";
import Scene from "../../../Wolfie2D/Scene/Scene";
import { LevelConfig, levelConfigs } from "./levelConfig";
import {
  ZombieStats,
  baseZombieStats,
  applyMultiplier,
  ZombieType,
} from "./zombieStats";

const BattlerGroups = {
  RED: 1,
  BLUE: 2,
} as const;

const upgradeOptions = [
  "Health",
  "Armor",
  "MachineGun",
  "Helicopter Health",
  "Movement Speed",
  "Stronger Bullets",
];

const upgradeCosts = [2, 1, 10, 5, 6, 9];

export default class MainHW4Scene extends HW4Scene {
  //Upgrade
  private onScreenZombies: number;
  public isPaused: boolean;
  private darknessCounter: number = 1;
  private isUpgrading: boolean;

  private player: PlayerActor;
  protected invincibilityTimer: Timer | null = null;

  /** GameSystems in the HW3 Scene */
  private inventoryHud: InventoryHUD;

  //Timers
  private countDownTimer: Timer;
  private timerLabel: Label;
  private elapsedTime: number;

  //Level stuff
  protected nextLevel: new (...args: any) => Scene;

  //UI Sprites
  private materialIcon: Sprite;
  private fuelIcon: Sprite;
  private pause_background: Sprite;
  private upgrade_background: Sprite;
  private logo: Sprite;
  private night: Sprite;
  private upgradeScreenMaterial: Sprite;

  //UI Counter Labels
  private materialCounter: Label;
  private fuelCounter: Label;

  //UI Pause Label & Buttons
  private pauseBackButton: Button;
  private resume: Label;
  private controls: Label;
  private exit: Label;
  private cheats: Label;
  // private AllLevelsCheat: Button;
  private unlimitedHealthCheat: Label;
  private endCycleCheat: Label;
  private addMaterialCheat: Label;

  //UI control labels
  private upLabel: Label;
  private downLabel: Label;
  private leftLabel: Label;
  private rightLabel: Label;
  private shootLabel: Label;
  private pauseLabel: Label;
  private pickupLabel: Label;
  private rollLabel: Label;

  private objectiveLabel: Label;
  private objectDescriptionLabel: Label[] = [];

  //Upgrade Screen UI
  private upgradeBackButton: Button;
  private upgradeOne: Button;
  private upgradeTwo: Button;
  private upgradeThree: Button;
  private upgradeMaterial: Label;
  private upgradeOneCost: Label;
  private upgradeTwoCost: Label;
  private upgradeThreeCost: Label;
  private upgradeOneMat: Sprite;
  private upgradeTwoMat: Sprite;
  private upgradeThreeMat: Sprite;
  private upgradeRefreshButton: Button;

  private lightMask: LightMask;
  private lightMaskLayer: Layer;

  private isNight: boolean;
  private wasNight: boolean;

  private initialViewportSize: Vec2;

  private testLabel: Label;

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
  private zombies: NPCActor[];
  /** Healthbars for the battlers */
  private healthbars: Map<number, HealthbarHUD>;
  private energybars: Map<number, EnergybarHUD>;

  private bases: BattlerBase[];

  private healthpacks: Array<Healthpack>;
  private laserguns: Array<LaserGun>;

  private materials: Array<Material>;
  private fuels: Array<Fuel>;

  // The wall layer of the tilemap
  private walls: OrthogonalTilemap;

  // The position graph for the navmesh
  private graph: PositionGraph;
  playerWeaponSystem: PlayerWeapon;

  //Keys for levels
  protected levelKey: string;
  protected wallsLayerKey: string;
  protected playerSpriteKey: string;
  protected tilemapScale: Vec2;
  protected playerData: Record<string, any>;
  protected currentLevelConfig: LevelConfig;

  public constructor(
    viewport: Viewport,
    sceneManager: SceneManager,
    renderingManager: RenderingManager,
    options: Record<string, any>
  ) {
    super(viewport, sceneManager, renderingManager, {
      ...options,
      physics: {
        groupNames: [PhysicsGroups.PLAYER_WEAPON, PhysicsGroups.ZOMBIE],
        collisions: [
          [1, 1],
          [1, 1],
        ],
      },
    });

    this.battlers = new Array<Battler & Actor>();
    this.healthbars = new Map<number, HealthbarHUD>();
    this.energybars = new Map<number, EnergybarHUD>();
    this.zombies = new Array<NPCActor>();

    this.laserguns = new Array<LaserGun>();
    this.healthpacks = new Array<Healthpack>();

    this.materials = new Array<Material>();
    this.fuels = new Array<Fuel>();
  }

  /**
   * @see Scene.startScene
   */
  public override startScene() {
    console.log("MAIN SCENEEEEE: ", this.sceneManager);
    if (this.sceneManager.playerData) {
      this.playerData = this.sceneManager.playerData;
    } else {
      // Set default playerData if not available
      this.playerData = {
        maxHealth: 100,
        health: 100,
        weapon: new PlayerWeapon(1, Vec2.ZERO, 1000, 3, 0, 1),
        speed: 1,
        armor: 0,
        bulletDamage: 10,
        materialAmt: 0,
        energy: 100,
        maxEnergy: 100,
      };
    }
    this.onScreenZombies = 0;
    this.currentLevelConfig = levelConfigs[this.levelKey];

    console.log(this.levelKey);

    this.initialViewportSize = new Vec2(
      this.viewport.getHalfSize().x * 2,
      this.viewport.getHalfSize().y * 2
    );
    // Add in the tilemap
    let tilemapLayers = this.add.tilemap(this.levelKey, this.tilemapScale);
    // Get the wall layer
    this.walls = <OrthogonalTilemap>tilemapLayers[1].getItems()[0];

    // Set the viewport bounds to the tilemap
    let tilemapSize: Vec2 = this.walls.size;

    this.viewport.setBounds(0, 0, tilemapSize.x, tilemapSize.y);
    this.viewport.setZoomLevel(2);

    this.initLayers();
    this.initializeUI();
    this.initializeUpgradeUI();
    this.initPauseUI();

    this.elapsedTime = 0;
    this.countDownTimer = new Timer(121 * 1000);
    this.countDownTimer.start();

    this.initializeWeaponSystem();
    // Create the player
    this.initializePlayer();

    this.initializeItems();

    this.initializeNavmesh();

    //this.initializeNPCs();

    this.night = this.add.sprite(MainHW4Scene.NIGHT_KEY, "night");
    this.night.alpha = 0;
    this.night.scale.set(2, 2);
    this.night.position.set(
      this.viewport.getHalfSize().x,
      this.viewport.getHalfSize().y
    );

    //LIGHT MASK
    this.initializeSpotLight();

    //Initialize the day/night cycle
    this.isNight = false;

    // Subscribe to relevant events
    this.receiver.subscribe("healthpack");
    this.receiver.subscribe("enemyDied");
    this.receiver.subscribe(ItemEvent.ITEM_REQUEST);
    this.receiver.subscribe(ItemEvent.MATERIAL_PICKED_UP);
    this.receiver.subscribe(ItemEvent.FUEL_PICKED_UP);
    this.receiver.subscribe(InputEvent.PAUSED);
    this.receiver.subscribe("exit");
    this.receiver.subscribe("unPause");
    this.receiver.subscribe("showCheats");
    this.receiver.subscribe("showControls");
    this.receiver.subscribe(CheatEvent.INFINITE_HEALTH);
    this.receiver.subscribe(CheatEvent.END_DAY);
    this.receiver.subscribe(CheatEvent.ADD_MAT);
    this.receiver.subscribe(SceneEvent.LEVEL_END);
    this.receiver.subscribe(SceneEvent.LEVEL_START);
    this.receiver.subscribe("endUpgrade");
    this.receiver.subscribe("upgradeOneChose");
    this.receiver.subscribe("upgradeTwoChose");
    this.receiver.subscribe("upgradeThreeChose");
    this.receiver.subscribe("refreshUpgrade");

    // Add a UI for health
    this.addUILayer("health");

    this.receiver.subscribe(PlayerEvent.PLAYER_KILLED);
    this.receiver.subscribe(BattlerEvent.BATTLER_KILLED);
    this.receiver.subscribe(BattlerEvent.BATTLER_RESPAWN);
    this.receiver.subscribe(BattlerEvent.HIT);
    this.receiver.subscribe(BattlerEvent.OVERLAP);
    this.receiver.subscribe(BattlerEvent.ROLL);
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
      if (this.invincibilityTimer) {
        this.player.energy -= this.player.maxEnergy * (deltaT * 2);
        this.player.energy = Math.max(this.player.energy, 0);
        this.invincibilityTimer.update(deltaT);
        if (this.invincibilityTimer.isStopped()) {
          // Reset the player's scale
          this.player.scale.set(1, 1);
          this.player.speed = 1;
          this.player.invincible = false;
          this.invincibilityTimer = null;
        }
      } else {
        // Recharge energy over 5 seconds (5000ms)
        this.player.energy += this.player.maxEnergy * (deltaT / 3);
        this.player.energy = Math.min(
          this.player.energy,
          this.player.maxEnergy
        );
      }
      // this.inventoryHud.update(deltaT);
      this.healthbars.forEach((healthbar) => healthbar.update(deltaT));
      if (this.battlers[0].health <= 0) {
        this.emitter.fireEvent(PlayerEvent.PLAYER_KILLED);
      }
      this.energybars.forEach((energybar) => energybar.update(deltaT));

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
      if (this.isNight) {
        if (remainingTime <= 0) {
          this.levelEnd();
        }
      }
      if (!this.isNight && this.elapsedTime >= 5 * this.darknessCounter) {
        this.darknessCounter++;
        this.night.alpha += 0.025;
      } else if (this.isNight && this.elapsedTime % 20 === 0) {
        this.night.alpha -= 0.05;
      }
      if (remainingTime <= 0) {
        // console.log("PLAYER: ", this.battlers[0]);
        this.isNight = !this.isNight;

        if (this.isNight !== this.wasNight) {
          this.wasNight = this.isNight;

          if (this.isNight) {
            //Create the upgrade screen here
            this.night.alpha = 0.9;
            this.lightMask.alpha = 0.7;
            this.initializeNPCs();
            this.showUpgradesUI();
            this.isPaused = true;
          } else {
            this.night.alpha = 0;
            this.lightMask.alpha = 0;
          }
          this.countDownTimer.reset();
          this.countDownTimer.start();
          this.elapsedTime = 0;
        }
      }
    }
  }

  protected levelEnd(): void {
    if (this.playerData) {
      this.sceneManager.playerData = {
        maxHealth: this.playerData.maxHealth,
        health: this.playerData.health,
        weapon: this.playerData.weapon,
        speed: this.playerData.speed,
        armor: this.playerData.armor,
        bulletDamage: this.playerData.bulletDamage,
        materialAmt: parseInt(this.materialCounter.text),
        energy: 100,
        maxEnergy: 100,
      };
    }
    this.emitter.fireEvent(SceneEvent.LEVEL_END, {
      scene: this,
      init: { playerData: this.playerData },
    });
  }

  initializeSpotLight() {
    // this.testLabel = <Label>this.add.uiElement(UIElementType.LABEL, "lightMask", {position: this.viewport.getCenter(), text: "TESTLJKDHSAJKDHKHASKDHJKASHJKDHJAS"});
    // this.testLabel.textColor = Color.WHITE;
    // this.testLabel.fontSize = 20;

    this.lightMask = <LightMask>this.add.lightMask("lightMask");
    this.getLayer("lightMask").addNode(this.lightMask);

    this.lightMask.color = Color.fromStringHex("#000000");
    this.lightMask.alpha = 1; // Set initial alpha to 0, it will be updated based on day/night cycle
    this.lightMask.size = new Vec2(100, 100);
    this.lightMask.useCustomShader(SpotlightShader.KEY);

    // console.log("LIGHT MASK: ", this.lightMask);
    // console.log("PRIMARY LAYER: ", this.primaryLayer);
  }

  /** Initializes the layers in the scene */
  protected initLayers(): void {
    this.addLayer("primary", 10);
    this.addLayer("graph", 50);
    this.addUILayer("lightMask");
    this.addUILayer("slots");
    this.addUILayer("items");
    this.addUILayer("timer");
    this.addUILayer("Counters");
    this.addUILayer("Pause");
    this.addUILayer("Upgrade");
    this.addUILayer("night");
    this.getLayer("lightMask").setDepth(11);
    this.getLayer("night").setDepth(1);
    this.getLayer("Pause").setDepth(2);
    this.getLayer("Upgrade").setDepth(3);
    this.getLayer("timer").setDepth(2);
    this.getLayer("Counters").setDepth(2);
    this.getLayer("slots").setDepth(2);
    this.getLayer("items").setDepth(1);
  }

  /*static playerWeaponSystem(): PlayerWeapon {
    return this.playerWeaponSystem;
  }*/

  protected initializeWeaponSystem(): void {
    if (this.playerData) {
      this.playerWeaponSystem = this.playerData.weapon;
      this.playerWeaponSystem.initializePool(this, "primary");
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
          this.resetViewportSize();
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
        case "showControls": {
          this.handleShowControls();
          break;
        }
        case InputEvent.PAUSED: {
          this.handlePaused();
          break;
        }
        case "endUpgrade": {
          this.isPaused = false;
          this.hideUpgradesUI();
          break;
        }
        case "upgradeOneChose": {
          this.handleUpgradeOne();
          break;
        }
        case "upgradeTwoChose": {
          this.handleUpgradeTwo();
          break;
        }
        case "upgradeThreeChose": {
          this.handleUpgradeThree();
          break;
        }
        case "refreshUpgrade": {
          this.handleRefreshUpgrade();
          break;
        }
        case CheatEvent.ADD_MAT: {
          this.handleAddMaterialCheat();
          break;
        }
      }
    } else if (!this.isPaused || event.type === InputEvent.PAUSED) {
      switch (event.type) {
        case BattlerEvent.ROLL: {
          if (this.player.energy === this.player.maxEnergy) {
            this.handleRoll(1000);
          }
          break;
        }
        case PlayerEvent.PLAYER_KILLED: {
          this.handlePlayerKilled();
          break;
        }
        case SceneEvent.LEVEL_START: {
          Input.enableInput();
          break;
        }
        case SceneEvent.LEVEL_END: {
          this.resetViewportSize();
          let playerData = this.sceneManager.playerData;
          this.sceneManager.changeToScene(this.nextLevel, {}, playerData);
          break;
        }

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
        case CheatEvent.INFINITE_HEALTH: {
          this.handleInfiniteHealth();
          break;
        }
        case CheatEvent.ADD_MAT: {
          this.handleAddMaterialCheat();
          break;
        }
        case CheatEvent.END_DAY: {
          this.handleEndDayCheat();
          break;
        }
        case BattlerEvent.HIT: {
          this.handleParticleHit(event.data.get("node"));
          break;
        }
        case BattlerEvent.OVERLAP: {
          this.handleZombieRepulsion(event.data.get("node"));
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

  private handleRoll(duration: number): void {
    if (!this.invincibilityTimer) {
      this.player.scale.set(0.5, 0.5);
      this.invincibilityTimer = new Timer(duration);
      this.invincibilityTimer.start();
      this.player.speed = 3;
      this.player.invincible = true;
    }
  }

  private refreshUpgrades(button: Button, label: Label, sprite: Sprite): void {
    button.visible = true;
    label.visible = true;
    sprite.visible = true;
  }
  private handleRefreshUpgrade(): void {
    if (this.upgradeRefreshButton.text === "FREE") {
      this.refreshUpgrades(
        this.upgradeOne,
        this.upgradeOneCost,
        this.upgradeOneMat
      );
      this.refreshUpgrades(
        this.upgradeTwo,
        this.upgradeTwoCost,
        this.upgradeTwoMat
      );
      this.refreshUpgrades(
        this.upgradeThree,
        this.upgradeThreeCost,
        this.upgradeThreeMat
      );
      const availableOptions = [...upgradeOptions];
      const upgradeCost = [...upgradeCosts];
      this.assignRandomUpgradeText(
        this.upgradeOne,
        this.upgradeOneCost,
        availableOptions,
        upgradeCost
      );
      this.assignRandomUpgradeText(
        this.upgradeTwo,
        this.upgradeTwoCost,
        availableOptions,
        upgradeCost
      );
      this.assignRandomUpgradeText(
        this.upgradeThree,
        this.upgradeThreeCost,
        availableOptions,
        upgradeCost
      );
      this.upgradeRefreshButton.text = "Refresh - 4";
    } else if (parseInt(this.materialCounter.text) >= 4) {
      this.materialCounter.text = (
        parseInt(this.materialCounter.text) - 4
      ).toString();
      this.upgradeMaterial.text = this.materialCounter.text;
      const availableOptions = [...upgradeOptions];
      const upgradeCost = [...upgradeCosts];
      this.assignRandomUpgradeText(
        this.upgradeOne,
        this.upgradeOneCost,
        availableOptions,
        upgradeCost
      );
      this.assignRandomUpgradeText(
        this.upgradeTwo,
        this.upgradeTwoCost,
        availableOptions,
        upgradeCost
      );
      this.assignRandomUpgradeText(
        this.upgradeThree,
        this.upgradeThreeCost,
        availableOptions,
        upgradeCost
      );
      this.refreshUpgrades(
        this.upgradeOne,
        this.upgradeOneCost,
        this.upgradeOneMat
      );
      this.refreshUpgrades(
        this.upgradeTwo,
        this.upgradeTwoCost,
        this.upgradeTwoMat
      );
      this.refreshUpgrades(
        this.upgradeThree,
        this.upgradeThreeCost,
        this.upgradeThreeMat
      );
    }
  }

  private assignRandomUpgradeText(
    button: Button,
    label: Label,
    availableOptions: string[],
    upgradeCost: number[]
  ): void {
    const randomIndex = Math.floor(Math.random() * availableOptions.length);
    button.text = availableOptions[randomIndex];
    label.text = upgradeCost[randomIndex].toString();
    availableOptions.splice(randomIndex, 1);
    upgradeCost.splice(randomIndex, 1);
  }

  private selectedUpgrade(button: Button, label: Label, sprite: Sprite): void {
    button.visible = false;
    label.visible = false;
    sprite.visible = false;
  }

  private handleUpgradeOne(): void {
    if (
      !this.upgradeOne.isDisabled &&
      parseInt(this.materialCounter.text) >= parseInt(this.upgradeOneCost.text)
    ) {
      this.materialCounter.text = (
        parseInt(this.materialCounter.text) - parseInt(this.upgradeOneCost.text)
      ).toString();
      this.selectedUpgrade(
        this.upgradeOne,
        this.upgradeOneCost,
        this.upgradeOneMat
      );
      this.applyUpgrade(this.upgradeOne);
    }
  }

  private handleUpgradeTwo(): void {
    if (
      !this.upgradeTwo.isDisabled &&
      parseInt(this.materialCounter.text) >= parseInt(this.upgradeTwoCost.text)
    ) {
      this.materialCounter.text = (
        parseInt(this.materialCounter.text) - parseInt(this.upgradeTwoCost.text)
      ).toString();
      this.selectedUpgrade(
        this.upgradeTwo,
        this.upgradeTwoCost,
        this.upgradeTwoMat
      );
      this.applyUpgrade(this.upgradeTwo);
    }
  }

  private handleUpgradeThree(): void {
    if (
      !this.upgradeThree.isDisabled &&
      parseInt(this.materialCounter.text) >=
        parseInt(this.upgradeThreeCost.text)
    ) {
      this.materialCounter.text = (
        parseInt(this.materialCounter.text) -
        parseInt(this.upgradeThreeCost.text)
      ).toString();
      this.selectedUpgrade(
        this.upgradeThree,
        this.upgradeThreeCost,
        this.upgradeThreeMat
      );
      this.applyUpgrade(this.upgradeThree);
    }
  }

  applyUpgrade(button: Button): void {
    const upgradeText = button.text;
    this.upgradeMaterial.text = ":" + this.materialCounter.text;
    if (
      this.upgradeOne.visible === false &&
      this.upgradeTwo.visible === false &&
      this.upgradeThree.visible === false
    ) {
      this.upgradeRefreshButton.text = "FREE";
    }

    switch (upgradeText) {
      case "Health":
        this.player.maxHealth += 10;
        this.playerData.maxHealth += 10;
        console.log("Health Upgrade");
        break;
      case "Armor":
        this.player.armor += 1;
        this.playerData.armor += 1;
        console.log("Armor Upgrade");
        break;
      case "MachineGun":
        const increaseAmount = 3;
        const particleSystem = this.playerWeaponSystem;

        // Increase the pool size and max particles per frame
        particleSystem.increasePoolSize(increaseAmount, this, "primary");
        particleSystem.increaseMaxParticlesPerFrame(increaseAmount);
        // this.playerWeaponSystem = new PlayerWeapon(this.spread + 5, Vec2.ZERO, 1000, 3, 0, this.spread + 5);
        // this.playerWeaponSystem.initializePool(this, "primary");

        console.log("MachineGun Upgrade");
        break;
      case "Helicopter Health":
        // Apply Helicopter Health upgrade
        console.log("Helicopter Health Upgrade");
        break;
      case "Movement Speed":
        this.player.speed *= 1.1;
        this.playerData.speed = this.player.speed;
        console.log("Movement Speed Upgrade");
        break;
      case "Stronger Bullets":
        this.player.bulletDamage += 5;
        this.playerData.bulletDamage += 5;
        console.log("Stronger Bullets Upgrade");
        break;
    }
  }

  private handleAddMaterialCheat(): void {
    const currentValue = parseInt(this.materialCounter.text);
    this.materialCounter.text = (currentValue + 10).toString();
    this.upgradeMaterial.text = ":" + this.materialCounter.text;
  }

  handlePlayerKilled(): void {
    this.resetViewportSize();
    this.sceneManager.changeToScene(MainMenu);
  }

  protected handleZombieRepulsion(zombieId: number): void {
    let zombies = this.zombies;
    //console.log(zombies);
    let thisZombie = zombies.find((zombie) => zombie.id === zombieId);
    if (thisZombie !== undefined) {
      for (let zombie of zombies) {
        if (
          zombie.id !== zombieId &&
          this.zombieCollision(thisZombie, zombie)
        ) {
          //console.log(thisZombie.id+","+zombie.id);
          /*let dx = thisZombie.boundary.x - zombie.boundary.x;
          let dy = thisZombie.boundary.y - zombie.boundary.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          let nx = dx / distance;
          let ny = dy / distance;

          // Calculate the dot product of the velocity and the normal/tangent vectors
          let dpNorm1 =
            thisZombie._velocity.x * nx + thisZombie._velocity.y * ny;
          let dpNorm2 = zombie._velocity.x * nx + zombie._velocity.y * ny;

          // Calculate the new velocity vectors after the collision
          let m1 =
            (dpNorm1 * (thisZombie._velocity.mag() - zombie._velocity.mag()) +
              2 * zombie._velocity.mag() * dpNorm2) /
            (thisZombie._velocity.mag() + zombie._velocity.mag());
          let m2 =
            (dpNorm2 * (zombie._velocity.mag() - thisZombie._velocity.mag()) +
              2 * thisZombie._velocity.mag() * dpNorm1) /
            (thisZombie._velocity.mag() + zombie._velocity.mag());
          //console.log("old"+thisZombie._velocity.x + "," + thisZombie._velocity.y);
          thisZombie._velocity.x = nx * m1;
          thisZombie._velocity.y = ny * m1;
          //console.log(thisZombie._velocity.x+","+thisZombie._velocity.y);
          zombie._velocity.x = nx * m2;
          zombie._velocity.y = ny * m2;*/
          /*let dx = thisZombie. - zombie.x;
          let dy = thisZombie.y - zombie.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          let nx = dx / distance;
          let ny = dy / distance;

          // Calculate the new positions of the zombies after the collision
          let x1 = thisZombie.x;
          let y1 = thisZombie.y;
          let x2 = zombie.x;
          let y2 = zombie.y;
          let p =
            (2 * ((x1 - x2) * nx + (y1 - y2) * ny)) /
            (thisZombie.mass + zombie.mass);
          let x1New = x1 - p * thisZombie.mass * nx;
          let y1New = y1 - p * thisZombie.mass * ny;
          let x2New = x2 + p * zombie.mass * nx;
          let y2New = y2 + p * zombie.mass * ny;

          // Update the positions of the zombies
          thisZombie.x = x1New;
          thisZombie.y = y1New;
          zombie.x = x2New;
          zombie.y = y2New;*/
        }
      }
    }
  }

  protected handleParticleHit(particleId: number): void {
    let particles = this.playerWeaponSystem.getPool();
    console.log(particles);
    let particle = particles.find((particle) => particle.id === particleId);
    if (particle !== undefined) {
      // Get the destructible tilemap
      let zombies = this.zombies;
      if (particle.age > 0) {
        particle.active = true;
        particle.visible = true;
        // Loop over all possible tiles the particle could be colliding with
        for (let zombie of zombies) {
          if (this.particleHitZombie(zombie, particle)) {
            zombie.health -= this.player.bulletDamage - zombie.armor;
            particle.setParticleInactive();
            // console.log("BULLETO DAMAGE: ", this.player.bulletDamage);
            // console.log("ZOMB HEALTH: ", zombie.health)
            // console.log(zombie.id + " hit");
            particle.age = 0;
            particle.visible = false;
            particle.active = false;
            break;
          }
        }
      }
    }
  }

  protected particleHitZombie(zombie: NPCActor, particle: Particle): boolean {
    // TODO detect whether a particle hit a tile
    let zombieAABB = zombie.boundary;
    let particleAABB = particle.boundary;

    if (
      particleAABB.right < zombieAABB.left ||
      particleAABB.left > zombieAABB.right ||
      particleAABB.bottom < zombieAABB.top ||
      particleAABB.top > zombieAABB.bottom
    ) {
      // the particle and tile do not intersect, so there is no collision
      return false;
    } else {
      // the particle and tile intersect, so there is a collision
      return true;
    }
  }
  protected zombieCollision(zombieA: NPCActor, zombieB: NPCActor): boolean {
    let b1 = zombieA.boundary;
    let b2 = zombieB.boundary;

    if (
      b2.right < b1.left ||
      b2.left > b1.right ||
      b2.bottom < b1.top ||
      b2.top > b1.bottom
    ) {
      // the particle and tile do not intersect, so there is no collision
      return false;
    } else {
      // the particle and tile intersect, so there is a collision
      return true;
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
  //PICKING UP MATERIALS
  private handleMaterialPickedUp(): void {
    const currentValue = parseInt(this.materialCounter.text);
    this.materialCounter.text = (currentValue + 1).toString();
    this.upgradeMaterial.text = ":" + this.materialCounter.text;
  }

  private handleFuelPickedUp(): void {
    const currentValue = parseInt(this.fuelCounter.text);
    this.fuelCounter.text = (currentValue + 1).toString();
  }

  //PAUSE SCREEN
  private handlePaused(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused && !this.isUpgrading) {
      this.showPauseUI();
    } else if (this.isPaused && this.isUpgrading) {
      this.showUpgradesUI();
    } else {
      this.hidePauseUI();
    }
  }

  private handleShowCheats(): void {
    this.showCheatsUI();
  }

  private handleShowControls(): void {
    this.showControlsUI();
  }

  private handleEndDayCheat(): void {
    this.elapsedTime = this.countDownTimer.getTotalTime();
  }

  //handling cheats
  private handleInfiniteHealth(): void {
    this.battlers[0].health = 9999999;
    this.battlers[0].maxHealth = 9999999;
    this.healthbars.get(this.battlers[0].id).visible = false;
  }

  /**
   * Handles an NPC being killed by unregistering the NPC from the scenes subsystems
   * @param event an NPC-killed event
   */
  protected handleBattlerKilled(event: GameEvent): void {
    let id: number = event.data.get("id");
    let battler = this.battlers.find((b) => b.id === id);

    if (battler) {
      this.onScreenZombies -= 1;
      battler.battlerActive = false;
      this.healthbars.get(id).visible = false;
      this.spawnMaterial(battler.position);
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
        text: this.playerData.materialAmt.toString(),
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

  initializeUpgradeUI(): void {
    const center = this.viewport.getCenter();
    const vp = this.viewport.getHalfSize();
    // Background
    this.upgrade_background = this.add.sprite(
      MainHW4Scene.PAUSE_BG_KEY,
      "Upgrade"
    );
    const imageSize = this.upgrade_background.size;
    const scaleX = (this.viewport.getHalfSize().x * 2) / imageSize.x;
    const scaleY = (this.viewport.getHalfSize().y * 2) / imageSize.y;
    this.upgrade_background.scale.set(scaleX, scaleY);
    this.upgrade_background.position
      .copy(center)
      .sub(this.viewport.getOrigin());

    this.upgradeScreenMaterial = this.add.sprite(
      MainHW4Scene.MATERIAL_KEY,
      "Upgrade"
    );
    this.upgradeScreenMaterial.position
      .set(center.x - vp.x + 50, center.y - vp.y + 25)
      .sub(this.viewport.getOrigin());
    this.upgradeScreenMaterial.scale.set(0.5, 0.5);

    this.upgradeMaterial = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Upgrade",
      {
        position: new Vec2(center.x - vp.x + 65, center.y - vp.y + 25).sub(
          this.viewport.getOrigin()
        ),
        text: ":" + this.materialCounter.text,
      }
    );

    this.upgradeBackButton = <Button>this.add.uiElement(
      UIElementType.BUTTON,
      "Upgrade",
      {
        position: new Vec2(vp.x + 2 * (vp.x / 10), vp.y + vp.y - vp.y / 10),
        text: "Continue",
      }
    );

    this.upgradeBackButton.size.set(80, 50);
    this.upgradeBackButton.fontSize = 15;
    this.upgradeBackButton.scale.set(0.75, 0.5);
    this.upgradeBackButton.borderWidth = 2;
    this.upgradeBackButton.borderColor = Color.WHITE;
    this.upgradeBackButton.backgroundColor = Color.BLACK;
    this.upgradeBackButton.onClickEventId = "endUpgrade";

    this.upgradeRefreshButton = <Button>this.add.uiElement(
      UIElementType.BUTTON,
      "Upgrade",
      {
        position: new Vec2(vp.x - 2 * (vp.x / 10), vp.y + vp.y - vp.y / 10),
        text: "Refresh - 4",
      }
    );
    this.upgradeRefreshButton.size.set(80, 50);
    this.upgradeRefreshButton.scale.set(0.75, 0.5);
    this.upgradeRefreshButton.fontSize = 15;
    this.upgradeRefreshButton.borderWidth = 2;
    this.upgradeRefreshButton.borderColor = Color.WHITE;
    this.upgradeRefreshButton.backgroundColor = Color.BLACK;
    this.upgradeRefreshButton.onClickEventId = "refreshUpgrade";

    //Upgrade Icon
    this.upgradeOne = <Button>this.add.uiElement(
      UIElementType.BUTTON,
      "Upgrade",
      {
        position: new Vec2(vp.x - vp.x / 2 - vp.x / 10, vp.y),
        text: "ERR",
      }
    );
    this.upgradeOne.size.set(vp.x, vp.y * 2);
    this.upgradeOne.scale.set(0.5, 0.5);
    this.upgradeOne.backgroundColor = Color.WHITE;
    this.upgradeOne.borderColor = Color.BLACK;
    this.upgradeOne.textColor = Color.BLACK;
    this.upgradeOne.onClickEventId = "upgradeOneChose";

    //Upgrade cost
    this.upgradeOneCost = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Upgrade",
      {
        position: new Vec2(vp.x - vp.x / 2 - vp.x / 10, vp.y + vp.y / 2.5),
        text: "0",
      }
    );

    this.upgradeOneMat = this.add.sprite(MainHW4Scene.MATERIAL_KEY, "Upgrade");
    this.upgradeOneMat.scale.set(0.4, 0.4);
    this.upgradeOneMat.position = new Vec2(
      vp.x - vp.x / 2 - vp.x / 10 - vp.x / 20,
      vp.y + vp.y / 2.5
    );

    this.upgradeTwo = <Button>this.add.uiElement(
      UIElementType.BUTTON,
      "Upgrade",
      {
        position: new Vec2(vp.x, vp.y),
        text: "ERR",
      }
    );
    this.upgradeTwo.size.set(vp.x, vp.y * 2);
    this.upgradeTwo.scale.set(0.5, 0.5);
    this.upgradeTwo.backgroundColor = Color.WHITE;
    this.upgradeTwo.borderColor = Color.BLACK;
    this.upgradeTwo.textColor = Color.BLACK;
    this.upgradeTwo.onClickEventId = "upgradeTwoChose";

    this.upgradeTwoCost = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Upgrade",
      {
        position: new Vec2(vp.x, vp.y + vp.y / 2.5),
        text: "0",
      }
    );

    this.upgradeTwoMat = this.add.sprite(MainHW4Scene.MATERIAL_KEY, "Upgrade");
    this.upgradeTwoMat.scale.set(0.4, 0.4);
    this.upgradeTwoMat.position = new Vec2(vp.x - vp.x / 20, vp.y + vp.y / 2.5);

    this.upgradeThree = <Button>this.add.uiElement(
      UIElementType.BUTTON,
      "Upgrade",
      {
        position: new Vec2(vp.x + vp.x / 2 + vp.x / 10, vp.y),
        text: "ERR",
      }
    );
    this.upgradeThree.size.set(vp.x, vp.y * 2);
    this.upgradeThree.backgroundColor = Color.WHITE;
    this.upgradeThree.borderColor = Color.BLACK;
    this.upgradeThree.textColor = Color.BLACK;
    this.upgradeThree.onClickEventId = "upgradeThreeChose";
    this.upgradeThree.scale.set(0.5, 0.5);

    this.upgradeThreeCost = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Upgrade",
      {
        position: new Vec2(vp.x + vp.x / 2 + vp.x / 10, vp.y + vp.y / 2.5),
        text: "0",
      }
    );

    this.upgradeThreeMat = this.add.sprite(
      MainHW4Scene.MATERIAL_KEY,
      "Upgrade"
    );
    this.upgradeThreeMat.scale.set(0.4, 0.4);
    this.upgradeThreeMat.position = new Vec2(
      vp.x + vp.x / 2 + vp.x / 10 - vp.x / 20,
      vp.y + vp.y / 2.5
    );

    const availableOptions = [...upgradeOptions];
    const upgradeCost = [...upgradeCosts];
    this.assignRandomUpgradeText(
      this.upgradeOne,
      this.upgradeOneCost,
      availableOptions,
      upgradeCost
    );
    this.assignRandomUpgradeText(
      this.upgradeTwo,
      this.upgradeTwoCost,
      availableOptions,
      upgradeCost
    );
    this.assignRandomUpgradeText(
      this.upgradeThree,
      this.upgradeThreeCost,
      availableOptions,
      upgradeCost
    );

    this.hideUpgradesUI();
  }

  private initPauseUI(): void {
    const center = this.viewport.getCenter();
    // Background
    this.pause_background = this.add.sprite(MainHW4Scene.PAUSE_BG_KEY, "Pause");
    const imageSize = this.pause_background.size;
    const scaleX = (this.viewport.getHalfSize().x * 2) / imageSize.x;
    const scaleY = (this.viewport.getHalfSize().y * 2) / imageSize.y;
    this.pause_background.scale.set(scaleX, scaleY);
    this.pause_background.position.copy(center).sub(this.viewport.getOrigin());

    // Logo
    this.logo = this.add.sprite(MainHW4Scene.LOGO_KEY, "Pause");
    // this.logo.scale.set(1, 1);
    this.logo.position.set(this.viewport.getHalfSize().x, 70);

    this.pauseBackButton = <Button>this.add.uiElement(
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

    this.pauseBackButton.size.set(150, 50);
    this.pauseBackButton.borderWidth = 2;
    this.pauseBackButton.borderColor = Color.WHITE;
    this.pauseBackButton.backgroundColor = Color.BLACK;
    this.pauseBackButton.onClickEventId = "unPause";

    this.resume = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x, 160),
      text: "Resume",
    });
    this.resume.textColor = Color.RED;
    this.resume.sizeToText();
    this.resume.scale.set(0.5, 0.5);
    this.resume.fontSize = 32;
    this.resume.onClickEventId = "unPause";

    this.controls = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x, 180),
      text: "Controls",
    });
    this.controls.textColor = Color.WHITE;
    this.controls.sizeToText();
    this.controls.scale.set(0.5, 0.5);
    this.controls.fontSize = 32;
    this.controls.onClickEventId = "showControls";

    this.exit = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x, 200),
      text: "Exit",
    });
    this.exit.textColor = Color.RED;
    this.exit.sizeToText();
    this.exit.scale.set(0.5, 0.5);
    this.exit.fontSize = 32;
    this.exit.onClickEventId = "exit";

    this.cheats = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(this.viewport.getHalfSize().x, 220),
      text: "Cheats",
    });
    this.cheats.textColor = Color.WHITE;
    this.cheats.scale.set(0.5, 0.5);
    this.cheats.sizeToText();
    this.cheats.fontSize = 32;
    this.cheats.onClickEventId = "showCheats";

    // this.AllLevelsCheat = <Button>this.add.uiElement(UIElementType.BUTTON, "Pause", {
    //   position: new Vec2(this.viewport.getHalfSize().x / 7, this.viewport.getHalfSize().y * 2 - (3*(this.viewport.getHalfSize().y / 8))),
    //   text: "All Levels",
    // });
    // this.AllLevelsCheat.textColor = Color.WHITE;
    // this.AllLevelsCheat.backgroundColor = Color.BLACK;
    // this.AllLevelsCheat.fontSize = 24;
    // this.AllLevelsCheat.onClickEventId = "allLevelCheatUnlock";
    let Text = " [9] - Unlimited Health ";
    this.unlimitedHealthCheat = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Pause",
      {
        position: new Vec2(
          this.viewport.getHalfSize().x / 7 + Text.length,
          this.viewport.getHalfSize().y * 2 -
            3 * (this.viewport.getHalfSize().y / 8)
        ),
        text: "   [9] - Unlimited Health   ",
      }
    );
    this.unlimitedHealthCheat.textColor = Color.WHITE;
    // this.unlimitedHealthCheat.backgroundColor = Color.BLACK;
    this.unlimitedHealthCheat.fontSize = 15;

    Text = " [8] - End day/night ";
    this.endCycleCheat = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Pause",
      {
        position: new Vec2(
          this.viewport.getHalfSize().x / 7 + Text.length,
          this.viewport.getHalfSize().y * 2 -
            2 * (this.viewport.getHalfSize().y / 8)
        ),
        text: "   [8] - End day/night   ",
      }
    );
    this.endCycleCheat.textColor = Color.WHITE;
    // this.endCycleCheat.backgroundColor = Color.BLACK;
    this.endCycleCheat.fontSize = 15;

    Text = " [7] - Add Materials ";
    this.addMaterialCheat = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Pause",
      {
        position: new Vec2(
          this.viewport.getHalfSize().x / 7 + Text.length,
          this.viewport.getHalfSize().y * 2 - this.viewport.getHalfSize().y / 8
        ),
        text: "   [7] - Add Materials   ",
      }
    );
    this.addMaterialCheat.textColor = Color.WHITE;
    // this.endCycleCheat.backgroundColor = Color.BLACK;
    this.addMaterialCheat.fontSize = 15;

    Text = " [W] - Up";
    this.upLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(
        (this.viewport.getHalfSize().x * 3) / 2 - Text.length,
        this.viewport.getHalfSize().y * 2 -
          8 * (this.viewport.getHalfSize().y / 8)
      ),
      text: "[W] - Up",
    });
    this.upLabel.textColor = Color.WHITE;
    this.upLabel.fontSize = 16;

    Text = "[S] - Down";
    this.downLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(
        (this.viewport.getHalfSize().x * 3) / 2 - Text.length,
        this.viewport.getHalfSize().y * 2 -
          7 * (this.viewport.getHalfSize().y / 8)
      ),
      text: "[S] - Down",
    });
    this.downLabel.textColor = Color.WHITE;
    this.downLabel.fontSize = 16;

    Text = "[A] - Left";
    this.leftLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(
        (this.viewport.getHalfSize().x * 3) / 2 - Text.length,
        this.viewport.getHalfSize().y * 2 -
          6 * (this.viewport.getHalfSize().y / 8)
      ),
      text: "[A] - Left",
    });
    this.leftLabel.textColor = Color.WHITE;
    this.leftLabel.fontSize = 16;

    Text = "[D] - Right";
    this.rightLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(
        (this.viewport.getHalfSize().x * 3) / 2 - Text.length,
        this.viewport.getHalfSize().y * 2 -
          5 * (this.viewport.getHalfSize().y / 8)
      ),
      text: "[D] - Right",
    });
    this.rightLabel.textColor = Color.WHITE;
    this.rightLabel.fontSize = 16;

    Text = "[Left Click] - Shoot";
    this.shootLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(
        (this.viewport.getHalfSize().x * 3) / 2 - Text.length,
        this.viewport.getHalfSize().y * 2 -
          4 * (this.viewport.getHalfSize().y / 8)
      ),
      text: "[Left Click] - Shoot",
    });
    this.shootLabel.textColor = Color.WHITE;
    this.shootLabel.fontSize = 16;

    Text = "[E] - Pickup";
    this.pickupLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(
        (this.viewport.getHalfSize().x * 3) / 2 - Text.length,
        this.viewport.getHalfSize().y * 2 -
          3 * (this.viewport.getHalfSize().y / 8)
      ),
      text: "[E] - Pickup",
    });
    this.pickupLabel.textColor = Color.WHITE;
    this.pickupLabel.fontSize = 16;

    Text = "[ESC] - Pause";
    this.pauseLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(
        (this.viewport.getHalfSize().x * 3) / 2 - Text.length,
        this.viewport.getHalfSize().y * 2 -
          2 * (this.viewport.getHalfSize().y / 8)
      ),
      text: "[ESC] - Pause",
    });
    this.pauseLabel.textColor = Color.WHITE;
    this.pauseLabel.fontSize = 16;

    Text = "[R] - Roll";
    this.rollLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
      position: new Vec2(
        (this.viewport.getHalfSize().x * 3) / 2 - Text.length,
        this.viewport.getHalfSize().y * 2 -
          1 * (this.viewport.getHalfSize().y / 8)
      ),
      text: "[R] - Roll",
    });
    this.rollLabel.textColor = Color.WHITE;
    this.rollLabel.fontSize = 16;

    Text = "Objective";
    this.objectiveLabel = <Label>this.add.uiElement(
      UIElementType.LABEL,
      "Pause",
      {
        position: new Vec2(
          this.viewport.getHalfSize().x / 3 + Text.length,
          this.viewport.getHalfSize().y -
            4 * (this.viewport.getHalfSize().y / 8)
        ),
        text: "OBJECTIVE",
      }
    );
    this.objectiveLabel.textColor = Color.BLACK;
    this.objectiveLabel.fontSize = 30;

    const text = [
      "Gather materials to upgrade your gear",
      "Gather fuel to keep your helicopter running",
    ];
    for (let i = 0; i < text.length; i++) {
      const objLabel = <Label>this.add.uiElement(UIElementType.LABEL, "Pause", {
        position: new Vec2(
          this.viewport.getHalfSize().x / 3 + text[i].length / 2,
          this.viewport.getHalfSize().y -
            3 * (this.viewport.getHalfSize().y / 8) +
            i * 20
        ),
        text: text[i],
      });
      objLabel.textColor = Color.WHITE;
      objLabel.fontSize = 16;
      objLabel.visible = false;
      this.objectDescriptionLabel.push(objLabel);
    }

    this.hidePauseUI();
  }

  private showPauseUI(): void {
    this.pause_background.visible = true;
    this.logo.visible = true;
    this.pauseBackButton.visible = true;
    this.resume.visible = true;
    this.controls.visible = true;
    this.exit.visible = true;
    this.cheats.visible = true;
    this.objectiveLabel.visible = true;
    for (let i = 0; i < this.objectDescriptionLabel.length; i++) {
      this.objectDescriptionLabel[i].visible = true;
    }
  }

  private hidePauseUI(): void {
    this.pause_background.visible = false;
    this.logo.visible = false;
    this.pauseBackButton.visible = false;
    this.resume.visible = false;
    this.controls.visible = false;
    this.exit.visible = false;
    this.cheats.visible = false;
    this.objectiveLabel.visible = false;
    for (let i = 0; i < this.objectDescriptionLabel.length; i++) {
      this.objectDescriptionLabel[i].visible = false;
    }
    this.hideCheatsUI();
    this.hideControlsUI();
  }

  private showCheatsUI(): void {
    this.unlimitedHealthCheat.visible = true;
    this.endCycleCheat.visible = true;
    this.addMaterialCheat.visible = true;
  }

  private hideCheatsUI(): void {
    this.unlimitedHealthCheat.visible = false;
    this.endCycleCheat.visible = false;
    this.addMaterialCheat.visible = false;
  }

  private showControlsUI(): void {
    this.upLabel.visible = true;
    this.downLabel.visible = true;
    this.leftLabel.visible = true;
    this.rightLabel.visible = true;
    this.shootLabel.visible = true;
    this.pauseLabel.visible = true;
    this.pickupLabel.visible = true;
    this.rollLabel.visible = true;
  }

  private hideControlsUI(): void {
    this.upLabel.visible = false;
    this.downLabel.visible = false;
    this.leftLabel.visible = false;
    this.rightLabel.visible = false;
    this.shootLabel.visible = false;
    this.pauseLabel.visible = false;
    this.pickupLabel.visible = false;
    this.rollLabel.visible = false;
  }

  private showUpgradesUI(): void {
    this.upgradeBackButton.visible = true;
    this.upgrade_background.visible = true;
    this.upgradeOne.visible = true;
    this.upgradeTwo.visible = true;
    this.upgradeThree.visible = true;
    this.upgradeMaterial.visible = true;
    this.upgradeScreenMaterial.visible = true;
    this.upgradeOneCost.visible = true;
    this.upgradeTwoCost.visible = true;
    this.upgradeThreeCost.visible = true;
    this.upgradeOneMat.visible = true;
    this.upgradeTwoMat.visible = true;
    this.upgradeThreeMat.visible = true;
    this.upgradeRefreshButton.visible = true;
  }

  private hideUpgradesUI(): void {
    this.upgradeBackButton.visible = false;
    this.upgrade_background.visible = false;
    this.upgradeOne.visible = false;
    this.upgradeTwo.visible = false;
    this.upgradeThree.visible = false;
    this.upgradeMaterial.visible = false;
    this.upgradeScreenMaterial.visible = false;
    this.upgradeOneCost.visible = false;
    this.upgradeTwoCost.visible = false;
    this.upgradeThreeCost.visible = false;
    this.upgradeOneMat.visible = false;
    this.upgradeTwoMat.visible = false;
    this.upgradeThreeMat.visible = false;
    this.upgradeRefreshButton.visible = false;
  }

  public resetViewportSize(): void {
    this.viewport.setBounds(
      0,
      0,
      this.initialViewportSize.x,
      this.initialViewportSize.y
    );
    this.viewport.setZoomLevel(1);
    this.player.position.set(0, 0);
  }

  public spawnMaterial(position: Vec2): void {
    let sprite = this.add.sprite(MainHW4Scene.MATERIAL_KEY, "primary");
    sprite.scale.set(0.5, 0.5);
    let material = new Material(sprite);
    material.position.set(position.x, position.y);
    this.materials.push(material);
  }

  /**
   * Initializes the player in the scene
   */
  protected initializePlayer(): void {
    this.player = this.add.animatedSprite(PlayerActor, "player1", "primary");
    this.player.position.set(this.walls.size.x / 2, this.walls.size.y / 2);
    this.player.battleGroup = 2;
    if (this.playerData) {
      if (this.playerData.maxHealth) {
        this.player.maxHealth = this.playerData.maxHealth;
      }
      if (this.playerData.health) {
        this.player.health = this.playerData.health;
      }
      if (this.playerData.speed) {
        this.player.speed = this.playerData.speed;
      }
      if (this.playerData.armor) {
        this.player.armor = this.playerData.armor;
      }
      if (this.playerData.bulletDamage) {
        this.player.bulletDamage = this.playerData.bulletDamage;
      }
      if (this.playerData.energy) {
        this.player.energy = this.playerData.energy;
      }
      if (this.playerData.maxEnergy) {
        this.player.maxEnergy = this.playerData.maxEnergy;
      }
    } else {
      this.player.maxHealth = 100;
      this.player.health = 100;
      this.player.speed = 1;
      this.player.armor = 0;
      this.player.bulletDamage = 10;
      this.player.energy = 100;
      this.player.maxEnergy = 100;
    }
    // player.inventory.onChange = ItemEvent.INVENTORY_CHANGED
    // this.inventoryHud = new InventoryHUD(this, player.inventory, "inventorySlot", {
    //     start: new Vec2(232, 24),
    //     slotLayer: "slots",
    //     padding: 8,
    //     itemLayer: "items"
    // });

    // Give the player physics
    this.player.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)));

    // Give the player a healthbar
    let healthbar = new HealthbarHUD(this, this.player, "primary", {
      size: this.player.size.clone().scaled(2, 1 / 2),
      offset: this.player.size.clone().scaled(0, -1 / 2),
    });

    let energybar = new EnergybarHUD(this, this.player, "primary", {
      size: this.player.size.clone().scaled(2, 1 / 2),
      offset: this.player.size.clone().scaled(0, -3 / 4),
    });
    this.healthbars.set(this.player.id, healthbar);
    this.energybars.set(this.player.id, energybar);
    // Give the player PlayerAI
    this.player.addAI(PlayerAI, {
      weaponSystem: this.playerWeaponSystem,
    });

    // Start the player in the "IDLE" animation
    this.player.animation.play("IDLE");

    this.battlers.push(this.player);
    this.viewport.follow(this.player);
  }

  /**
   * Initialize the NPCs
   */
  // Get the object data for the red enemies
  //let red = this.load.getObject("red");
  protected spawnZombie(): void {
    const minX = 0;
    const maxX = 1256;
    const minY = 0;
    const maxY = 1240;
    let randomPos = this.getRandomPosition(minX, maxX, minY, maxY);
    let tileRow = this.walls.getTilemapPosition(randomPos.x, randomPos.y);

    while (this.walls.isTileCollidable(tileRow.x, tileRow.y)) {
      randomPos = this.getRandomPosition(minX, maxX, minY, maxY);
      tileRow = this.walls.getTilemapPosition(randomPos.x, randomPos.y);
    }
    if (!this.walls.isTileCollidable(tileRow.x, tileRow.y)) {
      const zombieTypeIndex = Math.floor(
        Math.random() * this.currentLevelConfig.zombieTypes.length
      );
      const zombieType = this.currentLevelConfig.zombieTypes[zombieTypeIndex];
      const lvlMultiplier = this.currentLevelConfig.statMultiplier;

      let npc: NPCActor;

      const baseStats = baseZombieStats[zombieType];
      const multipliedStats = applyMultiplier(baseStats, lvlMultiplier);

      switch (zombieType) {
        case ZombieType.Basic:
          npc = this.add.animatedSprite(NPCActor, "BasicEnemy", "primary");
          break;
        case ZombieType.Fast:
          npc = this.add.animatedSprite(NPCActor, "FastEnemy", "primary");
          break;
        case ZombieType.Strong:
          npc = this.add.animatedSprite(NPCActor, "StrongEnemy", "primary");
          break;
      }

      npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(6, 6)), null, false);
      let healthbar = new HealthbarHUD(this, npc, "primary", {
        size: npc.size.clone().scaled(2, 1 / 2),
        offset: npc.size.clone().scaled(0, -1 / 2),
      });
      this.healthbars.set(npc.id, healthbar);

      npc.health = multipliedStats.health;
      npc.maxHealth = multipliedStats.maxHealth;
      npc.speed = multipliedStats.speed;
      npc.armor = multipliedStats.armor;
      npc.battleGroup = 1;
      npc.navkey = "navmesh";
      npc.isCollidable = true;
      npc.energy = 100;
      npc.maxEnergy = 100;
      npc.position.set(randomPos.x, randomPos.y);

      npc.animation.play("IDLE");
      npc.addAI(ZombieBehavior, { target: this.battlers[0], range: 25 });
      npc.setGroup(PhysicsGroups.ZOMBIE);
      npc.setTrigger(PhysicsGroups.ZOMBIE, BattlerEvent.OVERLAP, null);
      npc.setTrigger(PhysicsGroups.PLAYER_WEAPON, BattlerEvent.HIT, null);

      this.battlers.push(npc);
      this.zombies.push(npc);
      this.currentLevelConfig.zombieCount -= 1;
      this.onScreenZombies += 1;
      console.log("I AM BORN: ", npc);
    }
  }

  protected spawnZombiesInterval(): void {
    if (this.currentLevelConfig.zombieCount > 0) {
      if (!this.isPaused && this.onScreenZombies < this.currentLevelConfig.maxAmount) {
        this.spawnZombie();
      }
        setTimeout(() => {
          this.spawnZombiesInterval();
        }, 1000); // Change 1000 to the desired interval in milliseconds between each zombie spawn.
    }
  }

  protected initializeNPCs(): void {
    this.spawnZombiesInterval();
  }

  /**
   * Initialize the items in the scene (healthpacks and laser guns)
   */

  private getRandomPosition(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ): Vec2 {
    let x = Math.random() * (maxX - minX) + minX;
    let y = Math.random() * (maxY - minY) + minY;
    return new Vec2(x, y);
  }
  //Initialize the items Material and Fuels
  protected initializeItems(): void {
    const minX = 0;
    const maxX = 1256;
    const minY = 0;
    const maxY = 1240;

    // Number of materials and fuels to spawn
    const numMaterials = 10;
    const numFuels = 5;

    // let materials = this.load.getObject("materials");
    this.materials = new Array<Material>(numMaterials);
    for (let i = 0; i < numMaterials; i++) {
      let sprite = this.add.sprite(MainHW4Scene.MATERIAL_KEY, "primary");
      sprite.scale.set(0.5, 0.5);
      this.materials[i] = new Material(sprite);
      // this.materials[i].position.set(
      //   materials.items[i][0],
      //   materials.items[i][1]
      // );
      this.materials[i].position.copy(
        this.getRandomPosition(minX, maxX, minY, maxY)
      );
    }
    // let fuels = this.load.getObject("fuels");
    this.fuels = new Array<Fuel>(numFuels);
    for (let i = 0; i < numFuels; i++) {
      let sprite = this.add.sprite(MainHW4Scene.FUEL_KEY, "primary");
      sprite.scale.set(0.5, 0.5);
      this.fuels[i] = new Fuel(sprite);
      // this.fuels[i].position.set(fuels.items[i][0], fuels.items[i][1]);
      this.fuels[i].position.copy(
        this.getRandomPosition(minX, maxX, minY, maxY)
      );
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
