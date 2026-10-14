import type { Unit } from '../core/quiz';
import type { Grade } from '../core/snapshot';
import { FIGURE_UNITS } from './questions/figures';
import { G3 } from './questions/g3';
import { G4 } from './questions/g4';
import { G5 } from './questions/g5';
import { G6 } from './questions/g6';

/** 全部の単元。学年ごとに、教科書で習う順にならべてある。図やちしきの単元 (FIGURE_UNITS) は、そのあとに続く */
export const UNITS: readonly Unit[] = [...G3, ...G4, ...G5, ...G6, ...FIGURE_UNITS];

export const unitsOf = (grade: Grade): Unit[] => UNITS.filter((u) => u.grade === grade);
export const unitById = (id: string): Unit | undefined => UNITS.find((u) => u.id === id);
