import type { SimulationStrategyItem, Point, SimulationStats } from '../types';

export class QuickLifeStrategy implements SimulationStrategyItem {
  static name = "QuickLife (Flat + Bounding) LLM";

  private width: number;
  private height: number;

  // Текущее и следующее состояние поля (Double Buffering)
  // 0 - мертва, 1 - жива
  private grid: Uint8Array;
  private nextGrid: Uint8Array;

  // Ограничивающая рамка активной зоны (для оптимизации циклов)
  private minX: number;
  private maxX: number;
  private minY: number;
  private maxY: number;

  private lastStepTime = 0;

  constructor(fill: Iterable<Point>, width = 2000, height = 2000) {
    this.width = width;
    this.height = height;

    const size = width * height;
    this.grid = new Uint8Array(size);
    this.nextGrid = new Uint8Array(size);

    // Инициализируем границы "наихудшим" образом (инвертированно)
    this.minX = width;
    this.maxX = 0;
    this.minY = height;
    this.maxY = 0;

    // Первичное заполнение
    for (const { x, y } of fill) {
      this.setCell(x, y);
    }
  }

  // Установка клетки с обновлением границ
  private setCell(x: number, y: number) {
    // Проверка границ поля
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

    this.grid[y * this.width + x] = 1;

    // Расширяем рамку активности
    if (x < this.minX) this.minX = x;
    if (x > this.maxX) this.maxX = x;
    if (y < this.minY) this.minY = y;
    if (y > this.maxY) this.maxY = y;
  }

  nextStep() {
    // const start = performance.now();

    // Расширяем область проверки на 1 клетку вокруг активной зоны,
    // так как жизнь может "родиться" рядом с текущими клетками.
    // Также следим, чтобы не выйти за пределы массива.
    const startX = Math.max(0, this.minX - 1);
    const endX = Math.min(this.width - 1, this.maxX + 1);
    const startY = Math.max(0, this.minY - 1);
    const endY = Math.min(this.height - 1, this.maxY + 1);

    const w = this.width;
    const grid = this.grid;
    const nextGrid = this.nextGrid;

    // Сбрасываем границы следующего поколения
    let nextMinX = w, nextMaxX = 0, nextMinY = this.height, nextMaxY = 0;
    let hasLife = false;

    // Основной цикл только по "горячей" зоне
    for (let y = startY; y <= endY; y++) {
      // Предвычисляем смещения по строкам для оптимизации
      const yOffset = y * w;
      const yMinus = (y - 1) * w;
      const yPlus = (y + 1) * w;

      // Проверка граничных условий по Y для соседей
      const hasTop = y > 0;
      const hasBottom = y < this.height - 1;

      for (let x = startX; x <= endX; x++) {
        // Подсчет соседей
        let neighbors = 0;

        // Верхний ряд
        if (hasTop) {
          if (x > 0 && grid[yMinus + x - 1]) neighbors++;
          if (grid[yMinus + x]) neighbors++;
          if (x < w - 1 && grid[yMinus + x + 1]) neighbors++;
        }

        // Средний ряд (слева и справа)
        if (x > 0 && grid[yOffset + x - 1]) neighbors++;
        if (x < w - 1 && grid[yOffset + x + 1]) neighbors++;

        // Нижний ряд
        if (hasBottom) {
          if (x > 0 && grid[yPlus + x - 1]) neighbors++;
          if (grid[yPlus + x]) neighbors++;
          if (x < w - 1 && grid[yPlus + x + 1]) neighbors++;
        }

        const isAlive = grid[yOffset + x] === 1;
        let willLive = false;

        // Правила игры
        if (isAlive) {
          if (neighbors === 2 || neighbors === 3) willLive = true;
        } else {
          if (neighbors === 3) willLive = true;
        }

        // Запись результата
        if (willLive) {
          nextGrid[yOffset + x] = 1;

          // Обновление границ для следующего кадра
          if (x < nextMinX) nextMinX = x;
          if (x > nextMaxX) nextMaxX = x;
          if (y < nextMinY) nextMinY = y;
          if (y > nextMaxY) nextMaxY = y;
          hasLife = true;
        } else {
          // Важно очистить клетку в буфере, так как мы используем swap
          nextGrid[yOffset + x] = 0;
        }
      }
    }

    // Если жизни не осталось, сбрасываем границы
    if (!hasLife) {
      this.minX = 0; this.maxX = 0;
      this.minY = 0; this.maxY = 0;
    } else {
      this.minX = nextMinX; this.maxX = nextMaxX;
      this.minY = nextMinY; this.maxY = nextMaxY;
    }

    // Swap buffers (меняем местами ссылки на массивы)
    this.grid = nextGrid;
    this.nextGrid = grid; // Старый grid теперь становится буфером для записи

    // this.lastStepTime = performance.now() - start;
  }

  *getLiveCells(): Iterable<Point> {
    const w = this.width;
    // Проходим только по актуальной зоне
    for (let y = this.minY; y <= this.maxY; y++) {
      const offset = y * w;
      for (let x = this.minX; x <= this.maxX; x++) {
        if (this.grid[offset + x]) {
          yield { x, y };
        }
      }
    }
  }

  getStats(): SimulationStats {
    // Подсчет популяции "ленивый" или можно считать в nextStep
    // Для скорости здесь просто вернем 0 или посчитаем по требованию. 
    // Чтобы контракт был честным, посчитаем (быстро, т.к. bounded):
    let pop = 0;
    const w = this.width;
    for (let y = this.minY; y <= this.maxY; y++) {
      const offset = y * w;
      for (let x = this.minX; x <= this.maxX; x++) {
        if (this.grid[offset + x]) pop++;
      }
    }

    return {
      stepTime: this.lastStepTime,
      population: pop
    };
  }
}