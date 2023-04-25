attribute vec2 a_Position;
uniform mat4 u_Transform;

void main() {
    gl_Position = u_Transform * vec4(a_Position, 0.0, 1.0);
}
