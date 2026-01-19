import type { SimulationStrategyItem, Point } from '../types';

interface xPoint extends Point {
  // x: number,
  // y: number,
  alive: boolean,
  neighbors: number
}

const
  buffer = new ArrayBuffer(4),
  int16 = new Int16Array(buffer),
  uint32 = new Uint32Array(buffer),
  // pack = (a: number, b: number) => a << 15 | b,
  pack = (a: number, b: number) => {
    int16[0] = a;
    int16[1] = b;
    return uint32[0]
  }
// unpack = (x: number) => [x >> 15, x & 0xffff];


export class MapStrategy implements SimulationStrategyItem {
  static name = "Map Diff (die GC)";
  private cells = new Map<number, xPoint>();



  constructor(fill: Iterable<Point>) {
    // console.log('Начальное заполнение');
    for (const { x, y } of fill)
      this.cells.set(/* @__INLINE__ */pack(x, y), { x, y, alive: true, neighbors: 0 });

    // console.log('Подсчет соседей', this.cells.size);
    const state = this.cells.values().filter(c => c.alive);
    for (const cell of state)
      this.birth([cell.x, cell.y]);
    // console.log('генерация заверена', this.cells)
  }

  birth = ([X, Y]: [number, number]) => {
    // console.log('рождение', { X, Y });
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        if (0 === dx && 0 === dy) {
          let cell = this.cells.get(/* @__INLINE__ */pack(X, Y));
          cell!.alive = true;
          continue;
        };
        let
          x = X + dx,
          y = Y + dy,
          coords = /* @__INLINE__ */pack(x, y),
          cell = this.cells.get(coords);
        if (!cell) {
          cell = { x, y, alive: false, neighbors: 0 };
          this.cells.set(coords, cell);
        }
        cell.neighbors++;
      }
  }


  death = ([X, Y]: [number, number]) => {
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        if (0 === dx && 0 === dy) {
          let cell = this.cells.get(/* @__INLINE__ */pack(X, Y));
          cell!.alive = false;
          continue;
        };
        let
          x = X + dx,
          y = Y + dy,
          cell = this.cells.get(/* @__INLINE__ */pack(x, y));
        if (cell)
          cell.neighbors--;
      }
  }

  nextStep() {
    const
      toDeath = [] as [number, number][],
      toBirth = [] as [number, number][];
    // Применяем правила Game of Life
    for (const cell of this.cells.values())
      if (cell.alive) {
        if (cell.neighbors < 2 || cell.neighbors > 3)
          toDeath.push([cell.x, cell.y]);
      } else {
        if (3 === cell.neighbors)
          toBirth.push([cell.x, cell.y])
        else if (cell.neighbors < 1)
          this.cells.delete(/* @__INLINE__ */pack(cell.x, cell.y))
      }
    // console.log({toBirth,toDeath});
    toDeath.forEach(this.death)
    toBirth.forEach(this.birth)
  }

  getLiveCells() { return this.cells.values().filter(c => c.alive); }

}