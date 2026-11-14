/**
 * Geo-Scanner & Astrobiology Target Inspection Component
 * Re-exporting ScienceTargetFinder / GeoScanner for modular system imports
 */

export {
  ScienceTargetFinder,
  GeoScanner,
  computePerchlorateMetrics,
  type PerchlorateAnalysisResult,
  type ScienceTargetFinderProps
} from './ScienceTargetFinder';

export { ScienceTargetFinder as default } from './ScienceTargetFinder';
