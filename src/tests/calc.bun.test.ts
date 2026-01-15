import { describe, test, expect } from "bun:test";

import type { SimulationStrategyClass, Point } from '../types';
import { algorithms } from '../simulation';



// Хелпер для сортировки точек, чтобы сравнение массивов работало корректно
// независимо от порядка элементов, который возвращает итератор Map
const sortPoints = (points: Point[]) => {
  return points
    .map(({ x, y }) => ({ x, y })) // Очищаем от лишних свойств, если они есть
    .sort((a, b) => a.x - b.x || a.y - b.y);
};

// Хелпер конвертации кортежей в Point
function convert(p: readonly (readonly [number, number])[]): Point[] {
  return p.map(([x, y]) => ({ x, y }));
}

const
  BLOCK = [[0, 0], [1, 0], [0, 1], [1, 1]] as const, // Ящик (Статичный)

  // Мигалка (Период 2)
  BLINKER_V = [[1, 0], [1, 1], [1, 2]] as const, // T0 (Вертикальная)
  BLINKER_H = [[0, 1], [1, 1], [2, 1]] as const, // T1 (Горизонтальная)

  // Глайдер (Движущийся)
  GLIDER_0 = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]] as const, // T0
  GLIDER_1 = [[0, 1], [2, 1], [1, 2], [2, 2], [1, 3]] as const, // T1
  GLIDER_2 = [[2, 1], [0, 2], [2, 2], [1, 3], [2, 3]] as const; // T2



// Типизация тестовых кейсов: [Начало, Шаг 1, Шаг 2]
type TestCase = [Point[], Point[], Point[]];

const cases: TestCase[] = [
  // Тест 1: Блок (не меняется)
  [convert(BLOCK), convert(BLOCK), convert(BLOCK)],
  // Тест 2: Мигалка (меняется туда-сюда)
  [convert(BLINKER_V), convert(BLINKER_H), convert(BLINKER_V)],
  // Тест 3: Глайдер (сдвигается и меняет форму)
  [convert(GLIDER_0), convert(GLIDER_1), convert(GLIDER_2)]
];

describe.each(algorithms)("Testing class: %p", (StrategyClass: SimulationStrategyClass) => {
  test.each(cases)("simulation check 1 and 2 steps", (startState, expectedStep1, expectedStep2) => {
    // Инициализация
    const item = new StrategyClass(startState);

    // --- Шаг 1 ---
    item.nextStep();
    const res1 = Array.from(item.getLiveCells()); // Преобразуем итератор в массив

    expect(sortPoints(res1)).toEqual(sortPoints(expectedStep1));

    // --- Шаг 2 ---
    item.nextStep();
    const res2 = Array.from(item.getLiveCells());

    expect(sortPoints(res2)).toEqual(sortPoints(expectedStep2));
  });
});