import { gliderGun } from './glider-gun';
import { random } from './random';

export const generators = [
  ['random', random],
  ['gliderGun', gliderGun]
] as const;
