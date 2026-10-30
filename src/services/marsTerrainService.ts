/**
 * Multi-Region Planetary GIS & Topographic Terrain Service
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 *
 * Unified scientific exploration terrain engine supporting 10 distinct Martian regions:
 * 1. Jezero Crater (Perseverance / USGS CTX-HiRISE 40m DEM matrix)
 * 2. Gale Crater (Curiosity / MSL MOLA-HRSC Mount Sharp Sedimentary Model)
 * 3. Valles Marineris (Grand Canyon / MOLA-HRSC 7km Deep Chasm Stratigraphy)
 * 4. Olympus Mons (Shield Volcano / MOLA 21.3km Summit Caldera)
 * 5. Planum Boreum (North Polar Ice Cap / MOLA-SHARAD Polar Cryosphere)
 * 6. Hellas Planitia (Impact Basin / MOLA Deep Basin -7.15km Elevation)
 * 7. Elysium Planitia (InSight Seismology Plain / MOLA Smooth Basaltic Pavement)
 * 8. Meridiani Planum (Opportunity / MER-B Hematite Spherule Plains)
 * 9. Noctis Labyrinthus (Swarm Rescue Zone / MOLA-HRSC Graben Faults)
 * 10. Acidalia Planitia (Ares III / MOLA Northern Lowland Permafrost Sheet)
 *
 * Ground truth data sources:
 * - USGS Astrogeology Science Center (CTX & HiRISE DTMs)
 * - NASA PDS Geosciences Node (MOLA MEGDR 128ppd Topography)
 * - ESA Mars Express HRSC Digital Terrain Models
 */

import jezeroData from '../data/jezeroDemMatrix.json';
import galeData from '../data/galeDemMatrix.json';
import vallesData from '../data/vallesDemMatrix.json';
import olympusData from '../data/olympusDemMatrix.json';
import planumBoreumData from '../data/planumBoreumDemMatrix.json';
import hellasData from '../data/hellasDemMatrix.json';
import elysiumData from '../data/elysiumDemMatrix.json';
import meridianiData from '../data/meridianiDemMatrix.json';
import noctisData from '../data/noctisDemMatrix.json';
import acidaliaData from '../data/acidaliaDemMatrix.json';

import { MarsCoordinates, MapRegionId, DataProvenance } from '../types';

export interface RegionalDemMetadata {
  title: string;
  regionId: MapRegionId;
  primarySourceUrl: string;
  secondarySourceUrl?: string;
  coordinateReferenceSystem: string;
  verticalDatum: string;
  elevationUnits: string;
  spatialResolutionMeters: number;
  sourceResolutionMeters: number;
  license: string;
  attribution: string;
  isPolarProjection?: boolean;
}

export interface RawDemDataset {
  datasetMetadata: {
    title: string;
    primarySourceUrl: string;
    secondarySourceUrl?: string;
    coordinateReferenceSystem: string;
    verticalDatum: string;
    elevationUnits: string;
    spatialResolutionMeters: number;
    sourceResolutionMeters: number;
    license: string;
    attribution: string;
    provenanceLabel?: string;
  };
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  gridSize: { rows: number; cols: number };
  elevations: number[];
}

export interface TerrainElevationResult {
  elevationMeters: number;
  isRealDem: boolean;
  dataSource: string;
  attribution: string;
  resolutionMeters: number;
  provenance: DataProvenance;
}

export interface TerrainSlopeResult {
  slopeDeg: number;
  elevDeltaMeters: number;
  distanceMeters: number;
  isDerivedFromRealDem: boolean;
  isCanyonCliffWall?: boolean;
  isPolarRegion?: boolean;
}

export const REGIONAL_DEM_DATASETS: Record<MapRegionId, RawDemDataset> = {
  jezero: jezeroData as unknown as RawDemDataset,
  gale: galeData as unknown as RawDemDataset,
  valles_marineris: vallesData as unknown as RawDemDataset,
  olympus_mons: olympusData as unknown as RawDemDataset,
  planum_boreum: planumBoreumData as unknown as RawDemDataset,
  hellas_planitia: hellasData as unknown as RawDemDataset,
  elysium_planitia: elysiumData as unknown as RawDemDataset,
  meridiani_planum: meridianiData as unknown as RawDemDataset,
  noctis_labyrinthus: noctisData as unknown as RawDemDataset,
  acidalia_planitia: acidaliaData as unknown as RawDemDataset,
};

export const REGIONAL_DEM_METADATA: Record<MapRegionId, RegionalDemMetadata> = {
  jezero: {
    title: 'USGS / NASA Mars 2020 Jezero Crater CTX & HiRISE Topographic Model',
    regionId: 'jezero',
    primarySourceUrl: 'https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif',
    secondarySourceUrl: 'https://planetarymaps.usgs.gov/mosaic/mars2020_trn/HiRISE/JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m_Eqc_latTs0_lon0_blend40.tif',
    coordinateReferenceSystem: 'Equirectangular Mars 2000 Sphere IAU (Datum: Mars_2000_Sphere, R=3396190 m, standard parallel=18.4663° N)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 40,
    sourceResolutionMeters: 20,
    license: 'U.S. Public Domain / NASA Open Science Data',
    attribution: 'USGS Astrogeology Science Center / NASA JPL-Caltech / University of Arizona'
  },
  gale: {
    title: 'NASA PDS MSL Gale Crater & Mount Sharp Sedimentary Topographic Model',
    regionId: 'gale',
    primarySourceUrl: 'https://pds-geosciences.wustl.edu/msl/msl-m-navcam-5-dtm-v1/msl_dtm/',
    secondarySourceUrl: 'https://hirise.lpl.arizona.edu/dtm/dtm.php?ID=PSP_009149_1750',
    coordinateReferenceSystem: 'Equirectangular Mars 2000 Sphere IAU (Standard parallel=4.5° S)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 50,
    sourceResolutionMeters: 25,
    license: 'NASA / PDS Open Data Policy',
    attribution: 'NASA JPL-Caltech / Malin Space Science Systems / USGS'
  },
  valles_marineris: {
    title: 'ESA Mars Express HRSC & MOLA Valles Marineris Chasm Topographic Model',
    regionId: 'valles_marineris',
    primarySourceUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
    secondarySourceUrl: 'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express',
    coordinateReferenceSystem: 'Equirectangular Mars 2000 Sphere IAU (Standard parallel=14.0° S)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 100,
    sourceResolutionMeters: 50,
    license: 'ESA / NASA Open Science Data',
    attribution: 'ESA / DLR / FU Berlin / NASA MGS MOLA Team'
  },
  olympus_mons: {
    title: 'MGS MOLA Megdr High-Relief Olympus Mons Shield Volcano Topography',
    regionId: 'olympus_mons',
    primarySourceUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
    coordinateReferenceSystem: 'Equirectangular Mars 2000 Sphere IAU (Standard parallel=18.5° N)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 200,
    sourceResolutionMeters: 128,
    license: 'NASA PDS Public Domain',
    attribution: 'NASA Goddard Space Flight Center / MOLA Science Team'
  },
  planum_boreum: {
    title: 'MOLA & SHARAD North Polar Cryosphere Topographic & Ice Model',
    regionId: 'planum_boreum',
    primarySourceUrl: 'https://pds-geosciences.wustl.edu/mro/mro-m-sharad-5-radargram-v1/',
    coordinateReferenceSystem: 'Polar Stereographic Mars 2000 IAU (Standard latitude=80.0° N)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 150,
    sourceResolutionMeters: 100,
    license: 'NASA PDS Open Data',
    attribution: 'NASA / ASI / MRO SHARAD & MGS MOLA Science Teams',
    isPolarProjection: true
  },
  hellas_planitia: {
    title: 'MGS MOLA Deep Basin Hellas Planitia Topography & Pressure Datum',
    regionId: 'hellas_planitia',
    primarySourceUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
    coordinateReferenceSystem: 'Equirectangular Mars 2000 Sphere IAU (Standard parallel=42.4° S)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 200,
    sourceResolutionMeters: 128,
    license: 'NASA PDS Open Data',
    attribution: 'NASA GSFC / MOLA Science Team'
  },
  elysium_planitia: {
    title: 'InSight Landing Site & Elysium Volcanic Plain Topography',
    regionId: 'elysium_planitia',
    primarySourceUrl: 'https://pds-geosciences.wustl.edu/insight/',
    secondarySourceUrl: 'https://hirise.lpl.arizona.edu/dtm/',
    coordinateReferenceSystem: 'Equirectangular Mars 2000 Sphere IAU (Standard parallel=3.0° N)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 60,
    sourceResolutionMeters: 30,
    license: 'NASA PDS Open Data',
    attribution: 'NASA JPL-Caltech / InSight SEIS & MRO HiRISE Teams'
  },
  meridiani_planum: {
    title: 'Opportunity MER-B Meridiani Planum Hematite Plains Topography',
    regionId: 'meridiani_planum',
    primarySourceUrl: 'https://pds-geosciences.wustl.edu/mer/mer2-m-mola-5-dem-v1/',
    coordinateReferenceSystem: 'Equirectangular Mars 2000 Sphere IAU (Standard parallel=0.0°)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 80,
    sourceResolutionMeters: 40,
    license: 'NASA PDS Open Data',
    attribution: 'NASA JPL-Caltech / MER Science Team / USGS'
  },
  noctis_labyrinthus: {
    title: 'ESA HRSC & MOLA Noctis Labyrinthus Graben Canyon Complex',
    regionId: 'noctis_labyrinthus',
    primarySourceUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
    secondarySourceUrl: 'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express',
    coordinateReferenceSystem: 'Equirectangular Mars 2000 Sphere IAU (Standard parallel=7.0° S)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 100,
    sourceResolutionMeters: 50,
    license: 'ESA / NASA Open Science Data',
    attribution: 'ESA / DLR / FU Berlin / NASA MGS MOLA Team'
  },
  acidalia_planitia: {
    title: 'MOLA Northern Lowlands Acidalia Planitia Topography',
    regionId: 'acidalia_planitia',
    primarySourceUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
    coordinateReferenceSystem: 'Equirectangular Mars 2000 Sphere IAU (Standard parallel=50.0° N)',
    verticalDatum: 'MOLA IAU 2000 Areoid',
    elevationUnits: 'meters',
    spatialResolutionMeters: 150,
    sourceResolutionMeters: 128,
    license: 'NASA PDS Open Data',
    attribution: 'NASA GSFC / MOLA Science Team'
  }
};

export const REGIONAL_BOUNDS: Record<MapRegionId, { minLat: number; maxLat: number; minLon: number; maxLon: number }> = {
  jezero: { minLat: 18.15, maxLat: 18.60, minLon: 77.20, maxLon: 77.95 },
  gale: { minLat: -5.85, maxLat: -4.35, minLon: 137.10, maxLon: 138.10 },
  valles_marineris: { minLat: -17.5, maxLat: -10.0, minLon: -66.0, maxLon: -52.0 },
  olympus_mons: { minLat: 15.0, maxLat: 22.5, minLon: -140.0, maxLon: -127.5 },
  planum_boreum: { minLat: 82.0, maxLat: 90.0, minLon: -180.0, maxLon: 180.0 },
  hellas_planitia: { minLat: -47.0, maxLat: -37.5, minLon: 64.0, maxLon: 77.0 },
  elysium_planitia: { minLat: 1.0, maxLat: 5.0, minLon: 152.0, maxLon: 157.5 },
  meridiani_planum: { minLat: -1.5, maxLat: 1.1, minLon: 355.5, maxLon: 359.5 },
  noctis_labyrinthus: { minLat: -9.5, maxLat: -4.5, minLon: -106.0, maxLon: -98.0 },
  acidalia_planitia: { minLat: 46.5, maxLat: 53.0, minLon: 334.0, maxLon: 345.0 }
};

/**
 * Check if a coordinate falls within the verified bounding box of a specific region.
 */
export function isPointWithinRegionBounds(regionId: MapRegionId, lat: number, lon: number): boolean {
  const bounds = REGIONAL_BOUNDS[regionId];
  if (!bounds) return false;
  return lat >= bounds.minLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon;
}

/**
 * Bilinear interpolation over any region's DEM matrix.
 */
export function interpolateRegionalDemElevation(regionId: MapRegionId, lat: number, lon: number): number | null {
  const dataset = REGIONAL_DEM_DATASETS[regionId];
  if (!dataset) return null;

  const { minLat, maxLat, minLon, maxLon } = dataset.bounds;
  if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) {
    return null;
  }

  const { rows, cols } = dataset.gridSize;
  const rFloat = ((maxLat - lat) / (maxLat - minLat)) * (rows - 1);
  const cFloat = ((lon - minLon) / (maxLon - minLon)) * (cols - 1);

  const rClamped = Math.max(0, Math.min(rows - 1, rFloat));
  const cClamped = Math.max(0, Math.min(cols - 1, cFloat));

  const r0 = Math.floor(rClamped);
  const r1 = Math.min(rows - 1, r0 + 1);
  const c0 = Math.floor(cClamped);
  const c1 = Math.min(cols - 1, c0 + 1);

  const dr = rClamped - r0;
  const dc = cClamped - c0;

  const elevations = dataset.elevations;
  const z00 = elevations[r0 * cols + c0];
  const z01 = elevations[r0 * cols + c1];
  const z10 = elevations[r1 * cols + c0];
  const z11 = elevations[r1 * cols + c1];

  const interpolated =
    (1 - dr) * ((1 - dc) * z00 + dc * z01) +
    dr * ((1 - dc) * z10 + dc * z11);

  return Math.round(interpolated * 10) / 10;
}

/**
 * Bilinear interpolation over the verified 40m USGS CTX/HiRISE DEM matrix for Jezero Crater.
 */
export function interpolateJezeroElevation(lat: number, lon: number): number | null {
  return interpolateRegionalDemElevation('jezero', lat, lon);
}

/**
 * Primary multi-region elevation query function.
 * Queries verified DEM matrices across all 10 regions with bilinear interpolation.
 */
export function getTerrainElevation(
  lat: number,
  lon: number,
  regionId: MapRegionId = 'jezero',
  fallbackBaseline?: number
): TerrainElevationResult {
  const meta = REGIONAL_DEM_METADATA[regionId] || REGIONAL_DEM_METADATA.jezero;

  // Attempt bilinear DEM matrix interpolation for the requested region
  const demElev = interpolateRegionalDemElevation(regionId, lat, lon);
  if (demElev !== null) {
    const isJezero = regionId === 'jezero';
    return {
      elevationMeters: demElev,
      isRealDem: true,
      dataSource: isJezero ? 'USGS_CTX_HIRISE_DEM' : meta.title,
      attribution: meta.attribution,
      resolutionMeters: meta.spatialResolutionMeters,
      provenance: isJezero ? 'LIVE_NASA' : 'DERIVED'
    };
  }

  // Fallback outside region bounds
  const fallback = fallbackBaseline ?? -2500;
  return {
    elevationMeters: fallback,
    isRealDem: false,
    dataSource: 'MOLA_REGIONAL_BASELINE',
    attribution: 'MOLA Regional Interpolation (Global Baseline)',
    resolutionMeters: 463, // 128ppd baseline
    provenance: 'FALLBACK'
  };
}

/**
 * Physical slope calculation between two surface points in any specified region.
 */
export function calculateTerrainSlope(
  p1: MarsCoordinates,
  p2: MarsCoordinates,
  distanceMeters: number,
  regionId: MapRegionId = 'jezero'
): TerrainSlopeResult {
  const elev1Res = getTerrainElevation(p1.lat, p1.lon, regionId, p1.elevationMeters);
  const elev2Res = getTerrainElevation(p2.lat, p2.lon, regionId, p2.elevationMeters);

  const elevDeltaMeters = Math.abs(elev2Res.elevationMeters - elev1Res.elevationMeters);
  const effectiveDistance = Math.max(1, distanceMeters);

  const slopeRad = Math.atan(elevDeltaMeters / effectiveDistance);
  const slopeDeg = (slopeRad * 180) / Math.PI;

  const isCanyonCliffWall = (regionId === 'valles_marineris' || regionId === 'olympus_mons') && slopeDeg > 30.0;
  const isPolarRegion = regionId === 'planum_boreum';

  return {
    slopeDeg: Math.round(slopeDeg * 100) / 100,
    elevDeltaMeters: Math.round(elevDeltaMeters * 10) / 10,
    distanceMeters: Math.round(effectiveDistance * 10) / 10,
    isDerivedFromRealDem: elev1Res.isRealDem && elev2Res.isRealDem,
    isCanyonCliffWall,
    isPolarRegion
  };
}
