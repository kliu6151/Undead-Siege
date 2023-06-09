import Game from "./Wolfie2D/Loop/Game";
import MainMenu from "./hw4/Scenes/MainMenu";
import { PlayerInput } from "./hw4/AI/Player/PlayerController";
import StartMenu from "./hw4/Scenes/StartMenu";
import RegistryManager from "./Wolfie2D/Registry/RegistryManager";
import SpotlightShader from "./hw4/Custom/Shaders/SpotLightShader";
// The main function is your entrypoint into Wolfie2D. Specify your first scene and any options here.
(function main(){
    // Run any tests
    runTests();

    // Set up options for our game
    let options = {
        canvasSize: {x: window.innerWidth, y: window.innerHeight}, //The size of the game
        clearColor: {r: 0.1, g: 0.1, b: 0.1},   // The color the game clears to
        inputs: [
            {name: PlayerInput.MOVE_UP, keys: ["w"]},
            {name: PlayerInput.MOVE_DOWN, keys: ["s"]},
            {name: PlayerInput.MOVE_LEFT, keys: ["a"]},
            {name: PlayerInput.MOVE_RIGHT, keys: ["d"]},
            {name: PlayerInput.PICKUP_ITEM, keys: ["e"]},
            {name: PlayerInput.DROP_ITEM, keys: ["q"]},
            {name: PlayerInput.ROLL, keys: ['r']},
            {name: "slot1", keys: ["1"]},
            {name: "slot2", keys: ["2"]},
        ],
        useWebGL: false,                        // Tell the game we want to use webgl
        showDebug: false                      // Whether to show debug messages. You can change this to true if you want
    }

    // Set up custom registries
    RegistryManager.shaders.registerAndPreloadItem(
        SpotlightShader.KEY,   // The key of the shader program
        SpotlightShader,           // The constructor of the shader program
        SpotlightShader.VSHADER,   // The path to the vertex shader
        SpotlightShader.FSHADER);  // the path to the fragment shader*/
        

    // Create a game with the options specified
    const game = new Game(options);

    // Start our game
    game.start(StartMenu, {});

})();

function runTests(){};