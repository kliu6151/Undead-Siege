import Graphic from "../Graphic";
import Vec2 from "../../DataTypes/Vec2";
import Color from "../../Utils/Color";

/** A spotlight to be drawn on the screen. */
export default class Spotlight extends Graphic {
  lightPosition: Vec2;
  lightColor: Color;
  lightRadius: number;
  ambientColor: Color;
  gradientStart: number;
  gradientEnd: number;

  constructor(
    position?: Vec2,
    size?: Vec2,
    lightPosition?: Vec2,
    lightColor?: Color,
    lightRadius?: number,
    ambientColor?: Color,
    gradientStart?: number,
    gradientEnd?: number
  ) {
    super();
    this.position = position || new Vec2();
    this.size = size || new Vec2();
    this.lightPosition = lightPosition || new Vec2();
    this.lightColor = lightColor || new Color(1, 1, 1, 1);
    this.lightRadius = lightRadius || 100;
    this.ambientColor = ambientColor || new Color(0, 0, 0, 1);
    this.gradientStart = gradientStart || 0.5;
    this.gradientEnd = gradientEnd || 1;
  }

  // Add the getOptions method
  getOptions(): Record<string, any> {
    return {
      position: this.position,
      size: this.size,
      lightPosition: this.lightPosition,
      lightColor: this.lightColor,
      lightRadius: this.lightRadius,
      ambientColor: this.ambientColor,
      gradientStart: this.gradientStart,
      gradientEnd: this.gradientEnd,
    };
  }

    setLightPosition(lightPosition: Vec2): void {
        this.lightPosition = lightPosition;
    }

    setLightColor(lightColor: Color): void {
        this.lightColor = lightColor;
    }

    setLightRadius(lightRadius: number): void {
        this.lightRadius = lightRadius;
    }

    setAmbientColor(ambientColor: Color): void {
        this.ambientColor = ambientColor;
    }

    setGradientStart(gradientStart: number): void {
        this.gradientStart = gradientStart;
    }

    setGradientEnd(gradientEnd: number): void {
        this.gradientEnd = gradientEnd;
    }
}
