import { algorithmsSelector, generatorSelector, renderSelector, /* startButton, */ xSpan, ySpan } from './dom';

import { generators } from './generators';
import { simulationManager } from './manager';
import { renders } from './renders';
import { algorithms } from './simulation';


function fillSelectElement(select: HTMLSelectElement, values: string[]) {
  select.append(...values.map((value, index) => {
    const
      option = document.createElement('option');
    option.value = String(index);
    // if (0 === index)
    //   option.selected = true;
    option.textContent = value;
    select.append(option);
    return option;
  }));
  (select.firstElementChild as HTMLOptionElement).selected = true;
}


export function fillSelects() {
  fillSelectElement(generatorSelector, generators.map(([name]) => name));
  fillSelectElement(algorithmsSelector, algorithms.map(({ name }) => name));
  fillSelectElement(renderSelector, renders.map(({ name }) => name));
  xSpan.textContent = simulationManager.w.toLocaleString();
  ySpan.textContent = simulationManager.h.toLocaleString();
}

// simulationManager.setGenerator(generators[0]);
// simulationManager.setAlgo(algorithms[0]);
// simulationManager.setRenderer(renders[0]);

// startButton.click()