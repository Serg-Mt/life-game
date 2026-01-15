import { generatorSelectId, algorithmsSelectId, renderSelectId, startButtonId, stopButtonId, stateId } from './data/ids.json'  with {type: "json"};


export const
  mainElement = document.querySelector('main') as HTMLElement,
  generatorSelector = document.querySelector('#' + generatorSelectId) as HTMLSelectElement,
  algorithmsSelector = document.querySelector('#' + algorithmsSelectId) as HTMLSelectElement,
  renderSelector = document.querySelector('#' + renderSelectId) as HTMLSelectElement,
  startButton = document.querySelector('#' + startButtonId) as HTMLButtonElement,
  stopButton = document.querySelector('#' + stopButtonId) as HTMLButtonElement,
  stateInput = document.querySelector('#' + stateId) as HTMLInputElement,
  output = document.querySelector('output') as HTMLOutputElement;
