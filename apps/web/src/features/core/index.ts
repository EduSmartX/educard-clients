/**
 * Core Module Exports
 * Exports for core/master data functionality
 */

export { fetchCoreSubjects } from './api/core-subjects-api';
export { useCoreSubjects } from './hooks/use-core-subjects';
export type { CoreSubject } from './api/core-subjects-api';

export { fetchCoreClasses } from './api/core-classes-api';
export { useCoreClasses } from './hooks/use-core-classes';
export type { CoreClass } from './api/core-classes-api';
