import Mat4x4 from "../../../Wolfie2D/DataTypes/Mat4x4";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Spotlight from "../../../Wolfie2D/Nodes/Graphics/Spotlight";
import SpotlightShaderType from "../../../Wolfie2D/Rendering/WebGLRendering/ShaderTypes/SpotLightShaderType";

export default class SpotlightShader extends SpotlightShaderType {

    public static KEY: string = "SPOTLIGHT_SHADER_TYPE_KEY";
    public static VSHADER: string = "builtin/shaders/spotlight.vshader";
    public static FSHADER: string = "builtin/shaders/spotlight.fshader";

    initBufferObject(): void {
        this.bufferObjectKey = SpotlightShader.KEY;
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

		const spotlightOptions = this.getOptions(options.spotlight);


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

        // Draw the quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        const u_LightPosition = gl.getUniformLocation(program, "u_LightPosition");
    gl.uniform2f(u_LightPosition, spotlightOptions.lightPosition.x, spotlightOptions.lightPosition.y);
        
        const u_LightColor = gl.getUniformLocation(program, "u_LightColor");
        let webGL_lightColor = options.lightColor.tolightColor.toWebGL();
		gl.uniform4f(u_LightColor, webGL_lightColor[0], webGL_lightColor[1], webGL_lightColor[2], webGL_lightColor[3]);

		const u_LightRadius = gl.getUniformLocation(program, "u_LightRadius");
		gl.uniform1f(u_LightRadius, options.lightRadius);
	
		const u_AmbientColor = gl.getUniformLocation(program, "u_AmbientColor");
		let webGL_ambientColor = options.ambientColor.toWebGL();
		gl.uniform4f(u_AmbientColor, webGL_ambientColor[0], webGL_ambientColor[1], webGL_ambientColor[2], webGL_ambientColor[3]);
	
		const u_GradientStart = gl.getUniformLocation(program, "u_GradientStart");
		gl.uniform1f(u_GradientStart, options.gradientStart);
	
		const u_GradientEnd = gl.getUniformLocation(program, "u_GradientEnd");
		gl.uniform1f(u_GradientEnd, options.gradientEnd);
	}
	
	getOptions(spotlight: Spotlight): Record<string, any> {
		let options: Record<string, any> = {
			position: spotlight.position,
			size: spotlight.size,
			rotation: spotlight.rotation,
			lightPosition: spotlight.lightPosition,
			lightColor: spotlight.lightColor,
			lightRadius: spotlight.lightRadius,
			ambientColor: spotlight.ambientColor,
			gradientStart: spotlight.gradientStart,
			gradientEnd: spotlight.gradientEnd
		}
		return options;
	}
}
	
