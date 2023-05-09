// import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
// import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import HW4Scene from "./HW4Scene";
import RenderingManager from "../../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../../Wolfie2D/SceneGraph/Viewport";
import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import MainHW4Scene from "./MainHW4Scene";
import MainMenu from "../MainMenu";
import SpotlightShader from "../../Custom/Shaders/SpotLightShader";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";

/**
 * The first level for HW4 - should be the one with the grass and the clouds.
 */
export default class Level3 extends MainHW4Scene {

    public static readonly PLAYER_SPRITE_PATH = "assets/spritesheets/Soldier.json";

    public static readonly TILEMAP_KEY = "LEVEL3";
    public static readonly TILEMAP_PATH = "assets/tilemaps/Level3Map.json";
    // public static readonly TILEMAP_SCALE = new Vec2(2, 2);
    public static readonly WALLS_LAYER_KEY = "Main";

    public static readonly BASICZOMBIE_KEY = "BASICZOMBIE";
    public static readonly ZOMBIE_PATH = "assets/spritesheets/BasicZombie.json";
    public static readonly STRONGZOMBIE_KEY = "STRONGZOMBIE";
    public static readonly STRONGZOMBIE_PATH = "assets/spritesheets/StrongZombie.json";
    public static readonly BOSSZOMBIE_KEY = "BOSSZOMBIE";
    public static readonly BOSSZOMBIE_PATH = "assets/spritesheets/BossZombie.json";

    public static readonly AXE_KEY = "AXE";
    public static readonly AXE_PATH = "assets/spritesheets/AxeThrow.json";

    public static readonly SHOOT_AUDIO_KEY = "PLAYER_SHOOT";
    public static readonly SHOOT_AUDIO_PATH = "assets/sounds/gun_shot.wav";

    public static readonly ZOMBIE_GROWL_AUDIO_KEY = "ZOMBIT_HIT"
    public static readonly ZOMBIE_GROWL_AUDIO_PATH = "assets/sounds/zombie_growl.wav";

    public static readonly PLAYER_DAMAGED_AUDIO_KEY = "PLAYER_DAMAGED"
    public static readonly PLAYER_DAMAGED_AUDIO_PATH = "assets/sounds/player_hit.mp3";

    public static readonly HELICOPTER_DAMAGED_AUDIO_KEY = "HELICOPTER_DAMAGED"
    public static readonly HELICOPTER_DAMAGED_AUDIO_PATH = "assets/sounds/metal.mp3"

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
        this.levelKey = Level3.TILEMAP_KEY;
        // this.tilemapScale = Level2.TILEMAP_SCALE;
        // this.destructibleLayerKey = Level2.DESTRUCTIBLE_LAYER_KEY;
        this.wallsLayerKey = Level3.WALLS_LAYER_KEY;

        // this.levelMusicKey = Level2.LEVEL_MUSIC_KEY;

        this.playerShootAudioKey = Level3.SHOOT_AUDIO_KEY;

        
        this.zombieGrowlAudioKey = Level3.ZOMBIE_GROWL_AUDIO_KEY
        this.playerDamagedAudioKey = Level3.PLAYER_DAMAGED_AUDIO_KEY
        this.helicopterDamagedAudioKey = Level3.HELICOPTER_DAMAGED_AUDIO_KEY
        // Set the key for the player's sprite
        // this.playerSpriteKey = Level2.PLAYER_SPRITE_KEY;
        // Set the player's spawn
        // this.playerSpawn = Level2.PLAYER_SPAWN;

        // Music and sound
        // this.levelMusicKey = Level2.LEVEL_MUSIC_KEY
        // this.jumpAudioKey = Level2.JUMP_AUDIO_KEY;
        // this.deathAudioKey = Level2.DEATH_AUDIO_KEY;
        // this.tileDestroyedAudioKey = Level2.TILE_DESTROYED_KEY;

        // Level end size and position
        // this.levelEndPosition = new Vec2(128, 232).mult(this.tilemapScale);
        // this.levelEndHalfSize = new Vec2(32, 32).mult(this.tilemapScale);
    }

    /**
     * Load in our resources for level 1
     */
    public override loadScene() {
        // Load the player and enemy spritesheets
        this.load.spritesheet("player1", Level3.PLAYER_SPRITE_PATH);
    
        // Load in the enemy sprites
        this.load.spritesheet("BasicZombie", Level3.ZOMBIE_PATH);
        this.load.spritesheet("FastZombie", Level3.ZOMBIE_PATH);
        this.load.spritesheet("StrongZombie",Level3.STRONGZOMBIE_PATH);
        this.load.spritesheet("BossZombie", Level3.BOSSZOMBIE_PATH);


        // Load the tilemap
        this.load.tilemap(this.levelKey, Level3.TILEMAP_PATH);
        // this.load.tilemap("level", "assets/tilemaps/HW3Tilemap.json");
    
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
        // this.resourceManager.keepSpritesheet(this.playerSpriteKey);
        // this.resourceManager.keepAudio(this.jumpAudioKey);
        // this.resourceManager.keepAudio(this.deathAudioKey);
        // this.resourceManager.keepAudio(this.tileDestroyedAudioKey);
        // this.resourceManager.unloadAllResources();
        
        // TODO decide which resources to keep/cull
        // this.unload.tilemap(this.tilemapKey);
        // this.keepSpriteSheet(this.playerSpriteKey, Level2.PLAYER_SPRITE_PATH);
    }

    public startScene(): void {
        super.startScene();
        // Set the next level to be Level2
        this.nextLevel = MainMenu;
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