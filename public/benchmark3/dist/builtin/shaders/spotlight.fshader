precision mediump float;

uniform vec2 u_LightPosition;
uniform vec4 u_LightColor;
uniform float u_LightRadius;
uniform vec4 u_AmbientColor;

void main() {
    vec2 lightVector = u_LightPosition - gl_FragCoord.xy;
    float distance = length(lightVector);
    float intensity = 1.0 - distance / u_LightRadius;
    intensity = max(intensity, 0.0);

    vec4 spotlightColor = u_LightColor * intensity + u_AmbientColor;
    gl_FragColor = spotlightColor;
}
