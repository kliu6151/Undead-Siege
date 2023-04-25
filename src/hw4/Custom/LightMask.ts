import Graphic from "../../Wolfie2D/Nodes/Graphic";
import Color from "../../Wolfie2D/Utils/Color";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import CanvasRenderer from "../../Wolfie2D/Rendering/CanvasRenderer";
import Spotlight from "../../Wolfie2D/Nodes/Graphics/Spotlight";

export default class LightMask extends Graphic {
    private playerPosition: Vec2;
    private playerRotation: number;
    private spotlight: Spotlight; // Add a Spotlight instance to the class


    constructor() {
      super();
      this.playerPosition = new Vec2(0, 0);
      this.playerRotation = 0;

      // Initialize the Spotlight instance and set its properties
    this.spotlight = new Spotlight();
    this.spotlight.position = new Vec2(0, 0);
    this.spotlight.size = new Vec2(100, 100);
    // Set other properties like lightPosition, lightColor, etc.
    this.spotlight.lightPosition = new Vec2(0, 0);
    this.spotlight.lightColor = new Color(1, 1, 1, 1);
    this.spotlight.lightRadius = 100;
    this.spotlight.ambientColor = new Color(0, 0, 0, 1);
    this.spotlight.gradientStart = 0.5;
    this.spotlight.gradientEnd = 1;
    }

    public updatePlayerInfo(position: Vec2, rotation: number): void {
        this.position = position;
        this.playerRotation = rotation;
    }

    public setPlayerSize(size: Vec2): void {
        this.size = size;
    }

    public setLightMaskScale(scale: Vec2): void {
        this.scale = scale;
    }

    // Override the setShaderProperties method
  setShaderProperties(options: Record<string, any>): void {
    // Get options from the Spotlight instance
    options = this.spotlight.getOptions();
  }

    addSpotlight(context: CanvasRenderingContext2D, position: Vec2, radius: number): CanvasRenderingContext2D {
        const radialGradient = context.createRadialGradient(
          position.x,
          position.y,
          0,
          position.x,
          position.y,
          radius
        );
        this.spotlight.position = this.playerPosition;
        this.spotlight.lightPosition = new Vec2(0, 0); // Set the light position
        this.spotlight.lightColor = new Color(255, 255, 255); // Set the light color
        this.spotlight.lightRadius = 200; // Set the light radius
        radialGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        radialGradient.addColorStop(1, "rgba(255, 255, 255, 1)");
        context.fillStyle = radialGradient;
        console.log("Adding spotlight at position: " + position.toString());
        console.log("Adding spotlight with radius: " + radius);
        console.log("CONTEXT: " + context);
        return context;
      }

      addFlashlight(context: CanvasRenderingContext2D, position: Vec2, direction: Vec2, radius: number, angle: number): CanvasRenderingContext2D {
        const endPoint = position.clone().add(direction.clone().scale(radius));
        const leftPoint = position.clone().add(direction.clone().rotateCCW(-angle / 2).scale(radius));
        const rightPoint = position.clone().add(direction.clone().rotateCCW(angle / 2).scale(radius));
      
        context.beginPath();
        context.moveTo(position.x, position.y);
        context.lineTo(leftPoint.x, leftPoint.y);
        context.lineTo(endPoint.x, endPoint.y);
        context.lineTo(rightPoint.x, rightPoint.y);
        context.closePath();
        context.fillStyle = "rgba(255, 255, 255, 1)";
        context.fill();
        return context
      }

      
      public render(renderer: CanvasRenderer): void {

        console.log("DSAHDKJHASKDH")
        // Clear the canvas
        renderer.clear(new Color(0, 0, 0, 1));
    
        // Save the current context state
        const ctx = renderer['ctx']; // Access the protected ctx property
        ctx.save();
    
        // Set the global composite operation to "screen" to make sure light sources are combined correctly
        ctx.globalCompositeOperation = "screen";
    
        // Use the addSpotlight method to render the spotlight at the player's position with a radius of 200
        this.addSpotlight(ctx, this.playerPosition, 200);
        console.log("DASJKHDJKASHJKDSAK")
        // Restore the context state
        ctx.restore();
      }

      
  }