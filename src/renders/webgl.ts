import { RendererStrategyClass, type Point, type RendererStrategyClassType } from '../types';

export class WebGLRenderer extends RendererStrategyClass {
  static name = "WebGL 2.0 (Instanced)";

  declare private gl: WebGL2RenderingContext;
  private program!: WebGLProgram;

  // Locations
  private uResolutionLoc!: WebGLUniformLocation;
  private uColorLoc!: WebGLUniformLocation;

  // Buffers
  private instanceBuffer!: WebGLBuffer;
  private vao!: WebGLVertexArrayObject;

  // Data
  private maxCapacity = 10000; // Начальная емкость буфера (количество клеток)
  private instanceData = new Float32Array(this.maxCapacity * 2); // x, y для каждой клетки

  createNewElement() {
    const canvas = document.createElement('canvas');
    // Настраиваем размер канваса (пиксели)
    // Можно добавить множитель для HiDPI экранов
    const pixelScale = 4; // Размер клетки в пикселях
    canvas.width = this.w * pixelScale;
    canvas.height = this.h * pixelScale;

    // Стилизация для корректного отображения
    canvas.style.imageRendering = 'pixelated';

    this.container.appendChild(canvas);

    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
    if (!gl) {
      throw new Error("WebGL 2.0 not supported");
    }
    this.gl = gl;


  }

  constructor(...params: ConstructorParameters<RendererStrategyClassType>) {
    super(...params);
    this.initShaders();
    this.initBuffers();
  }

  private initShaders() {
    // Vertex Shader
    // Рисует квадрат 1x1 и смещает его согласно instanceData (a_offset)
    const vsSource = `#version 300 es
    in vec2 a_position;    // Вершины самого квадрата (0..1)
    in vec2 a_offset;      // Координаты клетки (x, y) - инстанс
    
    uniform vec2 u_resolution;
    
    void main() {
      // Позиция пикселя = позиция клетки + вершина квадрата
      vec2 pos = a_offset + a_position;
      
      // Преобразуем из пространства сетки (0..W, 0..H) в Clip Space (-1..1)
      vec2 zeroToOne = pos / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
      
      // WebGL координаты: Y вверх, а у нас Y вниз, поэтому переворачиваем Y
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
    `;

    // Fragment Shader
    const fsSource = `#version 300 es
    precision mediump float;
    uniform vec4 u_color;
    out vec4 outColor;
    
    void main() {
      outColor = u_color;
    }
    `;

    this.program = this.createProgram(this.gl, vsSource, fsSource);

    this.uResolutionLoc = this.gl.getUniformLocation(this.program, "u_resolution")!;
    this.uColorLoc = this.gl.getUniformLocation(this.program, "u_color")!;
  }

  private initBuffers() {
    const gl = this.gl;
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    // 1. Геометрия одной клетки (Квадрат 1x1 из двух треугольников)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]), gl.STATIC_DRAW);

    // Атрибут a_position
    const aPositionLoc = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // 2. Буфер координат клеток (Instanced Data)
    this.instanceBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, this.instanceData, gl.DYNAMIC_DRAW);

    // ИСПРАВЛЕНИЕ: Вместо передачи instanceData (который может вызвать ошибку, если пуст),
    // просто выделяем память нужного размера (байт).
    // instanceData.byteLength гарантирует корректный размер.
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.byteLength, gl.DYNAMIC_DRAW);

    // Атрибут a_offset
    const aOffsetLoc = gl.getAttribLocation(this.program, "a_offset");
    gl.enableVertexAttribArray(aOffsetLoc);
    gl.vertexAttribPointer(aOffsetLoc, 2, gl.FLOAT, false, 0, 0);

    // Указываем, что a_offset меняется раз на 1 инстанс (клетку), а не на вершину
    gl.vertexAttribDivisor(aOffsetLoc, 1);
  }


  render(cells: Iterable<Point> | null) {
    if (!cells || !this.gl) return;

    const gl = this.gl;

    // 1. Сбор данных
    let count = 0;
    // Нужно заполнить массив. Если не хватает места, расширяем.
    for (const p of cells) {
      if (count * 2 >= this.instanceData.length) {
        this.resizeBuffer();
      }
      this.instanceData[count * 2] = p.x;
      this.instanceData[count * 2 + 1] = p.y;
      count++;
    }

    // 2. Подготовка отрисовки
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Очистка (черный фон)
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Обновляем Uniforms
    gl.uniform2f(this.uResolutionLoc, this.w, this.h);
    gl.uniform4f(this.uColorLoc, 0.0, 1.0, 0.0, 1.0); // Зеленый цвет

    // 3. Загрузка данных в GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    // Оптимизация: загружаем только ту часть массива, которая используется
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceData.subarray(0, count * 2));

    // 4. Отрисовка (Instanced Draw)
    // 6 вершин на квадрат * count экземпляров
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
  }

  private resizeBuffer() {
    const oldData = this.instanceData;
    this.maxCapacity *= 2;
    this.instanceData = new Float32Array(this.maxCapacity * 2);
    this.instanceData.set(oldData);

    // Нужно пересоздать буфер в WebGL, так как размер увеличился
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceData, gl.DYNAMIC_DRAW);
  }

  // Утилита для компиляции шейдеров
  private createProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
    const vs = this.compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }
    return program;
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile error: ' + info);
    }
    return shader;
  }
}