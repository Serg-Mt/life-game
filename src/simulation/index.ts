import type { SimulationStrategyClass } from '../types';
import { FastMapStrategy } from './fast-map';

import { MapStrategy } from './map';
import { QuickLifeStrategy } from './quick-life';

export const algorithms: SimulationStrategyClass[] = [
  MapStrategy, FastMapStrategy, QuickLifeStrategy, /* HashLifeStrategy */
]