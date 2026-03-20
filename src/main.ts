import './style.sass'

import { dispatchEventForInitSimManager } from './🦻listeners'
import { simulationManager } from './manager';
import { fillSelects } from './init';

fillSelects();
dispatchEventForInitSimManager();
simulationManager.start();
