import { infoContainer, mainElement } from './dom';
// import { RealTimeGraph } from './RealTimeGraph';
import type { Point, RendererStrategyClassType, SimulationStrategyClass, SimulationStrategyItem } from './types';

type GeneratorType = (_: number, __: number) => Point[];

const
  FPS = 60,
  MS_FOR_FRAME = 1000 / FPS,
  INFO_Timeout = 1000; // ms

function format(x: number) {
  return `${1000 / INFO_Timeout * Math.round(x)}`;
}



export class SimulationManager {
  declare private generator: GeneratorType;
  declare private algo: SimulationStrategyItem;
  declare private algoClass: SimulationStrategyClass;
  declare private renderer: InstanceType<RendererStrategyClassType>;
  declare timeoutID: NodeJS.Timeout;
  // declare graph: RealTimeGraph;
  public info = {
    algoSumCount: 0,
    algoSumTime: 0,
    renderSumCount: 0,
    renderSumTime: 0,
  } as Record<string,number>

  public eventTarget = new EventTarget;

  w = 200;
  h = 200;

  #isRunning = false;


  get isRunning() {
    return this.#isRunning;
  }

  constructor(private container: HTMLElement, private infoStruct: HTMLElement[]) {
    console.log({ SimulationManager: this })
    // this.graph = new RealTimeGraph({ canvasId: 'graph', lineCount: 2, maxVal: 0.1 });
  }

  regenerate() {
    console.log('regenerate');
    const gen =
      ((this.algo && !(this.algo instanceof this.algoClass))
        ? (this.algo as SimulationStrategyItem).getLiveCells()
        : this?.generator(this.w, this.h)) || [];
    if (this.algoClass)
      this.algo = new this.algoClass(gen, this.w, this.h);
    if (this.algo && this.renderer)
      this.eventTarget.dispatchEvent(new Event('changeState'));
  }

  setGenerator(gen: GeneratorType) {
    console.log('setGenerator');
    this.generator = gen;
    this.regenerate();
  }

  setAlgo(Algo: SimulationStrategyClass) {
    this.algoClass = Algo;
    this.regenerate();
  }

  setRenderer(Renderer: RendererStrategyClassType) {
    console.log('setRenderer');
    this.renderer = new Renderer(this.container, this.w, this.h);
    if (this.algo && this.renderer)
      this.eventTarget.dispatchEvent(new Event('changeState'));
  }

  start() {
    if (!this.algo || !this.renderer) return;
    this.#isRunning = true;
    this.eventTarget.dispatchEvent(new Event('changeState'));
    this.showInfo();
    this.loop();
  }

  stop() {
    clearTimeout(this.timeoutID);
    this.#isRunning = false;
  }


  public showInfo = () => {
    Object.keys(this.info).map((key, i) => {
      this.infoStruct[i].textContent = format(this.info[key] as number);
      this.info[key] = 0;
    });
    this.timeoutID = setTimeout(this.showInfo, INFO_Timeout);
  }

  private loop = (/*  DOMHighResTimeStamp:number */) => {
    let counter = 0;
    if (!this.#isRunning) {
      this.eventTarget.dispatchEvent(new Event('changeState'));
      return;
    }
    const start = performance.now();
    do {
      this.algo.nextStep();
      counter++;
    } while (performance.now() - start < MS_FOR_FRAME);
    const calc = performance.now();


    this.renderer.render(this.algo.getLiveCells());
    const rend = performance.now();

    this.info.algoSumTime += calc - start;
    this.info.algoSumCount += counter;
    this.info.renderSumCount++;
    this.info.renderSumTime += rend - calc;

    // this.graph.update([calc - start, rend - calc]);
    // const stats = this.algo.getStats();
    // this.updateUI(stats);


    setTimeout(this.loop, 0);
    // setImmediate(this.loop);
  }

  // private updateUI(stats: ReturnType<(typeof this.algo.getStats)>) {
  //   // console.log(stats);
  //   // Здесь можно выводить stepTime и population в DOM
  // }
}

export const simulationManager = new SimulationManager(mainElement, [...infoContainer.querySelectorAll('span')] as HTMLElement[]);
simulationManager.eventTarget.addEventListener('changeState', () => console.log('=changeState='))
console.log('[...infoContainer.children]', infoContainer)