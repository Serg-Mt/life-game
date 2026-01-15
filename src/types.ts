export interface Point {
  x: number,
  y: number
}

export interface SimulationStats {
  stepTime: number; // мс
  population: number;
}

export interface SimulationStrategyItem {
  // constructor(width: number, height: number);
  nextStep(): void;
  getLiveCells(): Iterable<Point>;
  // getStats(): SimulationStats;
}

export interface SimulationStrategyClass {
  readonly name: string;
  new(fill:Iterable<Point>, width?: number, height?: number,): SimulationStrategyItem
}



// export interface RendererStrategyItem {

//   // init(container: HTMLElement, width: number, height: number): void;
//   render(cells: Iterable<Point> | null): void;
// }

// type Params = ConstructorParameters<RendererStrategyClass>

export type RendererStrategyClassType = new (
  ...args: ConstructorParameters<typeof RendererStrategyClass>
) => RendererStrategyClass;

export abstract class RendererStrategyClass {

  abstract createNewElement(): void

  constructor(protected container: HTMLElement, protected w: number, protected h: number) {
    console.log('abstract constructor');
    this.clearContainer();
    this.createNewElement();
  }

  clearContainer() {
    this.container.childNodes.forEach(node => node.remove());
  }
  // abstract init(container: HTMLElement, width: number, height: number): void;
  abstract render(cells: Iterable<Point> | null): void;

}



