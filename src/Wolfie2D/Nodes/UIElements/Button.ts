import Label from "./Label";
import Color from "../../Utils/Color";
import Vec2 from "../../DataTypes/Vec2";

/** A clickable button UIElement */
export default class Button extends Label {

	isDisabled = false;

	constructor(position: Vec2, text: string){
		super(position, text);
		
		this.backgroundColor = new Color(150, 75, 203);
		this.borderColor = new Color(41, 46, 30);
		this.textColor = new Color(255, 255, 255);
	}

	// @override
	calculateBackgroundColor(): Color {
		// Change the background color if clicked or hovered
		if(this.isEntered && !this.isClicked){
			return this.backgroundColor.lighten();
		} else if(this.isClicked){
			return this.backgroundColor.darken();
		} else {
			return this.backgroundColor;
		}
	}

	buttonStyle (backgroundColor: Color, textColor: Color, size: Vec2, fontStr: string): void {
		this.setBackgroundColor(backgroundColor);
		this.setTextColor(textColor);
		this.size.x = size.x;
		this.size.y = size.y;
		this.font = fontStr;
	}

	disable (): void {
		this.isDisabled = true;
		this.buttonStyle(new Color(100, 100, 100), new Color(255, 255, 255), this.size, this.font);
	}
}

