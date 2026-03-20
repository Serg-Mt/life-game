#version 300 es
// Vertex Shader
// Рисует квадрат 1x1 и смещает его согласно instanceData (a_offset)

in vec2 a_position;    // Вершины самого квадрата (0..1)
in vec2 a_offset;      // Координаты клетки (x, y) - инстанс

uniform vec2 u_resolution;

void main() {
  // Позиция пикселя = позиция клетки + вершина квадрата
  vec2 pos = a_offset + a_position;

  // Преобразуем из пространства сетки (0..W, 0..H) в Clip Space (-1..1)
  vec2 zeroToOne = pos / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0f;
  vec2 clipSpace = zeroToTwo - 1.0f;

  // WebGL координаты: Y вверх, а у нас Y вниз, поэтому переворачиваем Y
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}