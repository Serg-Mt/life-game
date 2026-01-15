interface GraphOptions {
  canvasId: string;
  lineCount: number;
  colors?: string[];
  minVal?: number;
  maxVal?: number;
}

export class RealTimeGraph {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private prevValues: (number | null)[];
  private colors: string[];
  private minVal: number;
  private maxVal: number;

  constructor(options: GraphOptions) {
    const canvas = document.getElementById(options.canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error("Canvas element not found");
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!; // alpha: false для оптимизации
    this.prevValues = new Array(options.lineCount).fill(null);
    this.colors = options.colors || ['#00ff00', '#ff0000', '#00ffff', '#ffff00'];
    this.minVal = options.minVal ?? 0;
    this.maxVal = options.maxVal ?? 100;

    // Инициализация фона
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Принимает массив новых значений и сдвигает график на 1 пиксель
   */
  public update(values: number[]): void {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // 1. Сдвигаем существующее изображение влево на 1 пиксель
    ctx.drawImage(this.canvas, 1, 0, width - 1, height, 0, 0, width - 1, height);

    // 2. Очищаем (закрашиваем фоном) последний пиксель справа
    ctx.fillStyle = '#000';
    ctx.fillRect(width - 1, 0, 1, height);

    // 3. Рисуем сегменты линий в образовавшемся пространстве
    values.forEach((val, i) => {
      // Динамическое масштабирование
      if (val > this.maxVal) this.maxVal = val;
      if (val < this.minVal) this.minVal = val;

      const y = this.mapValueToY(val);
      const prevY = this.prevValues[i] !== null ? this.mapValueToY(this.prevValues[i]!) : y;

      ctx.beginPath();
      ctx.strokeStyle = this.colors[i % this.colors.length];
      ctx.lineWidth = 1;
      ctx.moveTo(width - 2, prevY);
      ctx.lineTo(width - 1, y);
      ctx.stroke();

      this.prevValues[i] = val;
    });
  }

  private mapValueToY(val: number): number {
    const range = this.maxVal - this.minVal;
    if (range === 0) return this.canvas.height / 2;
    // Инверсия Y (0 наверху)
    return this.canvas.height - ((val - this.minVal) / range) * this.canvas.height;
  }
}

// Пример использования:
// const graph = new RealTimeGraph({ canvasId: 'graphCanvas', lineCount: 3 });

// function animate() {
//   const data = [
//     Math.random() * 50 + 25, 
//     Math.sin(Date.now() / 500) * 20 + 50,
//     Math.cos(Date.now() / 1000) * 10 + 30
//   ];
//   graph.update(data);
//   requestAnimationFrame(animate);
// }

// animate();