// import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
// import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import HW4Scene from "./HW4Scene";
import RenderingManager from "../../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../../Wolfie2D/SceneGraph/Viewport";
import Level2 from "./Level2";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import MainHW4Scene from "./MainHW4Scene";
import SpotlightShader from "../../Custom/Shaders/SpotLightShader";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
// import HW4Scene from "./HW4Scene";


/**
 * The first level for HW4 - should be the one with the grass and the clouds.
 */
export default class Level1 extends MainHW4Scene {

    // public static readonly PLAYER_SPAWN = new Vec2(32, 32);

    //Player
    public static readonly PLAYER_SPRITE_KEY = "PLAYER_SPRITE_KEY";
    public static readonly PLAYER_SPRITE_PATH = "assets/spritesheets/Soldier.json";

    //Tile maps
    public static readonly TILEMAP_KEY = "LEVEL1";
    public static readonly TILEMAP_PATH = "assets/tilemaps/Level1Map.json";
    // public static readonly TILEMAP_SCALE = new Vec2(2, 2);
    public static readonly WALLS_LAYER_KEY = "Main";

    //Load the enemy sprites
    public static readonly ZOMBIE_KEY = "ZOMBIE";
    public static readonly ZOMBIE_PATH = "assets/spritesheets/BasicZombie.json";

    // Load the enemy locations
    public static readonly ZOMBIE_SPAWNS = "ZOMBIE_SPAWNS";
    public static readonly ZOMBIE_SPAWNS_PATH = "assets/data/enemies/blue.json";

    public static readonly HEALTHPACK_SPAWNS = "HEALTHPACK_SPAWNS";
    public static readonly HEALTHPACK_SPAWNS_PATH = "assets/data/items/healthpacks.json";

    public static readonly LASERGUN_SPAWNS = "LASERGUN_SPAWNS";
    public static readonly LASERGUN_SPAWNS_PATH = "assets/data/items/laserguns.json";

    // Load the material and fuel locations
    public static readonly MATERIAL_SPAWNS = "MATERIAL_SPAWNS";
    public static readonly MATERIAL_SPAWNS_PATH = "assets/data/items/materials.json";

    public static readonly FUEL_SPAWNS = "FUEL_SPAWNS";
    public static readonly FUEL_SPAWNS_PATH = "assets/data/items/fuels.json";

   
    public static readonly SHOOT_AUDIO_KEY = "PLAYER_SHOOT";
    public static readonly SHOOT_AUDIO_PATH = "assets/sounds/gun_shot.wav";

    // public static readonly LEVEL_MUSIC_KEY = "LEVEL_MUSIC";
    // public static readonly LEVEL_MUSIC_PATH = "hw4_assets/music/hw5_level_music.wav";

    // public static readonly JUMP_AUDIO_KEY = "PLAYER_JUMP";
    // public static readonly JUMP_AUDIO_PATH = "hw4_assets/sounds/jump.wav";

    // public static readonly DEATH_AUDIO_KEY = "PLAYER_DEATH";
    // public static readonly DEATH_AUDIO_PATH = "hw4_assets/sounds/death.wav";

    // public static readonly TILE_DESTROYED_KEY = "TILE_DESTROYED";
    // public static readonly TILE_DESTROYED_PATH = "hw4_assets/sounds/switch.wav";

    // public static readonly LEVEL_END = new AABB(new Vec2(224, 232), new Vec2(24, 16));

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);

        // Set the keys for the different layers of the tilemap
        this.levelKey = Level1.TILEMAP_KEY;
        // this.tilemapScale = Level1.TILEMAP_SCALE;
        // this.destructibleLayerKey = Level1.DESTRUCTIBLE_LAYER_KEY;
        this.wallsLayerKey = Level1.WALLS_LAYER_KEY;

        this.playerShootAudioKey = Level1.SHOOT_AUDIO_KEY;

        

        // Set the key for the player's sprite
        // this.playerSpriteKey = Level1.PLAYER_SPRITE_KEY;
        // Set the player's spawn
        // this.playerSpawn = Level1.PLAYER_SPAWN;

        // Music and sound
        // this.levelMusicKey = Level1.LEVEL_MUSIC_KEY
        // this.jumpAudioKey = Level1.JUMP_AUDIO_KEY;
        // this.deathAudioKey = Level1.DEATH_AUDIO_KEY;
        // this.tileDestroyedAudioKey = Level1.TILE_DESTROYED_KEY;

        // Level end size and position
        // this.levelEndPosition = new Vec2(128, 232).mult(this.tilemapScale);
        // this.levelEndHalfSize = new Vec2(32, 32).mult(this.tilemapScale);
    }

    /**
     * Load in our resources for level 1
     */
    public override loadScene() {
        // Load the player and enemy spritesheets
        this.load.spritesheet("player1", Level1.PLAYER_SPRITE_PATH);
    
        // Load in the enemy sprites
        this.load.spritesheet("BasicZombie", Level1.ZOMBIE_PATH);
        

        // Load the tilemap
        this.load.tilemap(this.levelKey, Level1.TILEMAP_PATH);
        // this.load.tilemap("level", "assets/tilemaps/HW3Tilemap.json");
    
        // Load the enemy locations
        this.load.object("blue", Level1.ZOMBIE_SPAWNS_PATH);
    
        // Load the healthpack and lasergun loactions
        this.load.object("healthpacks", Level1.HEALTHPACK_SPAWNS_PATH);
        this.load.object("laserguns", Level1.LASERGUN_SPAWNS_PATH);
    
        // Load the material and fuel locations
        this.load.object("materials", Level1.MATERIAL_SPAWNS_PATH);
        this.load.object("fuels", Level1.FUEL_SPAWNS_PATH);
    
        //sounds
        this.load.audio(this.playerShootAudioKey, Level1.SHOOT_AUDIO_PATH);
        // Load the healthpack, inventory slot, and laser gun sprites
        // this.load.image("healthpack", "assets/sprites/healthpack.png");
        // this.load.image("inventorySlot", "assets/sprites/inventory.png");
        // this.load.image("laserGun", "assets/sprites/laserGun.png");
    
        this.load.image(MainHW4Scene.MATERIAL_KEY, MainHW4Scene.MATERIAL_PATH);
        this.load.image(MainHW4Scene.FUEL_KEY, MainHW4Scene.FUEL_PATH);
        this.load.image(MainHW4Scene.LOGO_KEY, MainHW4Scene.LOGO_PATH);
        this.load.image(MainHW4Scene.PAUSE_BG_KEY, MainHW4Scene.PAUSE_BG_PATH);
        this.load.image(MainHW4Scene.NIGHT_KEY, MainHW4Scene.NIGHT_PATH);
    
        this.load.shader(
          SpotlightShader.KEY,
          SpotlightShader.VSHADER,
          SpotlightShader.FSHADER
        );
      }

    /**
     * Unload resources for level 1
     */
    public unloadScene(): void {
        this.load.keepAudio(this.playerShootAudioKey);

        // this.resourceManager.keepSpritesheet(this.playerSpriteKey);
        // this.resourceManager.keepAudio(this.jumpAudioKey);
        // this.resourceManager.keepAudio(this.deathAudioKey);
        // this.resourceManager.keepAudio(this.tileDestroyedAudioKey);
        // this.resourceManager.unloadAllResources();
        
        // TODO decide which resources to keep/cull
        // this.unload.tilemap(this.tilemapKey);
        // this.keepSpriteSheet(this.playerSpriteKey, Level1.PLAYER_SPRITE_PATH);
    }

    public startScene(): void {
        super.startScene();
        
        // Set the next level to be Level2
        this.nextLevel = Level2;
    }

    /**
     * I had to override this method to adjust the viewport for the first level. I screwed up 
     * when I was making the tilemap for the first level is what it boils down to.
     * 
     * - Peter
     */
    protected initializeViewport(): void {
        // super.initializeViewport();
        // this.viewport.setBounds(16, 16, 496, 512);
    }

}