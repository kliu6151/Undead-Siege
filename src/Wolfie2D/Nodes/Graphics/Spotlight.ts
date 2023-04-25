import Graphic from "../Graphic";
import Vec2 from "../../DataTypes/Vec2";
import Color from "../../Utils/Color";

/** A spotlight to be drawn on the screen. */
export default class Spotlight extends Graphic {
    lightPosition: Vec2;
    lightColor: Color;
    lightRadius: number;
    ambientColor: Color;

    constructor(position: Vec2, size: Vec2, lightPosition: Vec2, lightColor: Color, lightRadius: number, ambientColor: Color) {
        super();
        this.position = position;
        this.size = size;
        this.lightPosition = lightPosition;
        this.lightColor = lightColor;
        this.lightRadius = lightRadius;
        this.ambientColor = ambientColor;
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
}
