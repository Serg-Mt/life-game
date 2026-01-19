import { RendererStrategyClass, type Point } from '../types';

export class CanvasRenderer extends RendererStrategyClass {
  static name = "Canvas 2D";
  declare public ctx: CanvasRenderingContext2D;
  declare private cellSize;


  createNewElement() {
    this.cellSize = 4;
    // console.log('createNewElement', { this: this });
    const canvas = document.createElement('canvas');
    // console.log(this.w, this.cellSize, this.h, this.cellSize)
    canvas.width = this.w * this.cellSize;
    canvas.height = this.h * this.cellSize;
    this.container.appendChild(canvas);
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    // console.log('ctx=', canvas.getContext('2d'), { ctx: this.ctx });
  }

  render(cells: Iterable<Point> | null) {
    // console.log('render', this.ctx, cells);
    if (!this.ctx || !cells) return;

    // Очистка
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    // Отрисовка клеток
    const
      cellSizeX = this.ctx.canvas.width / this.w,
      cellSizeY = this.ctx.canvas.height / this.h;
    // console.log({ cellSizeX, cellSizeY }, { this: this }, this.ctx.canvas.width);

    this.ctx.fillStyle = '#00ff00';
    for (const cell of cells) {
      this.ctx.fillRect(
        cell.x * cellSizeX,
        cell.y * cellSizeY,
        cellSizeX - 1,
        cellSizeY - 1
      );
      // console.log({ cell });
    }
  }
}

// function getRandomColorRGB() {
//   const r = Math.floor(Math.random() * 256);
//   const g = Math.floor(Math.random() * 256);
//   const b = Math.floor(Math.random() * 256);
//   return `rgb(${r},${g},${b})`
// }