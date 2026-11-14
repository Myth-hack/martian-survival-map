/**
 * Jezero Crater Real Terrain Elevation & Topographic Gradient Service
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 *
 * Ground truth data sourced directly from:
 * 1. USGS Astrogeology Science Center Mars 2020 CTX DEM Science Mosaic (20m/px)
 *    URL: https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif
 * 2. USGS / NASA PDS Mars 2020 HiRISE Landing Site DTM (1m/px)
 *    URL: https://planetarymaps.usgs.gov/mosaic/mars2020_trn/HiRISE/JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m_Eqc_latTs0_lon0_blend40.tif
 *
 * Coordinate Reference System: Equirectangular Mars 2000 Sphere IAU (R = 3,396,190m, standard parallel = 18.4663° N)
 * Vertical Datum: MOLA IAU 2000 Areoid
 * License: U.S. Public Domain / NASA Open Science Data
 */

import jezeroData from '../data/jezeroDemMatrix.json';
import { MarsCoordinates } from '../types';

export interface JezeroDemMetadata {
  title: string;
  primarySourceUrl: string;
  hiriseSourceUrl: string;
  pdsArchiveUrl: string;
  coordinateReferenceSystem: string;
  verticalDatum: string;
  elevationUnits: string;
  spatialResolutionMeters: number;
  sourceResolutionMeters: number;
  license: string;
  attribution: string;
}

export interface TerrainElevationResult {
  elevationMeters: number;
  isRealDem: boolean;
  dataSource: 'USGS_CTX_HIRISE_DEM' | 'MOLA_REGIONAL_BASELINE' | 'ANALYTICAL_DERIVED';
  attribution: string;
}

export interface TerrainSlopeResult {
  slopeDeg: number;
  elevDeltaMeters: number;
  distanceMeters: number;
  isDerivedFromRealDem: boolean;
}

export const JEZERO_DEM_METADATA: JezeroDemMetadata = jezeroData.datasetMetadata;
export const JEZERO_DEM_BOUNDS = jezeroData.bounds;
export const JEZERO_DEM_GRID = jezeroData.gridSize;

/**
 * Determine whether a given latitude/longitude coordinate falls within
 * the verified USGS Jezero DEM bounding box.
 */
export function isPointWithinJezeroDem(lat: number, lon: number): boolean {
  return (
    lat >= JEZERO_DEM_BOUNDS.minLat &&
    lat <= JEZERO_DEM_BOUNDS.maxLat &&
    lon >= JEZERO_DEM_BOUNDS.minLon &&
    lon <= JEZERO_DEM_BOUNDS.maxLon
  );
}

/**
 * Bilinear interpolation over the verified 40m quantized USGS CTX/HiRISE DEM matrix.
 * Returns null if the coordinate is outside the DEM bounds.
 */
export function interpolateJezeroElevation(lat: number, lon: number): number | null {
  if (!isPointWithinJezeroDem(lat, lon)) {
    return null;
  }

  const { minLat, maxLat, minLon, maxLon } = JEZERO_DEM_BOUNDS;
  const { rows, cols } = JEZERO_DEM_GRID;

  // In the raster grid:
  // Row 0 is at maxLat (North), Row (rows - 1) is at minLat (South)
  // Col 0 is at minLon (West), Col (cols - 1) is at maxLon (East)
  const rFloat = ((maxLat - lat) / (maxLat - minLat)) * (rows - 1);
  const cFloat = ((lon - minLon) / (maxLon - minLon)) * (cols - 1);

  // Clamp floating indices safely to grid extents
  const rClamped = Math.max(0, Math.min(rows - 1, rFloat));
  const cClamped = Math.max(0, Math.min(cols - 1, cFloat));

  const r0 = Math.floor(rClamped);
  const r1 = Math.min(rows - 1, r0 + 1);
  const c0 = Math.floor(cClamped);
  const c1 = Math.min(cols - 1, c0 + 1);

  const dr = rClamped - r0;
  const dc = cClamped - c0;

  const elevations = jezeroData.elevations as number[];
  const z00 = elevations[r0 * cols + c0];
  const z01 = elevations[r0 * cols + c1];
  const z10 = elevations[r1 * cols + c0];
  const z11 = elevations[r1 * cols + c1];

  // Bivariate linear polynomial interpolation
  const interpolated =
    (1 - dr) * ((1 - dc) * z00 + dc * z01) +
    dr * ((1 - dc) * z10 + dc * z11);

  return Math.round(interpolated * 10) / 10;
}

/**
 * Primary elevation query function for any planetary coordinate.
 * Returns real USGS DEM elevation when within Jezero coverage,
 * or gracefully falls back to the MOLA datum baseline.
 */
export function getTerrainElevation(
  lat: number,
  lon: number,
  fallbackBaseline?: number
): TerrainElevationResult {
  const realElev = interpolateJezeroElevation(lat, lon);
  if (realElev !== null) {
    return {
      elevationMeters: realElev,
      isRealDem: true,
      dataSource: 'USGS_CTX_HIRISE_DEM',
      attribution: 'USGS Astrogeology / NASA Mars 2020 CTX-HiRISE DTM'
    };
  }

  // Fallback to MOLA Areoid regional estimate
  const fallback = fallbackBaseline ?? -2500;
  return {
    elevationMeters: fallback,
    isRealDem: false,
    dataSource: 'MOLA_REGIONAL_BASELINE',
    attribution: 'MOLA Regional Interpolation (Simulated/Derived Baseline)'
  };
}

/**
 * Physical slope calculation between two surface points.
 * Returns slope angle in degrees and records whether it was derived
 * from real DEM elevation pixels.
 */
export function calculateTerrainSlope(
  p1: MarsCoordinates,
  p2: MarsCoordinates,
  distanceMeters: number
): TerrainSlopeResult {
  const elev1Res = getTerrainElevation(p1.lat, p1.lon, p1.elevationMeters);
  const elev2Res = getTerrainElevation(p2.lat, p2.lon, p2.elevationMeters);

  const elevDeltaMeters = Math.abs(elev2Res.elevationMeters - elev1Res.elevationMeters);
  const effectiveDistance = Math.max(1, distanceMeters);

  const slopeRad = Math.atan(elevDeltaMeters / effectiveDistance);
  const slopeDeg = (slopeRad * 180) / Math.PI;

  return {
    slopeDeg: Math.round(slopeDeg * 100) / 100,
    elevDeltaMeters: Math.round(elevDeltaMeters * 10) / 10,
    distanceMeters: Math.round(effectiveDistance * 10) / 10,
    isDerivedFromRealDem: elev1Res.isRealDem && elev2Res.isRealDem
  };
}
