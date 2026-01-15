import type { SimulationStrategyItem, Point, SimulationStats } from '../types';

export class FastMapStrategy implements SimulationStrategyItem {
  static name = "Map LLM";
  
  // Храним только ключи живых клеток. 
  // Это экономит память и убирает необходимость хранить состояние "мертвых" соседей.
  private liveCells = new Set<number>();
  private lastStepTime = 0;

  constructor(fill: Iterable<Point>) {
    // Начальное заполнение
    for (const { x, y } of fill) {
      this.liveCells.add(FastMapStrategy.pack(x, y));
    }
  }

  // Быстрая упаковка координат в один Int32 (диапазон -32768..32767)
  // (x & 0xFFFF) берет младшие 16 бит, (y << 16) сдвигает y в старшие 16 бит.
  private static pack(x: number, y: number): number {
    return (x & 0xFFFF) | (y << 16);
  }

  // Распаковка для вывода (восстанавливает знак через сдвиги)
  private static unpack(key: number): Point {
    return {
      x: (key << 16) >> 16,
      y: key >> 16
    };
  }

  nextStep() {
    // const start = performance.now();
    
    // Map: Ключ клетки -> Количество живых соседей
    const counts = new Map<number, number>();
    const live = this.liveCells;

    // 1. Проход только по живым клеткам
    for (const key of live) {
      // Распаковываем "inline" без создания лишних объектов для GC
      const cx = (key << 16) >> 16;
      const cy = key >> 16;

      // Увеличиваем счетчик у всех 8 соседей
      // Развертка цикла (Loop Unrolling) быстрее вложенных for
      this.inc(counts, cx - 1, cy - 1);
      this.inc(counts, cx    , cy - 1);
      this.inc(counts, cx + 1, cy - 1);

      this.inc(counts, cx - 1, cy    );
      this.inc(counts, cx + 1, cy    );

      this.inc(counts, cx - 1, cy + 1);
      this.inc(counts, cx    , cy + 1);
      this.inc(counts, cx + 1, cy + 1);
    }

    // 2. Формирование нового поколения
    const nextLive = new Set<number>();
    
    // Проходим по всем клеткам, у которых есть хотя бы 1 сосед
    for (const [key, count] of counts) {
      if (count === 3) {
        // Рождение (или выживание)
        nextLive.add(key);
      } else if (count === 2 && live.has(key)) {
        // Выживание (2 соседа + была жива)
        nextLive.add(key);
      }
    }

    this.liveCells = nextLive;
    // this.lastStepTime = performance.now() - start;
  }

  // Хелпер для обновления счетчика соседей
  private inc(counts: Map<number, number>, x: number, y: number) {
    const key = (x & 0xFFFF) | (y << 16); // Inline pack
    const val = counts.get(key);
    // Если значения нет, это undefined (falsy), ставим 1. Иначе +1.
    counts.set(key, (val || 0) + 1);
  }

  // Генератор для получения точек
  *getLiveCells(): Iterable<Point> {
    for (const key of this.liveCells) {
      yield FastMapStrategy.unpack(key);
    }
  }

  getStats(): SimulationStats {
    return { 
      stepTime: this.lastStepTime, 
      population: this.liveCells.size 
    };
  }
}