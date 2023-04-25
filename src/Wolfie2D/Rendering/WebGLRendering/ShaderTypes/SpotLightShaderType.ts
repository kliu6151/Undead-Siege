import Mat4x4 from "../../../DataTypes/Mat4x4";
import Vec2 from "../../../DataTypes/Vec2";
import Spotlight from "../../../Nodes/Graphics/Spotlight";
import ResourceManager from "../../../ResourceManager/ResourceManager";
import QuadShaderType from "./QuadShaderType";

export default class SpotlightShaderType extends QuadShaderType {

	constructor(programKey: string){
		super(programKey);
		this.resourceManager = ResourceManager.getInstance();
	}

	initBufferObject(): void {
		this.bufferObjectKey = "spotlight";
		this.resourceManager.createBuffer(this.bufferObjectKey);
	}

	render(gl: WebGLRenderingContext, options: Record<string, any>): void {
		// Get our program and buffer object
		const program = this.resourceManager.getShaderProgram(this.programKey);
		const buffer = this.resourceManager.getBuffer(this.bufferObjectKey);

		// Let WebGL know we're using our shader program
		gl.useProgram(program);

		// Get our vertex data
		const vertexData = this.getVertices(options.size.x, options.size.y);
		const FSIZE = vertexData.BYTES_PER_ELEMENT;

		// Bind the buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

		/* ##### ATTRIBUTES ##### */
		// No texture, the only thing we care about is vertex position
		const a_Position = gl.getAttribLocation(program, "a_Position");
		gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 2 * FSIZE, 0 * FSIZE);
		gl.enableVertexAttribArray(a_Position);

		/* ##### UNIFORMS ##### */

		// Get transformation matrix
		// We have a square for our rendering space, so get the maximum dimension of our quad
		let maxDimension = Math.max(options.size.x, options.size.y);

		// The size of the rendering space will be a square with this maximum dimension
		let size = new Vec2(maxDimension, maxDimension).scale(2/options.worldSize.x, 2/options.worldSize.y);

		// Center our translations around (0, 0)
		const translateX = (options.position.x - options.origin.x - options.worldSize.x/2)/maxDimension;
		const translateY = -(options.position.y - options.origin.y - options.worldSize.y/2)/maxDimension;

		// Create our transformation matrix
		this.translation.translate(new Float32Array([translateX, translateY]));
		this.scale.scale(size);
		this.rotation.rotate(options.rotation);
		let transformation = Mat4x4.MULT(this.translation, this.scale, this.rotation);

        // Pass the translation matrix to our shader
        const u_Transform = gl.getUniformLocation(program, "u_Transform");
        gl.uniformMatrix4fv(u_Transform, false, transformation.toArray());

		//color
		let webGL_color = options.color.toWebGL();
		const circle_Color = gl.getUniformLocation(program, "circle_Color");
		gl.uniform4f(circle_Color, webGL_color[0], webGL_color[1], webGL_color[2], webGL_color[3]);

		// Draw the quad
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        const u_LightPosition = gl.getUniformLocation(program, "u_LightPosition");
        gl.uniform2f(u_LightPosition, options.lightPosition.x, options.lightPosition.y);
        
        const u_LightColor = gl.getUniformLocation(program, "u_LightColor");
        let webGL_lightColor = options.lightColor.toWebGL();
        gl.uniform4f(u_LightColor, webGL_lightColor[0], webGL_lightColor[1], webGL_lightColor[2], webGL_lightColor[3]);

        const u_LightRadius = gl.getUniformLocation(program, "u_LightRadius");
        gl.uniform1f(u_LightRadius, options.lightRadius);

        const u_AmbientColor = gl.getUniformLocation(program, "u_AmbientColor");
        let webGL_ambientColor = options.ambientColor.toWebGL();
        gl.uniform4f(u_AmbientColor, webGL_ambientColor[0], webGL_ambientColor[1], webGL_ambientColor[2], webGL_ambientColor[3]);
	}

	getVertices(w: number, h: number): Float32Array {
		let x, y;

		if(h > w){
			y = 0.5;
			x = w/(2*h);
		} else {
			x = 0.5;
			y = h/(2*w);
		}

		return new Float32Array([
			-x,  y,
			-x, -y,
			 x,  y,
			 x, -y
		]);
	}

	getOptions(spotlight: Spotlight): Record<string, any> {
		let options: Record<string, any> = {
			position: spotlight.position,
			size: spotlight.size,
			rotation: spotlight.rotation,
			lightPosition: spotlight.lightPosition,
			lightColor: spotlight.lightColor,
			lightRadius: spotlight.lightRadius,
			ambientColor: spotlight.ambientColor
		}

		return options;
	}
}