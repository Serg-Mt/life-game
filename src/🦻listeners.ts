import { runningState, stoppingState } from './data/ids.json'  with {type: "json"};

import { generatorSelector, algorithmsSelector, renderSelector, startButton, stopButton, stateInput } from './dom';
import { generators } from './generators';
import { simulationManager } from './manager';
import { renders } from './renders';
import { algorithms } from './simulation';



function stop() {
  simulationManager.stop();
}

function start() {
  simulationManager.start();
}

generatorSelector.addEventListener('change', ev => simulationManager.setGenerator(generators[+(ev.target as HTMLSelectElement).value]));
algorithmsSelector.addEventListener('change', ev => simulationManager.setAlgo(algorithms[+(ev.target as HTMLSelectElement).value]));
renderSelector.addEventListener('change', ev => simulationManager.setRenderer(renders[+(ev.target as HTMLSelectElement).value]));
startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);



simulationManager.eventTarget.addEventListener('changeState',
  () =>
    stateInput
      .setAttribute('value',
        simulationManager.isRunning
          ? runningState
          : stoppingState)
)

generatorSelector.dispatchEvent(new Event('change'));
algorithmsSelector.dispatchEvent(new Event('change'));
renderSelector.dispatchEvent(new Event('change'));